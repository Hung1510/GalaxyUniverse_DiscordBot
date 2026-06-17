import { readdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';
import type { Client, ClientEvents } from 'discord.js';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface EventHandler<K extends keyof ClientEvents> {
  name: K;
  once?: boolean;
  execute(client: Client, ...args: ClientEvents[K]): Promise<void> | void;
}

export async function loadEvents(client: Client): Promise<void> {
  const dir = resolve(__dirname, '..', 'events');
  let count = 0;
  for (const file of readdirSync(dir)) {
    if (!file.endsWith('.js') && !file.endsWith('.ts')) continue;
    if (file.endsWith('.d.ts')) continue;
    const mod = (await import(pathToFileURL(resolve(dir, file)).href)) as {
      default?: EventHandler<keyof ClientEvents>;
    };
    const ev = mod.default;
    if (!ev) continue;
    if (ev.once) {
      client.once(ev.name, (...args) => Promise.resolve(ev.execute(client, ...args)).catch((e) => logger.error(`event ${ev.name} threw:`, e)));
    } else {
      client.on(ev.name, (...args) => Promise.resolve(ev.execute(client, ...args)).catch((e) => logger.error(`event ${ev.name} threw:`, e)));
    }
    count++;
  }
  logger.info(`Loaded ${count} event handlers.`);
}
