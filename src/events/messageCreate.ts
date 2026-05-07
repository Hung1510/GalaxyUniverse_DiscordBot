/**
 * `messageCreate` — fires for every message the bot can see.
 *
 * This event is hot — it runs on EVERY message, command or not. So the code
 * here must be fast on the non-command path. Commands branch off via the
 * CommandHandler.
 *
 * Future steps (when level system is built):
 *   - Award XP here (with cooldown) before the prefix check
 *   - Track void escape attempts in jail channels
 *
 * Intent requirement: needs `MessageContent` privileged intent. That's a
 * Discord developer-portal toggle — see SETUP.md.
 */

import type { Message } from 'discord.js';
import type { EventHandler } from '../framework/EventHandler.js';
import { handle as handleCommand } from '../framework/CommandHandler.js';

const handler: EventHandler<'messageCreate'> = {
  name: 'messageCreate',

  async execute(message: Message) {
    // Ignore other bots — including ourselves. Without this, two bots
    // could trigger each other into a loop.
    if (message.author.bot) return;

    // We only act in guilds. message.inGuild() narrows the type so
    // downstream code can rely on message.guild being non-null.
    if (!message.inGuild()) return;

    // ─── Future: XP award + void tracking go here ────────────────────
    // For now we just dispatch commands.

    // By the time messageCreate fires, the client is logged in, so its
    // generic narrows to Client<true>.
    await handleCommand(message, message.client);
  },
};

export default handler;
