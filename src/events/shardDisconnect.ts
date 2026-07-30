
import type { Client } from 'discord.js';
import type { EventHandler } from '../framework/EventHandler.js';
import { logger } from '../utils/logger.js';

const ev: EventHandler<'shardDisconnect'> = {
  name: 'shardDisconnect',
  execute(_client, closeEvent, shardId) {
    logger.warn(`Shard ${shardId} disconnected. Code: ${closeEvent.code} Reason: ${closeEvent.reason}`);
  },
};
export default ev;

export const _typehint = (_c: Client) => void 0;
