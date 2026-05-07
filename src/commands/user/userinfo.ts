/**
 * g!userinfo [@user] — shows info about a user.
 *
 * If no @user given, defaults to the caller. Mention or raw user ID both work.
 *
 * Note: roles list excludes @everyone (which every member has and would be
 * noise). We sort by position descending so highest role shows first.
 */

import { type GuildMember } from 'discord.js';
import { type Command } from '../../framework/Command.js';
import { cosmicEmbed } from '../../utils/embed.js';
import { t } from '../../utils/lang.js';

/**
 * Resolves a target member from the message's first arg.
 * Accepts: <@1234>, <@!1234>, or a raw 1234 ID.
 * Returns the caller if no arg.
 */
async function resolveTarget(ctx: {
  member: GuildMember;
  args: string[];
  guild: { members: GuildMember['guild']['members'] };
}): Promise<GuildMember | null> {
  const first = ctx.args[0];
  if (!first) return ctx.member;

  // Discord mention strings: <@123> or <@!123>. Strip the wrapper.
  const idMatch = /^<@!?(\d+)>$/.exec(first) ?? /^(\d+)$/.exec(first);
  if (!idMatch) return null;
  const id = idMatch[1]!;

  // .fetch() hits the API if the member isn't cached. For our scale that's
  // fine. Returns null if the user isn't in this guild.
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

    // Filter out @everyone, sort by position desc, take top 15 to avoid
    // hitting embed field length limits on members with many roles.
    const roles = target.roles.cache
      .filter((r) => r.id !== ctx.guild.id) // @everyone has same id as guild
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
          // <t:UNIX:R> = Discord relative timestamp, auto-localizes
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
