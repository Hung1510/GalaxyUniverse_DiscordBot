import { readdirSync, statSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';
import type { Client, Message } from 'discord.js';
import { type Command, type CommandContext, PermissionLevel } from './Command.js';
import { hasPermission } from './Permissions.js';
import * as Cooldowns from './Cooldowns.js';
import { env } from '../config/config.js';
import { t } from '../utils/lang.js';
import { errorEmbed } from '../utils/embed.js';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const commands = new Map<string, Command>();

function walkDir(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = resolve(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...walkDir(full));
    } else if (entry.endsWith('.ts') || entry.endsWith('.js')) {
      // Skip .d.ts files
      if (entry.endsWith('.d.ts')) continue;
      out.push(full);
    }
  }
  return out;
}

export async function loadCommands(): Promise<void> {
  const commandsDir = resolve(__dirname, '../commands');
  const files = walkDir(commandsDir);

  for (const file of files) {
    // Dynamic import requires file:// URL on Node ESM
    const mod = (await import(pathToFileURL(file).href)) as { default?: Command };
    const command = mod.default;

    if (!command || typeof command.execute !== 'function') {
      logger.warn(`Skipping ${file} — no default Command export`);
      continue;
    }

    if (commands.has(command.name)) {
      logger.warn(`Duplicate command name: ${command.name} in ${file}`);
      continue;
    }

    commands.set(command.name, command);
    for (const alias of command.aliases ?? []) {
      if (commands.has(alias)) {
        logger.warn(`Alias conflict: ${alias} (from ${command.name})`);
        continue;
      }
      commands.set(alias, command);
    }
  }

  logger.info(`Loaded ${new Set(commands.values()).size} commands`);
}

export function getAllCommands(): Command[] {
  return [...new Set(commands.values())];
}

export async function handle(message: Message, client: Client<true>): Promise<void> {
  if (!message.content.startsWith(env.PREFIX)) return;

  const withoutPrefix = message.content.slice(env.PREFIX.length).trim();
  if (!withoutPrefix) return;

  const args = withoutPrefix.split(/\s+/);
  const commandName = args.shift()!.toLowerCase();
  const command = commands.get(commandName);
  if (!command) return; // unknown command — silent ignore (don't spam chat)

  if (!message.inGuild()) {
    await message.reply(t('common.user_only'));
    return;
  }

  const member = message.member;
  if (!member) {
    logger.warn(`No member object on message from ${message.author.id}`);
    return;
  }

  const required = command.permission ?? PermissionLevel.USER;
  if (!hasPermission(member, required)) {
    await message.reply({ embeds: [errorEmbed(t('common.no_permission'))] });
    return;
  }

  if (command.cooldown && command.cooldown > 0) {
    const remaining = Cooldowns.getRemaining(message.author.id, command.name);
    if (remaining > 0) {
      await message.reply({
        embeds: [errorEmbed(t('common.cooldown', { seconds: remaining }))],
      });
      return;
    }
    Cooldowns.set(message.author.id, command.name, command.cooldown);
  }

  const rawArgs = withoutPrefix.slice(commandName.length).trim();

  const ctx: CommandContext = {
    message,
    args,
    rawArgs,
    client,
    guild: message.guild,
    member,
    channel: message.channel,
  };

  try {
    await command.execute(ctx);
  } catch (err) {
    logger.error(`Command "${command.name}" threw:`, err);
    Cooldowns.clear(message.author.id, command.name);
    try {
      await message.reply({ embeds: [errorEmbed(t('common.error'))] });
    } catch {
    }
  }
}
