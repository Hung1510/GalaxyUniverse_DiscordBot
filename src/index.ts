
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
  logger.info(`Received ${signal} - shutting down...`);

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

  await new Promise((r) => setTimeout(r, 200));
  process.exit(0);
}

async function main(): Promise<void> {
    const client = new Client({
    intents: [
  GatewayIntentBits.Guilds,
  GatewayIntentBits.GuildMessages,
  GatewayIntentBits.MessageContent,
  GatewayIntentBits.GuildMembers,
    ],
    partials: [Partials.Channel, Partials.Message],
  });

    process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled promise rejection:', reason);
  });
  process.on('uncaughtException', (err) => {
    logger.error('Uncaught exception:', err);

  });

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
