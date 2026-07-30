import { type Command, PermissionLevel } from '../../framework/Command.js';
import { cosmicEmbed } from '../../utils/embed.js';
import { VoidRepo } from '../../db/repositories/VoidRepo.js';

const command: Command = {
  name: 'voidlist',
  aliases: ['vl'],
  description: 'Danh sách user đang bị Void',
  category: 'void',
  cooldown: 10,
  permission: PermissionLevel.MOD,

  async execute(ctx) {
    const rows = VoidRepo.listByGuild(ctx.guild.id);
    const embed = cosmicEmbed().setTitle(`⛓️ Đang bị Void (${rows.length})`);

    if (rows.length === 0) {
  embed.setDescription('Không có ai đang bị Void.');
    } else {
  embed.setDescription(rows.slice(0, 20).map((r) => {
    const date = `<t:${Math.floor(r.jailed_at / 1000)}:R>`;
    return `<@${r.user_id}> - **${r.remaining}/${r.total_count}** · ${date}`;
  }).join('\n'));
  if (rows.length > 20) {
    embed.setFooter({ text: `Hiển thị 20/${rows.length}` });
  }
    }

    await ctx.message.reply({ embeds: [embed] });
  },
};

export default command;
