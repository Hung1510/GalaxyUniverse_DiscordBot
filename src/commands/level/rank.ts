
import { type Command, PermissionLevel } from '../../framework/Command.js';
import { cosmicEmbed, errorEmbed } from '../../utils/embed.js';
import { LevelService } from '../../services/LevelService.js';
import { t } from '../../utils/lang.js';

const BAR_WIDTH = 20;

function progressBar(current: number, max: number): string {
  if (max <= 0) return '▰'.repeat(BAR_WIDTH);
  const ratio = Math.max(0, Math.min(1, current / max));
  const filled = Math.round(ratio * BAR_WIDTH);
  return '▰'.repeat(filled) + '▱'.repeat(BAR_WIDTH - filled);
}

const command: Command = {
  name: 'rank',
  aliases: ['level', 'lvl'],
  description: 'Xem level và XP của user',
  usage: 'rank [@user]',
  category: 'level',
  cooldown: 5,
  permission: PermissionLevel.USER,

  async execute(ctx) {
    const targetId = ctx.message.mentions.users.first()?.id ?? ctx.args[0] ?? ctx.member.id;

    let member;
    try {
      member = await ctx.guild.members.fetch(targetId);
    } catch {
      await ctx.message.reply({ embeds: [errorEmbed(t('common.user_not_found'))] });
      return;
    }

    const { row, rank, total, currentLevelXp, nextLevelXp } = LevelService.getStats(member.id);

    const embed = cosmicEmbed()
      .setTitle(`🌠 ${member.user.tag}`)
      .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
      .addFields(
        { name: 'Level', value: `**${row.level}**`, inline: true },
        { name: 'XP', value: `**${row.xp.toLocaleString()}**`, inline: true },
        {
          name: 'Rank',
          value: rank > 0 ? `**#${rank}** / ${total}` : '*chưa có XP*',
          inline: true,
        },
        {
          name: `Tiến độ tới level ${row.level + 1}`,
          value: `\`${progressBar(currentLevelXp, nextLevelXp)}\`\n${currentLevelXp.toLocaleString()} / ${nextLevelXp.toLocaleString()} XP`,
        },
      );

    await ctx.message.reply({ embeds: [embed] });
  },
};

export default command;
