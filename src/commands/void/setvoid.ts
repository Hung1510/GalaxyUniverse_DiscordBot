import { type GuildMember } from 'discord.js';
import { type Command, PermissionLevel } from '../../framework/Command.js';
import { VoidRepo } from '../../db/repositories/VoidRepo.js';
import { VOID } from '../../config/constants.js';
import { cosmicEmbed, errorEmbed } from '../../utils/embed.js';
import { t } from '../../utils/lang.js';

async function resolveMember(ctx: {
  args: string[];
  guild: { members: GuildMember['guild']['members'] };
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
  name: 'setvoid',
  description: 'Chỉnh số lần còn lại trong Void (mod)',
  usage: 'setvoid @user <số>',
  category: 'void',
  cooldown: 5,
  permission: PermissionLevel.MOD,

  async execute(ctx) {
    const target = await resolveMember(ctx);
    if (!target) {
      await ctx.message.reply({ embeds: [errorEmbed(t('common.invalid_user'))] });
      return;
    }

    const sentence = VoidRepo.getSentence(target.id);
    if (!sentence) {
      await ctx.message.reply({ embeds: [errorEmbed(t('void.not_jailed'))] });
      return;
    }

    const raw = parseInt(ctx.args[1] ?? '', 10);
    if (!Number.isFinite(raw)) {
      await ctx.message.reply({
        embeds: [errorEmbed(t('common.invalid_args', { usage: 'g!setvoid @user <số>' }))],
      });
      return;
    }
    const value = Math.max(0, Math.min(VOID.MAX_COUNT, raw));

    VoidRepo.setRemaining(target.id, value);

    const embed = cosmicEmbed().setDescription(
      t('void.progress', {
        user: `<@${target.id}>`,
        remaining: value,
        total: sentence.total_count,
      }),
    );
    await ctx.message.reply({ embeds: [embed] });
  },
};

export default command;
