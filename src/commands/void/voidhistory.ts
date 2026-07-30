
import { type Command, PermissionLevel } from '../../framework/Command.js';
import { cosmicEmbed, errorEmbed } from '../../utils/embed.js';
import { VoidHistoryRepo } from '../../db/repositories/VoidHistoryRepo.js';
import { t } from '../../utils/lang.js';

const command: Command = {
  name: 'voidhistory',
  aliases: ['vh'],
  description: 'Xem lịch sử Void của user',
  usage: 'voidhistory @user',
  category: 'void',
  cooldown: 5,
  permission: PermissionLevel.MOD,

  async execute(ctx) {
    const targetId = ctx.message.mentions.users.first()?.id ?? ctx.args[0];
    if (!targetId) {
  await ctx.message.reply({ embeds: [errorEmbed(t('common.invalid_args', { usage: 'g!voidhistory @user' }))] });
  return;
    }

    const rows = VoidHistoryRepo.byUser(targetId, 10);
    const total = VoidHistoryRepo.countByUser(targetId);

    const embed = cosmicEmbed()
  .setTitle(`📜 Void history`)
  .setDescription(`Tổng số lần: **${total}** · Hiển thị 10 gần nhất`);

    if (rows.length === 0) {
  embed.setDescription(`<@${targetId}> chưa từng bị Void.`);
    } else {
  for (const r of rows) {
    const date = `<t:${Math.floor(r.released_at / 1000)}:R>`;
    const releaseLabel =
  r.release_type === 'escape' ? '🏃 Tự thoát' :
  r.release_type === 'free' ? '🔓 Mod thả' : '⚙️ Admin set';
    embed.addFields({
  name: `${date} - ${releaseLabel}`,
  value: `**${r.completed}/${r.total_count}** glausan · Jailed by <@${r.jailed_by}>${r.released_by ? ` · Released by <@${r.released_by}>` : ''}\nReason: ${r.reason ?? '-'}`,
    });
  }
    }

    await ctx.message.reply({ embeds: [embed] });
  },
};

export default command;
