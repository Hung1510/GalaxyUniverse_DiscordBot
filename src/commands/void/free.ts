import { type Command, PermissionLevel } from '../../framework/Command.js';
import { VoidService } from '../../services/VoidService.js';
import { VoidRepo } from '../../db/repositories/VoidRepo.js';
import { successEmbed, errorEmbed } from '../../utils/embed.js';
import { t } from '../../utils/lang.js';

const command: Command = {
  name: 'free',
  description: 'Thả user khỏi Void',
  usage: 'free @user',
  category: 'void',
  cooldown: 3,
  permission: PermissionLevel.MOD,

  async execute(ctx) {
    const targetId = ctx.message.mentions.users.first()?.id ?? ctx.args[0];
    if (!targetId) {
      await ctx.message.reply({ embeds: [errorEmbed(t('common.invalid_args', { usage: 'g!free @user' }))] });
      return;
    }
    let target;
    try {
      target = await ctx.guild.members.fetch(targetId);
    } catch {
      await ctx.message.reply({ embeds: [errorEmbed(t('common.user_not_found'))] });
      return;
    }
    if (!VoidRepo.getSentence(target.id)) {
      await ctx.message.reply({ embeds: [errorEmbed(t('void.not_jailed'))] });
      return;
    }
    await VoidService.release(target, 'free', ctx.member, ctx.client);
    await ctx.message.reply({ embeds: [successEmbed(t('void.freed', { target: `<@${target.id}>` }))] });
  },
};

export default command;
