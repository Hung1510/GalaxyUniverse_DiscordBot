import type { EventHandler } from '../framework/EventHandler.js';
import { logger } from '../utils/logger.js';

const ev: EventHandler<'shardReconnecting'> = {
  name: 'shardReconnecting',
  execute(_client, shardId) {
    logger.info(`Shard ${shardId} reconnecting...`);
  },
};
export default ev;
