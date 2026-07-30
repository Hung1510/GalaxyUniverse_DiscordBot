import { type Command, PermissionLevel } from '../../framework/Command.js';
import { LevelService } from '../../services/LevelService.js';
import { successEmbed, errorEmbed } from '../../utils/embed.js';
import { t } from '../../utils/lang.js';

const MAX_LEVEL = 200;

const command: Command = {
  name: 'setlevel',
  description: 'Đặt level cho user (admin)',
  usage: 'setlevel @user <level>',
  category: 'level',
  cooldown: 3,
  permission: PermissionLevel.ADMIN,

  async execute(ctx) {
    const targetId = ctx.message.mentions.users.first()?.id ?? ctx.args[0];
    const levelArg = ctx.args[1];

    if (!targetId || !levelArg) {
      await ctx.message.reply({ embeds: [errorEmbed(t('common.invalid_args', { usage: 'g!setlevel @user <level>' }))] });
      return;
    }

    const level = parseInt(levelArg, 10);
    if (isNaN(level) || level < 0 || level > MAX_LEVEL) {
      await ctx.message.reply({ embeds: [errorEmbed(t('level.invalid_level', { max: String(MAX_LEVEL) }))] });
      return;
    }

    try {
      await ctx.guild.members.fetch(targetId);
    } catch {
      await ctx.message.reply({ embeds: [errorEmbed(t('common.user_not_found'))] });
      return;
    }

    LevelService.setLevel(targetId, level);
    await ctx.message.reply({
      embeds: [successEmbed(t('level.set_done', { target: `<@${targetId}>`, level: String(level) }))],
    });
  },
};

export default command;
