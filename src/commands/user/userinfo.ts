import { type Command, PermissionLevel } from '../../framework/Command.js';
import { cosmicEmbed, errorEmbed } from '../../utils/embed.js';
import { UserRepo } from '../../db/repositories/UserRepo.js';
import { t } from '../../utils/lang.js';

const command: Command = {
  name: 'userinfo',
  aliases: ['ui', 'whois'],
  description: 'Xem thông tin user',
  usage: 'userinfo [@user|id]',
  category: 'user',
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

    const dbUser = UserRepo.get(member.id);

    const embed = cosmicEmbed()
      .setTitle(`👤 ${member.user.tag}`)
      .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
      .addFields(
        { name: 'ID', value: member.id, inline: true },
        { name: 'Vào server', value: `<t:${Math.floor((member.joinedTimestamp ?? Date.now()) / 1000)}:R>`, inline: true },
        { name: 'Tài khoản tạo', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true },
        { name: 'Level', value: String(dbUser?.level ?? 0), inline: true },
        { name: 'XP', value: String(dbUser?.xp ?? 0), inline: true },
        { name: 'Balance', value: String(dbUser?.balance ?? 0), inline: true },
      );
    await ctx.message.reply({ embeds: [embed] });
  },
};

export default command;
