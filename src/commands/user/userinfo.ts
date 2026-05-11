import { type GuildMember } from 'discord.js';
import { type Command } from '../../framework/Command.js';
import { cosmicEmbed } from '../../utils/embed.js';
import { t } from '../../utils/lang.js';

// Resolves a target member from the first arg, defaults to the caller.
async function resolveTarget(ctx: {
  member: GuildMember;
  args: string[];
  guild: { members: GuildMember['guild']['members'] };
}): Promise<GuildMember | null> {
  const first = ctx.args[0];
  if (!first) return ctx.member;

  const idMatch = /^<@!?(\d+)>$/.exec(first) ?? /^(\d+)$/.exec(first);
  if (!idMatch) return null;
  const id = idMatch[1]!;

  //.fetch() hits the API if member isn't cached.
  try {
    return await ctx.guild.members.fetch(id);
  } catch {
    return null;
  }
}

const command: Command = {
  name: 'userinfo',
  aliases: ['ui', 'whois'],
  description: 'Xem thông tin user',
  usage: 'userinfo [@user]',
  category: 'user',
  cooldown: 3,

  async execute(ctx) {
    const target = await resolveTarget(ctx);
    if (!target) {
      await ctx.message.reply(t('common.invalid_user'));
      return;
    }

    // Filter out @everyone, sort highest first, cap at 15 to avoid embed limits.
    const roles = target.roles.cache
      .filter((r) => r.id !== ctx.guild.id)
      .sort((a, b) => b.position - a.position)
      .map((r) => r.toString())
      .slice(0, 15);

    const embed = cosmicEmbed()
      .setTitle(t('user.userinfo_title', { username: target.user.username }))
      .setThumbnail(target.user.displayAvatarURL({ size: 256 }))
      .addFields(
        { name: t('user.userinfo_id'), value: `\`${target.id}\``, inline: true },
        {
          name: t('user.userinfo_created'),
          // Discord <t:UNIX:R> renders as a relative timestamp, auto-localized.
          value: `<t:${Math.floor(target.user.createdTimestamp / 1000)}:R>`,
          inline: true,
        },
        {
          name: t('user.userinfo_joined'),
          value: target.joinedTimestamp
            ? `<t:${Math.floor(target.joinedTimestamp / 1000)}:R>`
            : '?',
          inline: true,
        },
        {
          name: t('user.userinfo_roles', { count: roles.length }),
          value: roles.length > 0 ? roles.join(' ') : t('user.userinfo_no_roles'),
        },
      );

    await ctx.message.reply({ embeds: [embed] });
  },
};

export default command;