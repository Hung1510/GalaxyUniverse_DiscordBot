import { type GuildMember } from 'discord.js';
import { type Command } from '../../framework/Command.js';
import { VoidRepo } from '../../db/repositories/VoidRepo.js';
import { cosmicEmbed, errorEmbed } from '../../utils/embed.js';
import { t } from '../../utils/lang.js';

async function resolveMember(ctx: {
  member: GuildMember;
  args: string[];
  guild: { members: GuildMember['guild']['members'] };
}): Promise<GuildMember | null> {
  const first = ctx.args[0];
  if (!first) return ctx.member;
  const m = /^<@!?(\d+)>$/.exec(first) ?? /^(\d+)$/.exec(first);
  if (!m) return null;
  try {
    return await ctx.guild.members.fetch(m[1]!);
  } catch {
    return null;
  }
}

const command: Command = {
  name: 'voidstatus',
  aliases: ['vs'],
  description: 'Xem tiến độ thoát Void',
  usage: 'voidstatus [@user]',
  category: 'void',
  cooldown: 5,

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

    const embed = cosmicEmbed().setDescription(
      t('void.progress', {
        user: `<@${target.id}>`,
        remaining: sentence.remaining,
        total: sentence.total_count,
      }),
    );
    if (sentence.reason) {
      embed.addFields({ name: 'Lý do', value: sentence.reason });
    }
    await ctx.message.reply({ embeds: [embed] });
  },
};

export default command;
