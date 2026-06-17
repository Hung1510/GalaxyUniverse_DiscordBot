import type {
  Client,
  Guild,
  GuildMember,
  Message,
  TextBasedChannel,
} from 'discord.js';

export const PermissionLevel = {
  USER: 0,
  MOD: 1,
  ADMIN: 2,
  OWNER: 3,
} as const;
export type PermissionLevel = (typeof PermissionLevel)[keyof typeof PermissionLevel];

export interface CommandContext {
  client: Client<true>;
  message: Message<true>;
  guild: Guild;
  member: GuildMember;
  channel: TextBasedChannel;
  args: string[];
  rawArgs: string;
}

export interface Command {
  name: string;
  aliases?: string[];
  description: string;
  usage?: string;
  category: string;
  /** Cooldown in seconds. */
  cooldown?: number;
  /** Minimum permission level needed (defaults to USER). */
  permission?: PermissionLevel;
  /** Hide from g!help (still callable). */
  hidden?: boolean;

  execute(ctx: CommandContext): Promise<void>;
}
