import type { EventHandler } from '../framework/EventHandler.js';
import { logger } from '../utils/logger.js';

const ev: EventHandler<'shardResume'> = {
  name: 'shardResume',
  execute(_client, shardId, replayedEvents) {
    logger.info(`Shard ${shardId} resumed (replayed ${replayedEvents} events).`);
  },
};
export default ev;
