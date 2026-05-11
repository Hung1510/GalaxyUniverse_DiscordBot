import type { Message } from 'discord.js';
import type { EventHandler } from '../framework/EventHandler.js';
import { handle as handleCommand } from '../framework/CommandHandler.js';
import { GuildSettingsRepo } from '../db/repositories/GuildSettingsRepo.js';
import { VoidService } from '../services/VoidService.js';
import { VOID } from '../config/constants.js';
import { cosmicEmbed, errorEmbed } from '../utils/embed.js';
import { t } from '../utils/lang.js';

const handler: EventHandler<'messageCreate'> = {
  name: 'messageCreate',

  async execute(message: Message) {
    if (message.author.bot) return;
    if (!message.inGuild()) return;

    // Void attempt: if user typed in the jail channel, handle as escape attempt.
    const settings = GuildSettingsRepo.get(message.guild.id);
    if (settings?.jail_channel_id === message.channel.id && message.member) {
      const result = await VoidService.handleAttempt(message.member, message.content);
      if (result) {
        // User was jailed, handle the result.
        if (result.type === 'cooldown') {
          await message.reply({
            embeds: [errorEmbed(t('void.attempt_cooldown', { seconds: result.secondsLeft }))],
          });
          return;
        }
        if (result.type === 'wrong') {
          const msg = result.reset
            ? t('void.wrong_keyword', { keyword: VOID.ESCAPE_KEYWORD })
            : `Sai rồi. Còn lại: ${result.remaining}`;
          await message.reply({ embeds: [errorEmbed(msg)] });
          return;
        }
        if (result.type === 'escaped') {
          const embed = cosmicEmbed().setDescription(
            t('void.escaped', { user: `<@${message.author.id}>` }),
          );
          await message.reply({ embeds: [embed] });
          return;
        }
        // progress
        const embed = cosmicEmbed().setDescription(
          t('void.progress', {
            user: `<@${message.author.id}>`,
            remaining: result.remaining,
            total: result.total,
          }),
        );
        await message.reply({ embeds: [embed] });
        return;
      }
      // Not jailed but typed in jail channel — let it fall through to command handling.
    }

    await handleCommand(message, message.client);
  },
};

export default handler;