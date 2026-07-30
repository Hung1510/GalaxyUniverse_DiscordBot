
import type { Client, Message } from 'discord.js';
import type { EventHandler } from '../framework/EventHandler.js';
import { handleMessage } from '../framework/CommandHandler.js';
import { VoidRepo } from '../db/repositories/VoidRepo.js';
import { GuildSettingsRepo } from '../db/repositories/GuildSettingsRepo.js';
import { VoidService } from '../services/VoidService.js';
import { LevelService } from '../services/LevelService.js';
import { t } from '../utils/lang.js';
import { logger } from '../utils/logger.js';

const GLAUSAN_KEYWORD = 'glausan';

const ev: EventHandler<'messageCreate'> = {
  name: 'messageCreate',
  async execute(client, message) {
    if (message.author.bot) return;
    if (!message.inGuild()) return;

    try {
  const settings = GuildSettingsRepo.get(message.guildId);
  if (
    settings?.jail_channel_id === message.channelId &&
    message.content.trim().toLowerCase() === GLAUSAN_KEYWORD &&
    VoidRepo.getSentence(message.author.id)
  ) {
    const member = message.member;
    if (member) {
  const result = await VoidService.recordAttempt(member, client as Client<true>);
  if (result.type === 'cooldown') {
await message.reply(t('void.attempt_cooldown', { secs: String(result.secondsLeft) })).catch(() => {});
  } else if (result.type === 'progress') {
await message.reply(t('void.attempt_progress', {
  remaining: String(result.remaining),
  total: String(result.total),
})).catch(() => {});
  } else if (result.type === 'escaped') {
await message.reply(t('void.escaped')).catch(() => {});
  }
  return;
    }
  }
    } catch (err) {
  logger.error('Error in void attempt tracking:', err);
    }

    try {
  if (!VoidRepo.getSentence(message.author.id)) {
    await LevelService.maybeGrantXpFromMessage(message);
  }
    } catch (err) {

  logger.error('XP grant failed:', err);
    }

    await handleMessage(client as Client<true>, message as Message);
  },
};

export default ev;
