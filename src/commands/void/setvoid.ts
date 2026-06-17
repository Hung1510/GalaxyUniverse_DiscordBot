import { type Command, PermissionLevel } from '../../framework/Command.js';
import { VoidRepo } from '../../db/repositories/VoidRepo.js';
import { successEmbed, errorEmbed } from '../../utils/embed.js';
import { VOID } from '../../config/constants.js';
import { t } from '../../utils/lang.js';

const command: Command = {
  name: 'setvoid',
  description: 'Set lại số lần remaining của user (admin)',
  usage: 'setvoid @user <count>',
  category: 'void',
  cooldown: 3,
  permission: PermissionLevel.ADMIN,

  async execute(ctx) {
    const targetId = ctx.message.mentions.users.first()?.id ?? ctx.args[0];
    const countArg = ctx.args[1];
    if (!targetId || !countArg) {
      await ctx.message.reply({ embeds: [errorEmbed(t('common.invalid_args', { usage: 'g!setvoid @user <count>' }))] });
      return;
    }
    const parsed = parseInt(countArg, 10);
    if (isNaN(parsed) || parsed < 0 || parsed > VOID.MAX_COUNT) {
      await ctx.message.reply({ embeds: [errorEmbed(t('void.invalid_count', { max: String(VOID.MAX_COUNT) }))] });
      return;
    }
    if (!VoidRepo.getSentence(targetId)) {
      await ctx.message.reply({ embeds: [errorEmbed(t('void.not_jailed'))] });
      return;
    }
    VoidRepo.setRemaining(targetId, parsed);
    await ctx.message.reply({ embeds: [successEmbed(t('void.set_done', { target: `<@${targetId}>`, count: String(parsed) }))] });
  },
};

export default command;
