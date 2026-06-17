import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { logger } from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const langPath = resolve(__dirname, '..', 'lang', 'vi.json');
const strings = JSON.parse(readFileSync(langPath, 'utf8')) as Record<string, unknown>;

function resolveKey(key: string): string | undefined {
  const segments = key.split('.');
  let cursor: unknown = strings;
  for (const seg of segments) {
    if (cursor && typeof cursor === 'object' && seg in (cursor as object)) {
      cursor = (cursor as Record<string, unknown>)[seg];
    } else {
      return undefined;
    }
  }
  return typeof cursor === 'string' ? cursor : undefined;
}

export function t(key: string, vars?: Record<string, string>): string {
  let str = resolveKey(key);
  if (str === undefined) {
    logger.warn(`Missing translation key: ${key}`);
    return key;
  }
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
    }
  }
  return str;
}
