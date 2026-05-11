import { type Command } from '../../framework/Command.js';
import { GuildSettingsRepo } from '../../db/repositories/GuildSettingsRepo.js';
import { VoidService } from '../../services/VoidService.js';
import { VOID } from '../../config/constants.js';
import { cosmicEmbed, errorEmbed } from '../../utils/embed.js';
import { t } from '../../utils/lang.js';

const command: Command = {
  name: 'escape',
  description: 'Gõ keyword để thoát khỏi Void',
  usage: 'escape glausan',
  category: 'void',
  cooldown: 0,

  async execute(ctx) {
    // Must be in the jail channel.
    const settings = GuildSettingsRepo.get(ctx.guild.id);
    if (!settings?.jail_channel_id || ctx.channel.id !== settings.jail_channel_id) {
      await ctx.message.reply({ embeds: [errorEmbed(t('void.wrong_channel'))] });
      return;
    }

    const keyword = ctx.args.join(' ').trim();
    const result = await VoidService.handleAttempt(ctx.member, keyword);
    if (!result) {
      await ctx.message.reply({ embeds: [errorEmbed(t('void.not_jailed'))] });
      return;
    }

    if (result.type === 'cooldown') {
      await ctx.message.reply({
        embeds: [errorEmbed(t('void.attempt_cooldown', { seconds: result.secondsLeft }))],
      });
      return;
    }

    if (result.type === 'wrong') {
      const msg = result.reset
        ? t('void.wrong_keyword', { keyword: VOID.ESCAPE_KEYWORD })
        : `Sai rồi. Còn lại: ${result.remaining}`;
      await ctx.message.reply({ embeds: [errorEmbed(msg)] });
      return;
    }

    if (result.type === 'escaped') {
      const embed = cosmicEmbed().setDescription(t('void.escaped', { user: `<@${ctx.member.id}>` }));
      await ctx.message.reply({ embeds: [embed] });
      return;
    }

    // type === 'progress'
    const embed = cosmicEmbed().setDescription(
      t('void.progress', {
        user: `<@${ctx.member.id}>`,
        remaining: result.remaining,
        total: result.total,
      }),
    );
    await ctx.message.reply({ embeds: [embed] });
  },
};

export default command;
