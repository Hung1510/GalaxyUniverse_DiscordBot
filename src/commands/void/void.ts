import { type GuildMember } from 'discord.js';
import { type Command, PermissionLevel } from '../../framework/Command.js';
import { VoidService } from '../../services/VoidService.js';
import { VOID } from '../../config/constants.js';
import { cosmicEmbed, errorEmbed } from '../../utils/embed.js';
import { t } from '../../utils/lang.js';

// Parse a mention or raw ID from the first arg.
async function resolveMember(ctx: {
  args: string[];
  guild: { members: GuildMember['guild']['members']; id: string };
}): Promise<GuildMember | null> {
  const first = ctx.args[0];
  if (!first) return null;
  const m = /^<@!?(\d+)>$/.exec(first) ?? /^(\d+)$/.exec(first);
  if (!m) return null;
  try {
    return await ctx.guild.members.fetch(m[1]!);
  } catch {
    return null;
  }
}

const command: Command = {
  name: 'void',
  description: 'Nhốt user vào Void',
  usage: 'void @user [số_lần] [lý_do...]',
  category: 'void',
  cooldown: 5,
  permission: PermissionLevel.MOD,

  async execute(ctx) {
    const target = await resolveMember(ctx);
    if (!target) {
      await ctx.message.reply({ embeds: [errorEmbed(t('common.invalid_user'))] });
      return;
    }

    if (target.id === ctx.member.id) {
      await ctx.message.reply({ embeds: [errorEmbed(t('void.self_jail'))] });
      return;
    }
    if (target.user.bot) {
      await ctx.message.reply({ embeds: [errorEmbed(t('void.bot_jail'))] });
      return;
    }

    // Parse optional count, clamp to range.
    const rawCount = ctx.args[1] ? parseInt(ctx.args[1], 10) : VOID.DEFAULT_COUNT;
    const count = Number.isFinite(rawCount)
      ? Math.max(VOID.MIN_COUNT, Math.min(VOID.MAX_COUNT, rawCount))
      : VOID.DEFAULT_COUNT;

    // Everything after args[0] and args[1] is the reason.
    const reason = ctx.args.slice(2).join(' ').trim() || null;

    const result = await VoidService.jail(target, count, reason, ctx.member.id);

    if (!result.ok) {
      if (result.reason === 'already_jailed') {
        await ctx.message.reply({ embeds: [errorEmbed(t('void.already_jailed'))] });
        return;
      }
      if (result.reason === 'immune') {
        const minutes = Math.ceil((result.immunityMsLeft ?? 0) / 60_000);
        await ctx.message.reply({ embeds: [errorEmbed(t('void.immunity', { minutes }))] });
        return;
      }
      return;
    }

    const embed = cosmicEmbed().setDescription(
      t('void.jailed', {
        user: `<@${target.id}>`,
        count,
        reason: reason ?? 'không có',
      }),
    );
    await ctx.message.reply({ embeds: [embed] });
  },
};

export default command;
