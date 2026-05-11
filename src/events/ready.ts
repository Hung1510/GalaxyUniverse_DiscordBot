import { ActivityType, type Client } from 'discord.js';
import type { EventHandler } from '../framework/EventHandler.js';
import { env } from '../config/config.js';
import { logger } from '../utils/logger.js';

const handler: EventHandler<'clientReady'> = {
  name: 'clientReady',
  once: true,

  execute(client: Client<true>) {
    const userTag = client.user.tag;
    const guildCount = client.guilds.cache.size;
    const userCount = client.guilds.cache.reduce(
      (sum, g) => sum + g.memberCount,
      0,
    );

    logger.info(`Bot online: ${userTag}`);
    logger.info(` Guilds: ${guildCount} · Members (cached): ${userCount}`);
    logger.info(` Prefix: ${env.PREFIX}`);

    client.user.setPresence({
      activities: [
        {
          name: `🌌 vũ trụ | ${env.PREFIX}help`,
          type: ActivityType.Watching,
        },
      ],
      status: 'online',
    });
  },
};

export default handler;
