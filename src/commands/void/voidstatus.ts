import { type Command, PermissionLevel } from '../../framework/Command.js';
import { VoidRepo } from '../../db/repositories/VoidRepo.js';
import { cosmicEmbed } from '../../utils/embed.js';
import { t } from '../../utils/lang.js';

const command: Command = {
  name: 'voidstatus',
  aliases: ['vs'],
  description: 'Xem trạng thái Void của user',
  usage: 'voidstatus [@user]',
  category: 'void',
  cooldown: 5,
  permission: PermissionLevel.USER,

  async execute(ctx) {
    const targetId = ctx.message.mentions.users.first()?.id ?? ctx.args[0] ?? ctx.member.id;
    const sentence = VoidRepo.getSentence(targetId);
    const embed = cosmicEmbed().setTitle('⚖️ Void Status');
    if (!sentence) {
  embed.setDescription(t('void.status_free', { target: `<@${targetId}>` }));
    } else {
  embed.setDescription(t('void.status_jailed', {
    target: `<@${targetId}>`,
    remaining: String(sentence.remaining),
    total: String(sentence.total_count),
    reason: sentence.reason ?? '-',
  }));
    }
    await ctx.message.reply({ embeds: [embed] });
  },
};

export default command;
