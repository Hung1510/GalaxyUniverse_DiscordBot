import type { Client } from 'discord.js';
import type { EventHandler } from '../framework/EventHandler.js';
import { auditPermissions } from '../services/PermissionAuditService.js';
import { startScheduler } from '../services/SchedulerService.js';
import { logger } from '../utils/logger.js';

const ev: EventHandler<'clientReady'> = {
  name: 'clientReady',
  once: true,
  async execute(client) {
    const c = client as Client<true>;
    logger.info(`Logged in as ${c.user.tag} (${c.user.id})`);
    logger.info(`Watching ${c.guilds.cache.size} guild(s)`);

    await auditPermissions(c);

    startScheduler(c);
  },
};

export default ev;
