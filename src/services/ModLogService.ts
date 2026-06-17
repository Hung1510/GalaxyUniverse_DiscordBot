/**
 * Mod-log service (item #8).
 *
 * Every staff action that mutates server state — void, free, escape,
 * future warns/mutes/bans — calls `modLog()` to post a record to the
 * configured mod-log channel.
 *
 * Database persistence happens at the action site (VoidHistoryRepo etc).
 * This file is the *Discord-facing* part: the embed people scroll
 * through in #mod-log.
 *
 * Failure modes are explicit:
 *   - Channel not configured: log a warn (once per startup) and skip
 *   - Channel deleted / no perms: log error, don't throw
 */

import { type Client, type Guild, EmbedBuilder, ChannelType } from 'discord.js';
import { config } from '../config/config.js';
import { logger } from '../utils/logger.js';

export type ModLogColor = 'red' | 'yellow' | 'green' | 'blue';

const colorMap: Record<ModLogColor, number> = {
  red: 0xed4245,
  yellow: 0xfee75c,
  green: 0x57f287,
  blue: 0x5865f2,
};

export interface ModLogEntry {
  action: string;             // 'void', 'free', 'escape', etc.
  color: ModLogColor;
  targetUserId?: string;
  actorUserId?: string;
  reason?: string | null;
  fields?: Array<{ name: string; value: string }>;
}

// Track whether we've already warned about a missing channel — avoid log spam.
let warnedNoChannel = false;

export async function modLog(
  client: Client<true>,
  guild: Guild,
  entry: ModLogEntry,
): Promise<void> {
  if (!config.modLogChannelId) {
    if (!warnedNoChannel) {
      logger.warn('modLogChannelId not configured — mod-log entries will only go to file logs.');
      warnedNoChannel = true;
    }
    logger.info(`[modlog/${entry.action}] target=${entry.targetUserId ?? '?'} actor=${entry.actorUserId ?? '?'} reason=${entry.reason ?? ''}`);
    return;
  }

  try {
    const channel = await client.channels.fetch(config.modLogChannelId);
    if (!channel || channel.type !== ChannelType.GuildText) {
      logger.warn(`Mod-log channel ${config.modLogChannelId} not a text channel or not accessible.`);
      return;
    }
    if (channel.guildId !== guild.id) {
      logger.warn(`Mod-log channel is in a different guild — skipping post.`);
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(colorMap[entry.color])
      .setTitle(`Mod-log: ${entry.action}`)
      .setTimestamp();

    if (entry.targetUserId) {
      embed.addFields({ name: 'Target', value: `<@${entry.targetUserId}> (\`${entry.targetUserId}\`)`, inline: true });
    }
    if (entry.actorUserId) {
      embed.addFields({ name: 'Actor', value: `<@${entry.actorUserId}> (\`${entry.actorUserId}\`)`, inline: true });
    }
    if (entry.reason) {
      embed.addFields({ name: 'Reason', value: entry.reason });
    }
    for (const f of entry.fields ?? []) {
      embed.addFields(f);
    }

    await channel.send({ embeds: [embed] });
  } catch (err) {
    logger.error('Failed to post mod-log entry:', err);
  }
}
