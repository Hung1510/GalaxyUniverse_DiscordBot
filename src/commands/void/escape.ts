import { type Command, PermissionLevel } from '../../framework/Command.js';
import { VoidRepo } from '../../db/repositories/VoidRepo.js';
import { errorEmbed } from '../../utils/embed.js';
import { t } from '../../utils/lang.js';

const command: Command = {
  name: 'escape',
  description: 'Thử thoát khỏi Void (chỉ dùng trong jail channel, gõ "glausan" trực tiếp thay vào)',
  category: 'void',
  cooldown: 3,
  permission: PermissionLevel.USER,
  hidden: true, // The real escape mechanic is typing "glausan" — this command is informational only

  async execute(ctx) {
    if (!VoidRepo.getSentence(ctx.member.id)) {
      await ctx.message.reply({ embeds: [errorEmbed(t('void.not_jailed_self'))] });
      return;
    }
    await ctx.message.reply(t('void.escape_hint'));
  },
};

export default command;
