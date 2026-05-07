/**
 * Entry point. Run order:
 *   1. config.ts loads (validates env + JSON config)
 *   2. database.ts initializes (opens SQLite, runs migrations)
 *   3. We create the Discord Client with required intents
 *   4. We register all events (events/*.ts)
 *   5. We load all commands (commands/*​/​*.ts)
 *   6. We login
 *
 * Steps 1 and 2 happen as side-effects of the import statements below —
 * importing a module runs its top-level code. Order matters: config must
 * load before database (DB reads env), database before any repo.
 */

// Side-effect imports — these MUST come first and in this order.
import './config/config.js';
import './db/database.js';

import { Client, GatewayIntentBits, Partials } from 'discord.js';
import { env } from './config/config.js';
import { loadEvents } from './framework/EventHandler.js';
import { loadCommands } from './framework/CommandHandler.js';
import { logger } from './utils/logger.js';

async function main(): Promise<void> {
  /**
   * Intents = subscriptions to event categories. Discord requires us to
   * declare what we'll listen for. Two of these (MessageContent, GuildMembers)
   * are PRIVILEGED — they need a toggle on the developer portal:
   *   https://discord.com/developers/applications/<APP_ID>/bot
   *
   * - Guilds: basic guild events (channel create, role update, etc.)
   * - GuildMessages: receive messageCreate in guilds
   * - MessageContent (privileged): see actual message text — needed for
   *   prefix commands. Without this, message.content is empty.
   * - GuildMembers (privileged): receive guildMemberAdd, fetch members,
   *   resolve mentions reliably. Needed for moderation later.
   */
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildMembers,
    ],
    /**
     * Partials let the bot receive events about objects it hasn't fully
     * cached. For now we don't strictly need these, but Channel and
     * Message partials are common ones we'll want when we add reaction
     * handling later.
     */
    partials: [Partials.Channel, Partials.Message],
  });

  await loadEvents(client);
  await loadCommands();

  /**
   * Global error handlers — better to log and keep running than to crash
   * the process. Discord disconnects briefly happen; we don't want them
   * to take the bot down.
   */
  process.on('unhandledRejection', (err) => {
    logger.error('Unhandled promise rejection:', err);
  });
  process.on('uncaughtException', (err) => {
    logger.error('Uncaught exception:', err);
    // Don't exit — discord.js usually recovers. If we wanted to be strict,
    // we could exit and let Railway restart us.
  });

  await client.login(env.DISCORD_TOKEN);
}

main().catch((err) => {
  logger.error('Fatal error during startup:', err);
  process.exit(1);
});
