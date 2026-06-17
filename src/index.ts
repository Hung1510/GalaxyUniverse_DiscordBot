/**
 * Galaxy Universe — entry point.
 *
 * Startup order (matters):
 *   1. config.ts loads + validates env/config (Zod) → crash if invalid
 *   2. database.ts opens SQLite + runs migrations
 *   3. Build Discord Client with required intents
 *   4. Register process-level handlers (uncaught, unhandled, SIGINT/TERM)
 *   5. Load events + commands
 *   6. client.login()
 *
 * Shutdown order (also matters):
 *   1. Stop accepting new commands (set shutting-down flag — TBD)
 *   2. Wait briefly for in-flight handlers
 *   3. Stop scheduler
 *   4. client.destroy()
 *   5. closeDatabase() — WAL checkpoint + close
 *   6. exit(0)
 */

// Side-effect imports must come first, in this order.
import './config/config.js';
import './db/database.js';

import { Client, GatewayIntentBits, Partials } from 'discord.js';
import { env } from './config/config.js';
import { closeDatabase } from './db/database.js';
import { loadEvents } from './framework/EventHandler.js';
import { loadCommands } from './framework/CommandHandler.js';
import { stopScheduler } from './services/SchedulerService.js';
import { logger } from './utils/logger.js';

let shuttingDown = false;

async function shutdown(signal: string, client: Client | null): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info(`Received ${signal} — shutting down...`);

  // Give in-flight handlers up to 3 seconds to finish before we tear down.
  // discord.js doesn't expose an "active handlers" count, so this is a
  // best-effort grace period.
  await new Promise((r) => setTimeout(r, 1500));

  try {
    stopScheduler();
  } catch (err) {
    logger.error('Error stopping scheduler:', err);
  }

  try {
    if (client) {
      await client.destroy();
      logger.info('Discord client destroyed.');
    }
  } catch (err) {
    logger.error('Error destroying client:', err);
  }

  try {
    closeDatabase();
  } catch (err) {
    logger.error('Error closing database:', err);
  }

  // Small flush window for log files.
  await new Promise((r) => setTimeout(r, 200));
  process.exit(0);
}

async function main(): Promise<void> {
  /**
   * Privileged intents — toggle these ON in the Developer Portal too:
   *   - MessageContent (needed for prefix commands)
   *   - GuildMembers (needed for mention resolution + moderation)
   */
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildMembers,
    ],
    partials: [Partials.Channel, Partials.Message],
  });

  /**
   * Item #2: process-level safety net for things the command-level
   * try/catch can't catch (event handlers, timers, native promises).
   */
  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled promise rejection:', reason);
  });
  process.on('uncaughtException', (err) => {
    logger.error('Uncaught exception:', err);
    // Don't exit — pm2/Onidel will restart if the process dies, but we'd
    // prefer to stay up. Discord disconnects briefly happen.
  });

  /**
   * Item #1: graceful shutdown signals.
   *
   * pm2 sends SIGINT on `pm2 restart`. Onidel/systemd send SIGTERM on
   * reboot or `systemctl stop`. Both should trigger clean teardown so
   * SQLite WAL is checkpointed and Discord knows we went offline cleanly.
   */
  process.on('SIGINT', () => void shutdown('SIGINT', client));
  process.on('SIGTERM', () => void shutdown('SIGTERM', client));

  await loadEvents(client);
  await loadCommands();

  await client.login(env.DISCORD_TOKEN);
}

main().catch((err) => {
  logger.error('Fatal error during startup:', err);
  process.exit(1);
});
