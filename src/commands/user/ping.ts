import { type Command, PermissionLevel } from '../../framework/Command.js';
import { cosmicEmbed } from '../../utils/embed.js';
import { snapshot, formatUptime } from '../../services/HealthService.js';

const command: Command = {
  name: 'ping',
  description: 'Kiểm tra bot online + thông số sức khỏe',
  category: 'user',
  cooldown: 3,
  permission: PermissionLevel.USER,

  async execute(ctx) {
    const s = snapshot(ctx.client);
    const embed = cosmicEmbed()
  .setTitle('🛰️ Pong!')
  .addFields(
    { name: 'WebSocket', value: `${s.wsPingMs}ms`, inline: true },
    { name: 'Database', value: `${s.dbQueryMs}ms`, inline: true },
    { name: 'Memory', value: `${s.memMb} MB`, inline: true },
    { name: 'Uptime', value: formatUptime(s.uptimeMs), inline: true },
    { name: 'Commands run', value: String(s.totalCommands), inline: true },
  );
    await ctx.message.reply({ embeds: [embed] });
  },
};

export default command;
