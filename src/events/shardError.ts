import type { EventHandler } from '../framework/EventHandler.js';
import { logger } from '../utils/logger.js';

const ev: EventHandler<'shardError'> = {
  name: 'shardError',
  execute(_client, err, shardId) {
    logger.error(`Shard ${shardId} error:`, err);
  },
};
export default ev;
