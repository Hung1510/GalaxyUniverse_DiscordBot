
import { type Command, PermissionLevel } from '../../framework/Command.js';
import { LevelService } from '../../services/LevelService.js';
import { successEmbed, errorEmbed } from '../../utils/embed.js';
import { t } from '../../utils/lang.js';

const MAX_GRANT = 1_000_000;

const command: Command = {
  name: 'givexp',
  aliases: ['addxp'],
  description: 'Cộng/trừ XP của user (admin). Số âm để trừ.',
  usage: 'givexp @user <amount>',
  category: 'level',
  cooldown: 3,
  permission: PermissionLevel.ADMIN,

  async execute(ctx) {
    const targetId = ctx.message.mentions.users.first()?.id ?? ctx.args[0];
    const amountArg = ctx.args[1];

    if (!targetId || !amountArg) {
      await ctx.message.reply({ embeds: [errorEmbed(t('common.invalid_args', { usage: 'g!givexp @user <amount>' }))] });
      return;
    }

    const amount = parseInt(amountArg, 10);
    if (isNaN(amount) || Math.abs(amount) > MAX_GRANT) {
      await ctx.message.reply({ embeds: [errorEmbed(t('level.invalid_xp', { max: MAX_GRANT.toLocaleString() }))] });
      return;
    }

    const { newXp, oldLevel, newLevel } = LevelService.giveXp(targetId, amount);
    const levelNote = oldLevel !== newLevel
      ? ` (Level: **${oldLevel}** → **${newLevel}**)`
      : '';

    await ctx.message.reply({
      embeds: [successEmbed(t('level.givexp_done', {
        target: `<@${targetId}>`,
        amount: amount.toLocaleString(),
        newXp: newXp.toLocaleString(),
      }) + levelNote)],
    });
  },
};

export default command;
