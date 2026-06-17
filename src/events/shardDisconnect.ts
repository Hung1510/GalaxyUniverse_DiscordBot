/**
 * Shard lifecycle logging (item #5 — reconnection resilience).
 *
 * discord.js auto-reconnects, but silently. We log every transition so
 * when commands seem to "freeze", the logs tell you the gateway dropped
 * and reconnected — not your bug.
 *
 * We use multiple individual handlers here instead of one combined event
 * because each shard event has a different signature.
 */

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

/**
 * Sibling handlers (loaded automatically since EventHandler loader reads
 * the folder). We export them as their own default-export files to keep
 * the loader's one-event-per-file contract clean.
 */
export const _typehint = (_c: Client) => void 0;
