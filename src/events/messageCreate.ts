/**
 * Main message handler. Order matters here:
 *
 *   1. Filter bots and DMs early — no XP, no commands, no anything for those
 *   2. Void glausan check — if user is jailed and typing in the void channel,
 *      that supersedes everything else (don't grant XP for serving time)
 *   3. XP grant — fire-and-forget (await for correct error handling, but
 *      don't block command processing on a slow role-grant API call)
 *   4. Command dispatch — only if message starts with prefix
 *
 * This event fires for EVERY message — keep it fast on the common path.
 * The XP cooldown check happens in-memory before any DB hit.
 */

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

    // ── Void glausan tracking ──────────────────────────────────────────
    // If the user is voided and types "glausan" in the jail channel,
    // record the attempt. This path doesn't grant XP and doesn't run as
    // a command.
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

    // ── XP grant ───────────────────────────────────────────────────────
    // Don't grant XP to users currently in the void — they're serving time,
    // not chatting normally. (Cheap check; sentence row already cached
    // by SQLite in practice.)
    try {
      if (!VoidRepo.getSentence(message.author.id)) {
        await LevelService.maybeGrantXpFromMessage(message);
      }
    } catch (err) {
      // Never let an XP failure break command dispatch
      logger.error('XP grant failed:', err);
    }

    // ── Command dispatch ───────────────────────────────────────────────
    await handleMessage(client as Client<true>, message as Message);
  },
};

export default ev;
