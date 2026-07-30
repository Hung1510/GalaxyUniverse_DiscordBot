
import {
  type Client,
  type Guild,
  type GuildMember,
  ChannelType,
  PermissionFlagsBits,
} from 'discord.js';
import { GuildSettingsRepo } from '../db/repositories/GuildSettingsRepo.js';
import { VoidRepo, type VoidSentenceRow } from '../db/repositories/VoidRepo.js';
import { VoidHistoryRepo } from '../db/repositories/VoidHistoryRepo.js';
import { VOID } from '../config/constants.js';
import { modLog } from './ModLogService.js';
import { logger } from '../utils/logger.js';

export type SetupResult =
  | { ok: true; roleId: string; channelId: string; channelsSynced: number }
  | { ok: false; reason: 'already_setup' | 'missing_perms'; missing?: string[] };

export type JailResult =
  | { ok: true; sentence: VoidSentenceRow }
  | { ok: false; reason: 'already_jailed' | 'immune' | 'is_bot' | 'is_self' | 'higher_role'; immunityMsLeft?: number };

export type ReleaseType = 'escape' | 'free' | 'admin';

export type AttemptResult =
  | { type: 'cooldown'; secondsLeft: number }
  | { type: 'progress'; remaining: number; total: number }
  | { type: 'escaped' };

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
  async setup(guild: Guild): Promise<SetupResult> {
    const settings = GuildSettingsRepo.getOrCreate(guild.id);
    if (settings.jail_role_id && settings.jail_channel_id) {
      return { ok: false, reason: 'already_setup' };
    }
    const missing = checkBotPerms(guild);
    if (missing.length > 0) {
      return { ok: false, reason: 'missing_perms', missing };
    }

    const jailRole = await guild.roles.create({
      name: 'Void',
      color: 0x2c2f33,
      reason: 'Galaxy Universe void setup',
      mentionable: false,
    });

    const jailChannel = await guild.channels.create({
      name: 'the-void',
      type: ChannelType.GuildText,
      reason: 'Galaxy Universe void setup',
      permissionOverwrites: [
        { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
        { id: jailRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
      ],
    });

    const synced = await this.syncJailPermissions(guild, jailRole.id, jailChannel.id);
    GuildSettingsRepo.setJail(guild.id, jailRole.id, jailChannel.id);

    return { ok: true, roleId: jailRole.id, channelId: jailChannel.id, channelsSynced: synced };
  },

  async syncJailPermissions(
    guild: Guild,
    jailRoleId: string,
    jailChannelId: string,
  ): Promise<number> {
    let count = 0;
    for (const channel of guild.channels.cache.values()) {
      if (channel.id === jailChannelId) continue;
      if (!('permissionOverwrites' in channel)) continue;
      try {
        await channel.permissionOverwrites.edit(jailRoleId, { ViewChannel: false });
        count++;
      } catch (err) {
        logger.warn(`Failed to sync perms on channel ${channel.id}:`, err);
      }
    }
    return count;
  },

  async jail(
    target: GuildMember,
    actor: GuildMember,
    count: number,
    reason: string | null,
    client: Client<true>,
  ): Promise<JailResult> {

    if (target.user.bot) return { ok: false, reason: 'is_bot' };
    if (target.id === actor.id) return { ok: false, reason: 'is_self' };
    if (target.roles.highest.position >= actor.roles.highest.position && actor.id !== target.guild.ownerId) {
      return { ok: false, reason: 'higher_role' };
    }
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

    await target.roles.add(settings.jail_role_id, `Voided by ${actor.user.tag}: ${reason ?? 'no reason'}`);
    const sentence = VoidRepo.createSentence(target.id, target.guild.id, count, reason, actor.id);

    await modLog(client, target.guild, {
      action: 'void',
      color: 'red',
      targetUserId: target.id,
      actorUserId: actor.id,
      reason: reason ?? undefined,
      fields: [{ name: 'Count', value: String(count) }],
    });

    return { ok: true, sentence };
  },

  async release(
    member: GuildMember,
    releaseType: ReleaseType,
    actor: GuildMember | null,
    client: Client<true>,
  ): Promise<boolean> {
    const sentence = VoidRepo.getSentence(member.id);
    if (!sentence) return false;

    const settings = GuildSettingsRepo.get(member.guild.id);
    if (settings?.jail_role_id) {

      await member.roles.remove(settings.jail_role_id, `Released (${releaseType})`).catch((err) => {
        logger.warn(`Could not remove jail role from ${member.id}:`, err);
      });
    }

    VoidHistoryRepo.record({
      user_id: member.id,
      guild_id: member.guild.id,
      total_count: sentence.total_count,
      completed: sentence.total_count - sentence.remaining,
      reason: sentence.reason,
      jailed_by: sentence.jailed_by,
      released_by: actor?.id ?? null,
      release_type: releaseType,
      jailed_at: sentence.jailed_at,
      released_at: Date.now(),
    });

    VoidRepo.deleteSentence(member.id);
    VoidRepo.setImmunity(member.id, member.guild.id);

    await modLog(client, member.guild, {
      action: releaseType === 'escape' ? 'void-escape' : releaseType === 'free' ? 'void-free' : 'void-release',
      color: 'green',
      targetUserId: member.id,
      actorUserId: actor?.id,
      fields: [
        { name: 'Completed', value: `${sentence.total_count - sentence.remaining}/${sentence.total_count}` },
      ],
    });

    return true;
  },

    async recordAttempt(member: GuildMember, client: Client<true>): Promise<AttemptResult> {
    const sentence = VoidRepo.getSentence(member.id);
    if (!sentence) {

      return { type: 'escaped' };
    }

    const now = Date.now();
    if (sentence.last_attempt && now - sentence.last_attempt < VOID.ATTEMPT_COOLDOWN_MS) {
      const secondsLeft = Math.ceil((VOID.ATTEMPT_COOLDOWN_MS - (now - sentence.last_attempt)) / 1000);
      return { type: 'cooldown', secondsLeft };
    }

    const remaining = VoidRepo.decrementRemaining(member.id);
    if (remaining <= 0) {
      await this.release(member, 'escape', null, client);
      return { type: 'escaped' };
    }
    return { type: 'progress', remaining, total: sentence.total_count };
  },
};
