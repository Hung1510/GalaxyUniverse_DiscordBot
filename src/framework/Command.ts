import type { Client, Guild, GuildMember, Message, TextBasedChannel } from 'discord.js';

// Permission tier required to run a command.
export enum PermissionLevel {
  USER = 0,
  MOD = 1,
  ADMIN = 2,
}

export interface CommandContext {
  // The raw Discord message that triggered the command.
  message: Message<true>;
  // Args after the command name, split by whitespace.
  args: string[];
  // Raw text after command name (for commands that take free-form input).
  rawArgs: string;
  // The Discord client.
  client: Client<true>;
  // Guild the command was used in (always present — DMs are filtered out).
  guild: Guild;
  // Member who invoked the command.
  member: GuildMember;
  // Channel the command was used in.
  channel: TextBasedChannel;
}

export interface Command {
  // Primary command name, lowercase.
  name: string;
  // Alternative names that resolve to the same command.
  aliases?: string[];
  // Short description shown in g!help.
  description: string;
  // Usage hint shown on argument errors.
  usage?: string;
  // Category for organizing g!help output.
  category: string;
  // Cooldown in seconds, 0 means no cooldown.
  cooldown?: number;
  // Required permission tier, defaults to USER.
  permission?: PermissionLevel;
  // Set to true if command must run in a guild.
  guildOnly?: boolean;

  // Handler, throw to signal failure and the dispatcher will notify the user.
  execute(ctx: CommandContext): Promise<void> | void;
}