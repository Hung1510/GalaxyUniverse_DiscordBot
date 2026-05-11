import { readdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';
import type { Client, ClientEvents } from 'discord.js';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface EventHandler<K extends keyof ClientEvents = keyof ClientEvents> {
  name: K;
  once?: boolean;
  execute(...args: ClientEvents[K]): Promise<void> | void;
}

export async function loadEvents(client: Client): Promise<void> {
  const eventsDir = resolve(__dirname, '../events');
  const files = readdirSync(eventsDir).filter(
    (f) => (f.endsWith('.ts') || f.endsWith('.js')) && !f.endsWith('.d.ts'),
  );

  for (const file of files) {
    const full = resolve(eventsDir, file);
    const mod = (await import(pathToFileURL(full).href)) as { default?: EventHandler };
    const handler = mod.default;

    if (!handler || typeof handler.execute !== 'function') {
      logger.warn(`Skipping event file ${file} — no default EventHandler export`);
      continue;
    }

    if (handler.once) {
      client.once(handler.name, (...args) => handler.execute(...args));
    } else {
      client.on(handler.name, (...args) => handler.execute(...args));
    }

    logger.debug(`Registered event: ${handler.name} (once=${handler.once ?? false})`);
  }

  logger.info(`Loaded ${files.length} event handlers`);
}
