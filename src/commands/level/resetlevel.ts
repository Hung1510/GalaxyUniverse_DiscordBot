import { type Command, PermissionLevel } from '../../framework/Command.js';
import { LevelService } from '../../services/LevelService.js';
import { successEmbed, errorEmbed } from '../../utils/embed.js';
import { t } from '../../utils/lang.js';

const command: Command = {
  name: 'resetlevel',
  description: 'Reset XP và level của user về 0 (admin)',
  usage: 'resetlevel @user',
  category: 'level',
  cooldown: 3,
  permission: PermissionLevel.ADMIN,

  async execute(ctx) {
    const targetId = ctx.message.mentions.users.first()?.id ?? ctx.args[0];
    if (!targetId) {
  await ctx.message.reply({ embeds: [errorEmbed(t('common.invalid_args', { usage: 'g!resetlevel @user' }))] });
  return;
    }

    LevelService.reset(targetId);
    await ctx.message.reply({
  embeds: [successEmbed(t('level.reset_done', { target: `<@${targetId}>` }))],
    });
  },
};

export default command;
