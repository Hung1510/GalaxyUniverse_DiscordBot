import { type Command, PermissionLevel } from '../../framework/Command.js';
import { VoidService } from '../../services/VoidService.js';
import { successEmbed, errorEmbed } from '../../utils/embed.js';
import { VOID } from '../../config/constants.js';
import { t } from '../../utils/lang.js';

const command: Command = {
  name: 'void',
  description: 'Nhốt user vào Void',
  usage: 'void @user [count] [reason]',
  category: 'void',
  cooldown: 5,
  permission: PermissionLevel.MOD,

  async execute(ctx) {
    // Improved error: distinguish "no args" from "user not found" (from earlier feedback).
    if (ctx.args.length === 0) {
      await ctx.message.reply({ embeds: [errorEmbed(t('void.usage_missing'))] });
      return;
    }

    const targetId = ctx.message.mentions.users.first()?.id ?? ctx.args[0];
    if (!targetId) {
      await ctx.message.reply({ embeds: [errorEmbed(t('void.usage_missing'))] });
      return;
    }

    let target;
    try {
      target = await ctx.guild.members.fetch(targetId);
    } catch {
      await ctx.message.reply({ embeds: [errorEmbed(t('common.user_not_found'))] });
      return;
    }

    const countArg = ctx.args[1];
    // VOID.DEFAULT_COUNT is `as const` (a literal type), so widen explicitly
    // so we can reassign within the [1, MAX_COUNT] range.
    let count: number = VOID.DEFAULT_COUNT;
    if (countArg !== undefined) {
      const parsed = parseInt(countArg, 10);
      if (!isNaN(parsed)) {
        count = Math.min(Math.max(parsed, 1), VOID.MAX_COUNT);
      }
    }
    const reason = ctx.args.slice(2).join(' ') || null;

    const result = await VoidService.jail(target, ctx.member, count, reason, ctx.client);
    if (!result.ok) {
      const msgKey = `void.fail_${result.reason}`;
      const extra = result.reason === 'immune'
        ? { secs: String(Math.ceil((result.immunityMsLeft ?? 0) / 1000)) }
        : undefined;
      await ctx.message.reply({ embeds: [errorEmbed(t(msgKey, extra))] });
      return;
    }

    await ctx.message.reply({
      embeds: [successEmbed(t('void.jailed', {
        target: `<@${target.id}>`,
        count: String(count),
      }))],
    });
  },
};

export default command;
