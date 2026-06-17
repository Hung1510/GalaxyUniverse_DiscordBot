/**
 * g!stats — command usage metrics (item #17).
 *
 * Owner-only because it can expose usage patterns of moderation tools
 * that are not for general visibility.
 */

import { type Command, PermissionLevel } from '../../framework/Command.js';
import { cosmicEmbed } from '../../utils/embed.js';
import { metrics } from '../../services/MetricsService.js';
import { formatUptime } from '../../services/HealthService.js';

const command: Command = {
  name: 'stats',
  description: 'Thống kê lệnh đã chạy',
  category: 'system',
  cooldown: 10,
  permission: PermissionLevel.OWNER,

  async execute(ctx) {
    const snap = metrics.snapshot();
    const totalAll = snap.reduce((a, x) => a + x.total, 0);
    const totalFail = snap.reduce((a, x) => a + x.failed, 0);

    const lines = snap.slice(0, 15).map((s) => {
      const failNote = s.failed > 0 ? ` (❌${s.failed})` : '';
      return `\`${s.name}\` — ${s.total} (24h: ${s.last24h}, avg ${s.avgMs}ms${failNote})`;
    });

    const embed = cosmicEmbed()
      .setTitle('📊 Bot stats')
      .setDescription(lines.length ? lines.join('\n') : '*Chưa có lệnh nào chạy.*')
      .addFields(
        { name: 'Uptime', value: formatUptime(metrics.uptimeMs()), inline: true },
        { name: 'Total commands', value: String(totalAll), inline: true },
        { name: 'Failures', value: String(totalFail), inline: true },
      );

    await ctx.message.reply({ embeds: [embed] });
  },
};

export default command;
