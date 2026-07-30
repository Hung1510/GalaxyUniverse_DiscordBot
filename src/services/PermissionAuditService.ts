
import { type Client, PermissionFlagsBits, ChannelType } from 'discord.js';
import { config } from '../config/config.js';
import { GuildSettingsRepo } from '../db/repositories/GuildSettingsRepo.js';
import { logger } from '../utils/logger.js';

interface AuditResult {
  guildId: string;
  guildName: string;
  issues: string[];
}

const requiredBotPerms: Array<[bigint, string]> = [
  [PermissionFlagsBits.SendMessages, 'Send Messages'],
  [PermissionFlagsBits.EmbedLinks, 'Embed Links'],
  [PermissionFlagsBits.ReadMessageHistory, 'Read Message History'],
  [PermissionFlagsBits.ManageRoles, 'Manage Roles'],
  [PermissionFlagsBits.ManageChannels, 'Manage Channels'],
];

export async function auditPermissions(client: Client<true>): Promise<AuditResult[]> {
  const results: AuditResult[] = [];

  for (const guild of client.guilds.cache.values()) {
    const issues: string[] = [];
    const me = guild.members.me;
    if (!me) {
      issues.push('Bot member object not loaded (re-invite?)');
      results.push({ guildId: guild.id, guildName: guild.name, issues });
      continue;
    }

    for (const [flag, name] of requiredBotPerms) {
      if (!me.permissions.has(flag)) {
        issues.push(`Missing perm: ${name}`);
      }
    }

    const settings = GuildSettingsRepo.get(guild.id);
    if (settings?.jail_role_id) {
      const role = guild.roles.cache.get(settings.jail_role_id);
      if (!role) {
        issues.push(`Jail role ${settings.jail_role_id} (in DB) no longer exists — re-run g!setup jail`);
      } else if (me.roles.highest.position <= role.position) {
        issues.push(`Bot's highest role is not above jail role — can't manage jail role assignment`);
      }
    }
    if (settings?.jail_channel_id) {
      const ch = guild.channels.cache.get(settings.jail_channel_id);
      if (!ch) {
        issues.push(`Jail channel ${settings.jail_channel_id} (in DB) no longer exists`);
      }
    }

    if (config.modLogChannelId) {
      const ch = guild.channels.cache.get(config.modLogChannelId);
      if (ch && ch.type !== ChannelType.GuildText) {
        issues.push(`Mod-log channel ${config.modLogChannelId} is not a text channel`);
      }
    }

    results.push({ guildId: guild.id, guildName: guild.name, issues });

    if (issues.length === 0) {
      logger.info(`Permission audit OK for guild "${guild.name}" (${guild.id})`);
    } else {
      logger.warn(`Permission audit found ${issues.length} issue(s) in guild "${guild.name}" (${guild.id}):`);
      for (const issue of issues) {
        logger.warn(`  - ${issue}`);
      }
    }
  }

  return results;
}
