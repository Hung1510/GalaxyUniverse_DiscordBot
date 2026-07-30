
import { type Command, PermissionLevel } from '../../framework/Command.js';
import { cosmicEmbed } from '../../utils/embed.js';
import { config, env } from '../../config/config.js';
import { GuildSettingsRepo } from '../../db/repositories/GuildSettingsRepo.js';

const command: Command = {
  name: 'config',
  aliases: ['settings'],
  description: 'Xem cấu hình bot hiện tại',
  category: 'system',
  cooldown: 5,
  permission: PermissionLevel.ADMIN,

  async execute(ctx) {
    const guildSettings = GuildSettingsRepo.get(ctx.guild.id);

    const embed = cosmicEmbed()
  .setTitle('⚙️ Cấu hình hiện tại')
  .addFields(
    { name: 'Prefix', value: `\`${config.prefix}\``, inline: true },
    { name: 'Environment', value: env.NODE_ENV, inline: true },
    { name: 'Database', value: `\`${env.DATABASE_PATH}\``, inline: true },
    {
  name: 'Mod roles',
  value: config.modRoleIds.length
? config.modRoleIds.map((id) => `<@&${id}>`).join(', ')
: '*chưa có*',
  inline: false,
    },
    {
  name: 'Admin roles',
  value: config.adminRoleIds.length
? config.adminRoleIds.map((id) => `<@&${id}>`).join(', ')
: '*chưa có*',
  inline: false,
    },
    {
  name: 'Owners',
  value: config.ownerIds.length
? config.ownerIds.map((id) => `<@${id}>`).join(', ')
: '*chưa có*',
  inline: false,
    },
    {
  name: 'Mod-log channel',
  value: config.modLogChannelId ? `<#${config.modLogChannelId}>` : '*chưa cấu hình*',
  inline: false,
    },
    {
  name: 'Jail (Void)',
  value: guildSettings?.jail_role_id
? `Role: <@&${guildSettings.jail_role_id}>\nChannel: <#${guildSettings.jail_channel_id}>`
: '*chưa setup - chạy `g!setup jail`*',
  inline: false,
    },
  );

    await ctx.message.reply({ embeds: [embed] });
  },
};

export default command;
