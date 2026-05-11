import {
  type Guild,
  type GuildMember,
  ChannelType,
  PermissionFlagsBits,
} from 'discord.js';
import { GuildSettingsRepo } from '../db/repositories/GuildSettingsRepo.js';
import { VoidRepo, type VoidSentenceRow } from '../db/repositories/VoidRepo.js';
import { VOID } from '../config/constants.js';
import { logger } from '../utils/logger.js';

// Result types for command-friendly branching.
export type SetupResult =
  | { ok: true; roleId: string; channelId: string; channelsSynced: number }
  | { ok: false; reason: 'already_setup' | 'missing_perms'; missing?: string[] };

export type JailResult =
  | { ok: true; sentence: VoidSentenceRow }
  | { ok: false; reason: 'already_jailed' | 'immune'; immunityMsLeft?: number };

export type AttemptResult =
  | { type: 'cooldown'; secondsLeft: number }
  | { type: 'wrong'; reset: boolean; remaining: number }
  | { type: 'progress'; remaining: number; total: number }
  | { type: 'escaped' };

// Verify bot has the perms needed for jail setup, returns list of missing names.
function checkBotPerms(guild: Guild): string[] {
  const me = guild.members.me;
  if (!me) return ['Bot not in guild'];

  const needed: Array<[bigint, string]> = [
    [PermissionFlagsBits.ManageRoles, 'Manage Roles'],
    [PermissionFlagsBits.ManageChannels, 'Manage Channels'],
  ];

  return needed.filter(([flag]) => !me.permissions.has(flag)).map(([, name]) => name);
}

export const VoidService = {
  // Setup: create jail role + channel, sync View permission across all channels.
  async setup(guild: Guild): Promise<SetupResult> {
    const settings = GuildSettingsRepo.getOrCreate(guild.id);
    if (settings.jail_role_id && settings.jail_channel_id) {
      return { ok: false, reason: 'already_setup' };
    }

    const missing = checkBotPerms(guild);
    if (missing.length > 0) {
      return { ok: false, reason: 'missing_perms', missing };
    }

    // Create the jail role with no permissions (we deny ViewChannel everywhere later).
    const jailRole = await guild.roles.create({
      name: 'Void',
      color: 0x2c2f33,
      reason: 'Galaxy Universe void setup',
      mentionable: false,
    });

    // Create the jail channel where prisoners type "glausan".
    // @everyone is denied ViewChannel, jail role is allowed.
    const jailChannel = await guild.channels.create({
      name: 'the-void',
      type: ChannelType.GuildText,
      reason: 'Galaxy Universe void setup',
      permissionOverwrites: [
        {
          id: guild.id, // @everyone has same id as the guild
          deny: [PermissionFlagsBits.ViewChannel],
        },
        {
          id: jailRole.id,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
        },
      ],
    });

    // Sync ViewChannel deny across all other channels.
    const synced = await this.syncJailPermissions(guild, jailRole.id, jailChannel.id);

    GuildSettingsRepo.setJail(guild.id, jailRole.id, jailChannel.id);

    return { ok: true, roleId: jailRole.id, channelId: jailChannel.id, channelsSynced: synced };
  },

  // Apply ViewChannel deny for jail role across every channel except the jail itself.
  // Sequential await on each channel so discord.js can pace rate limits naturally.
  async syncJailPermissions(
    guild: Guild,
    jailRoleId: string,
    jailChannelId: string,
  ): Promise<number> {
    let count = 0;
    for (const channel of guild.channels.cache.values()) {
      if (channel.id === jailChannelId) continue;
      // Only channels that have permissionOverwrites (skip category-only? no, categories support overwrites too).
      if (!('permissionOverwrites' in channel)) continue;

      try {
        await channel.permissionOverwrites.edit(jailRoleId, {
          ViewChannel: false,
        });
        count++;
      } catch (err) {
        logger.warn(`Failed to sync perms on channel ${channel.id}:`, err);
      }
    }
    return count;
  },

  // Jail a user: assign role, create sentence row.
  async jail(
    target: GuildMember,
    count: number,
    reason: string | null,
    jailedBy: string,
  ): Promise<JailResult> {
    if (VoidRepo.getSentence(target.id)) {
      return { ok: false, reason: 'already_jailed' };
    }

    const immunityMs = VoidRepo.immunityRemaining(target.id, VOID.POST_RELEASE_IMMUNITY_MS);
    if (immunityMs > 0) {
      return { ok: false, reason: 'immune', immunityMsLeft: immunityMs };
    }

    const settings = GuildSettingsRepo.get(target.guild.id);
    if (!settings?.jail_role_id) {
      throw new Error('Jail not set up — run g!setup jail first');
    }

    await target.roles.add(settings.jail_role_id, `Voided by ${jailedBy}: ${reason ?? 'no reason'}`);
    const sentence = VoidRepo.createSentence(target.id, target.guild.id, count, reason, jailedBy);
    return { ok: true, sentence };
  },

  // Release: remove role, delete sentence, set immunity.
  async release(target: GuildMember, releasedBy: string): Promise<void> {
    const settings = GuildSettingsRepo.get(target.guild.id);
    if (settings?.jail_role_id) {
      await target.roles.remove(settings.jail_role_id, `Released by ${releasedBy}`).catch(() => {
        // Role may already be missing — fine.
      });
    }
    VoidRepo.deleteSentence(target.id);
    VoidRepo.setImmunity(target.id, target.guild.id);
  },

  // Handle a typed message in the jail channel from a jailed user.
  async handleAttempt(member: GuildMember, content: string): Promise<AttemptResult | null> {
    const sentence = VoidRepo.getSentence(member.id);
    if (!sentence) return null; // not jailed, nothing to do

    const now = Date.now();
    if (sentence.last_attempt && now - sentence.last_attempt < VOID.ATTEMPT_COOLDOWN_MS) {
      const secondsLeft = Math.ceil(
        (VOID.ATTEMPT_COOLDOWN_MS - (now - sentence.last_attempt)) / 1000,
      );
      return { type: 'cooldown', secondsLeft };
    }

    const trimmed = content.trim().toLowerCase();
    if (trimmed !== VOID.ESCAPE_KEYWORD) {
      VoidRepo.touchAttempt(member.id);
      const reset = Math.random() < VOID.TYPO_RESET_CHANCE;
      if (reset) {
        VoidRepo.resetProgress(member.id);
        return { type: 'wrong', reset: true, remaining: sentence.total_count };
      }
      return { type: 'wrong', reset: false, remaining: sentence.remaining };
    }

    // Correct keyword — decrement.
    const remaining = VoidRepo.decrementRemaining(member.id);
    if (remaining <= 0) {
      // Escaped: release them.
      await this.release(member, 'escape');
      return { type: 'escaped' };
    }
    return { type: 'progress', remaining, total: sentence.total_count };
  },
};
