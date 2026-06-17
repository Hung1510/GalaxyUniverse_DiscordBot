/**
 * Command loader + dispatcher.
 *
 * New in v0.3:
 *   - Per-command try/catch (item #2) — one broken command doesn't take
 *     down the bot or leave the user staring at no response
 *   - Command execution metrics (item #17) — count per command, hour
 *     buckets for spotting abuse patterns
 */

import { readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, basename } from 'node:path';
import type { Client, Message } from 'discord.js';
import { pathToFileURL } from 'node:url';
import { type Command, type CommandContext, PermissionLevel } from './Command.js';
import { hasPermission, getPermissionLevel } from './Permissions.js';
import { cooldowns } from './Cooldowns.js';
import { metrics } from '../services/MetricsService.js';
import { config } from '../config/config.js';
import { logger } from '../utils/logger.js';
import { errorEmbed } from '../utils/embed.js';
import { t } from '../utils/lang.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const commands = new Map<string, Command>();
const aliases = new Map<string, string>();

export function getAllCommands(): Map<string, Command> {
  return commands;
}

export async function loadCommands(): Promise<void> {
  const commandsRoot = resolve(__dirname, '..', 'commands');
  await loadFromDir(commandsRoot);
  logger.info(`Loaded ${commands.size} commands (${aliases.size} aliases).`);
}

async function loadFromDir(dir: string): Promise<void> {
  for (const entry of readdirSync(dir)) {
    const full = resolve(dir, entry);
    if (statSync(full).isDirectory()) {
      await loadFromDir(full);
      continue;
    }
    if (!entry.endsWith('.js') && !entry.endsWith('.ts')) continue;
    if (entry.endsWith('.d.ts')) continue;

    // Convert to file URL for ESM dynamic import (Windows compatibility).
    const mod = (await import(pathToFileURL(full).href)) as { default?: Command };
    const cmd = mod.default;
    if (!cmd || typeof cmd.execute !== 'function') {
      logger.warn(`Skipping ${basename(full)} — no default Command export.`);
      continue;
    }
    if (commands.has(cmd.name)) {
      logger.warn(`Duplicate command name "${cmd.name}" — skipping ${basename(full)}.`);
      continue;
    }
    commands.set(cmd.name, cmd);
    for (const alias of cmd.aliases ?? []) {
      aliases.set(alias, cmd.name);
    }
  }
}

export async function handleMessage(client: Client<true>, message: Message): Promise<void> {
  if (message.author.bot) return;
  if (!message.inGuild()) return;
  if (!message.content.startsWith(config.prefix)) return;

  const withoutPrefix = message.content.slice(config.prefix.length).trim();
  if (!withoutPrefix) return;

  const tokens = withoutPrefix.split(/\s+/);
  const nameOrAlias = tokens[0]!.toLowerCase();
  const args = tokens.slice(1);

  const resolvedName = commands.has(nameOrAlias)
    ? nameOrAlias
    : aliases.get(nameOrAlias);
  if (!resolvedName) return;

  const command = commands.get(resolvedName)!;

  const member = message.member;
  if (!member) return;

  // Permission check
  const required = command.permission ?? PermissionLevel.USER;
  if (!hasPermission(member, required)) {
    await message.reply({ embeds: [errorEmbed(t('common.no_permission'))] }).catch(() => {});
    return;
  }

  // Cooldown check
  if (command.cooldown && command.cooldown > 0) {
    const remaining = cooldowns.check(message.author.id, command.name, command.cooldown);
    if (remaining > 0) {
      const secs = Math.ceil(remaining / 1000);
      await message.reply({ embeds: [errorEmbed(t('common.cooldown', { secs: String(secs) }))] }).catch(() => {});
      return;
    }
  }

  const ctx: CommandContext = {
    client,
    message: message as Message<true>,
    guild: message.guild!,
    member,
    channel: message.channel,
    args,
    rawArgs: args.join(' '),
  };

  /**
   * Item #2: Per-command try/catch.
   *
   * Without this, an unhandled throw in a command leaves the user with no
   * feedback and pollutes the global unhandledRejection handler. We catch
   * here, log with context, and apologise to the user.
   */
  const t0 = Date.now();
  try {
    await command.execute(ctx);
    metrics.recordCommand(command.name, /* ok */ true, Date.now() - t0);
    logger.info(
      `cmd=${command.name} user=${message.author.tag} guild=${message.guildId} perm=${getPermissionLevel(member)} ok dur=${Date.now() - t0}ms`,
    );
  } catch (err) {
    metrics.recordCommand(command.name, /* ok */ false, Date.now() - t0);
    logger.error(
      `cmd=${command.name} user=${message.author.tag} guild=${message.guildId} FAILED`,
      err,
    );
    await message
      .reply({ embeds: [errorEmbed(t('common.internal_error'))] })
      .catch(() => {});
  }
}
