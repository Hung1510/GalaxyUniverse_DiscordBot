import { type GuildMember } from 'discord.js';
import { type Command, PermissionLevel } from '../../framework/Command.js';
import { VoidService } from '../../services/VoidService.js';
import { VoidRepo } from '../../db/repositories/VoidRepo.js';
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
  name: 'free',
  description: 'Thả user khỏi Void (mod)',
  usage: 'free @user',
  category: 'void',
  cooldown: 5,
  permission: PermissionLevel.MOD,

  async execute(ctx) {
    const target = await resolveMember(ctx);
    if (!target) {
      await ctx.message.reply({ embeds: [errorEmbed(t('common.invalid_user'))] });
      return;
    }

    if (!VoidRepo.getSentence(target.id)) {
      await ctx.message.reply({ embeds: [errorEmbed(t('void.not_jailed'))] });
      return;
    }

    await VoidService.release(target, ctx.member.id);
    const embed = cosmicEmbed().setDescription(
      t('void.freed', { user: `<@${target.id}>`, mod: `<@${ctx.member.id}>` }),
    );
    await ctx.message.reply({ embeds: [embed] });
  },
};

export default command;
