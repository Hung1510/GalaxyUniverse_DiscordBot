/**
 * `ready` event — fires once when the bot has authenticated with Discord
 * and downloaded its initial guild list.
 *
 * In discord.js v14, the modern event is actually `clientReady` (renamed
 * from `ready`), but `ready` is still aliased. We use `clientReady` to
 * future-proof against the deprecation.
 *
 * What we do here:
 *   - Log identity so you know in console which account/version is running
 *   - Set the bot's status (presence) — visible to users in the member list
 *
 * This handler is idempotent: even if it fires twice (rare reconnect edge
 * case), running it twice has no bad effect.
 */

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

    logger.info(`✅ Bot online: ${userTag}`);
    logger.info(`   Guilds: ${guildCount} · Members (cached): ${userCount}`);
    logger.info(`   Prefix: ${env.PREFIX}`);

    // Presence: shows under bot name in member list.
    // Watching = "Watching X" prefix; Playing = "Playing X" prefix.
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
