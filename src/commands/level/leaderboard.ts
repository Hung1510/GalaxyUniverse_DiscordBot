
import { type Command, PermissionLevel } from '../../framework/Command.js';
import { cosmicEmbed, errorEmbed } from '../../utils/embed.js';
import { UserRepo } from '../../db/repositories/UserRepo.js';
import { t } from '../../utils/lang.js';

const PAGE_SIZE = 10;
const MEDALS = ['🥇', '🥈', '🥉'];

const command: Command = {
  name: 'leaderboard',
  aliases: ['lb', 'top'],
  description: 'Top user theo XP',
  usage: 'leaderboard [page]',
  category: 'level',
  cooldown: 10,
  permission: PermissionLevel.USER,

  async execute(ctx) {

    let page = 1;
    if (ctx.args[0]) {
      const parsed = parseInt(ctx.args[0], 10);
      if (isNaN(parsed) || parsed < 1) {
        await ctx.message.reply({ embeds: [errorEmbed(t('level.invalid_page'))] });
        return;
      }
      page = parsed;
    }

    const total = UserRepo.countWithXp();
    if (total === 0) {
      await ctx.message.reply({ embeds: [errorEmbed(t('level.leaderboard_empty'))] });
      return;
    }

    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    if (page > totalPages) {
      await ctx.message.reply({ embeds: [errorEmbed(t('level.page_too_high', { max: String(totalPages) }))] });
      return;
    }

    const rows = UserRepo.topByXp(PAGE_SIZE, (page - 1) * PAGE_SIZE);

    const lines: string[] = [];
    for (const r of rows) {

      let displayName = `<@${r.user_id}>`;
      const cached = ctx.guild.members.cache.get(r.user_id);
      if (cached) {
        displayName = cached.displayName;
      } else {
        try {
          const fetched = await ctx.guild.members.fetch(r.user_id);
          displayName = fetched.displayName;
        } catch {

          displayName = `*(đã rời server)*`;
        }
      }
      const medal = r.rank <= 3 ? MEDALS[r.rank - 1] : `\`#${r.rank}\``;
      lines.push(`${medal} **${displayName}** — Lv ${r.level} · ${r.xp.toLocaleString()} XP`);
    }

    const embed = cosmicEmbed()
      .setTitle('🏆 Bảng xếp hạng XP')
      .setDescription(lines.join('\n'))
      .setFooter({ text: `Trang ${page}/${totalPages} · ${total} user có XP · Gõ g!lb <số trang>` });

    await ctx.message.reply({ embeds: [embed] });
  },
};

export default command;
