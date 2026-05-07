/**
 * Core types every command must satisfy.
 *
 * Designed to support BOTH prefix commands (current) and slash commands
 * (future migration). Both will produce a `CommandContext` and call the
 * same `execute(ctx)`. Adding slash later means writing a different adapter
 * in events/interactionCreate.ts — not rewriting commands.
 */

import type { Client, Guild, GuildMember, Message, TextBasedChannel } from 'discord.js';

/**
 * Permission tier required to run a command.
 * - USER: anyone
 * - MOD:  members with a Mod role (per config.json)
 * - ADMIN: members with an Admin role
 *
 * MOD is a subset of ADMIN — admins can do everything mods can.
 */
export enum PermissionLevel {
  USER = 0,
  MOD = 1,
  ADMIN = 2,
}

/**
 * Everything a command needs, packaged in one object.
 *
 * `message` is non-null for prefix commands (current). Once we add slash
 * commands we'll add `interaction` and a discriminated union — not
 * worth the complexity yet.
 */
export interface CommandContext {
  /** The raw Discord message that triggered the command. */
  message: Message<true>; // <true> = guarantees inGuild()
  /** Args after the command name, split by whitespace. e.g. "g!pay @x 100" → ["@x", "100"] */
  args: string[];
  /** Raw text after command name (for commands that take free-form input). */
  rawArgs: string;
  /** The Discord client. */
  client: Client<true>;
  /** Guild the command was used in (always present — DMs are filtered out). */
  guild: Guild;
  /** Member who invoked the command. */
  member: GuildMember;
  /** Channel the command was used in. */
  channel: TextBasedChannel;
}

export interface Command {
  /** Primary command name, lowercase. e.g. "ping", "void", "daily" */
  name: string;
  /** Alternative names. e.g. balance has aliases ["bal", "money"] */
  aliases?: string[];
  /** Short description shown in g!help. */
  description: string;
  /** Usage hint shown on argument errors. e.g. "g!pay @user <amount>" */
  usage?: string;
  /** Category for organizing g!help output. */
  category: string;
  /** Cooldown in seconds. 0 = no cooldown. */
  cooldown?: number;
  /** Required permission tier. Defaults to USER. */
  permission?: PermissionLevel;
  /** Set to true if command must run in a guild (almost always). */
  guildOnly?: boolean;

  /** Handler. Throw to signal failure — handler will catch and notify user. */
  execute(ctx: CommandContext): Promise<void> | void;
}
