import './config/config.js';
import './db/database.js';

import { Client, GatewayIntentBits, Partials } from 'discord.js';
import { env } from './config/config.js';
import { loadEvents } from './framework/EventHandler.js';
import { loadCommands } from './framework/CommandHandler.js';
import { logger } from './utils/logger.js';

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

  await loadEvents(client);
  await loadCommands();

  process.on('unhandledRejection', (err) => {
    logger.error('Unhandled promise rejection:', err);
  });
  process.on('uncaughtException', (err) => {
    logger.error('Uncaught exception:', err);
  });

  await client.login(env.DISCORD_TOKEN);
}

main().catch((err) => {
  logger.error('Fatal error during startup:', err);
  process.exit(1);
});
