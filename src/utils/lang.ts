/**
 * Translation helper.
 *
 * Reads src/lang/vi.json and exposes `t(key, vars?)` for nested key lookup
 * with placeholder substitution.
 *
 * Usage:
 *   t('common.cooldown', { seconds: 5 })
 *   → "⏰ Đợi 5s nữa rồi dùng tiếp nhé."
 *
 * Why JSON not TS: easy for owner to edit without touching code. Trade-off:
 * no compile-time check that keys exist. If we add another language later,
 * this is the layer that changes.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { logger } from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load once at module init. If you edit vi.json while bot is running,
// you'll need to restart — fine for now.
const langPath = resolve(__dirname, '../lang/vi.json');
const strings = JSON.parse(readFileSync(langPath, 'utf8')) as Record<string, unknown>;

/**
 * Walks a dotted key path through the nested JSON object.
 * Returns undefined if any segment is missing.
 */
function resolveKey(key: string): string | undefined {
  const segments = key.split('.');
  let current: unknown = strings;
  for (const seg of segments) {
    if (typeof current !== 'object' || current === null) return undefined;
    current = (current as Record<string, unknown>)[seg];
  }
  return typeof current === 'string' ? current : undefined;
}

/**
 * Substitutes {placeholder} with values from vars.
 * Missing placeholders are left in the string verbatim — easier to spot bugs.
 */
function substitute(template: string, vars: Record<string, unknown>): string {
  return template.replace(/\{(\w+)\}/g, (match, name: string) => {
    return name in vars ? String(vars[name]) : match;
  });
}

export function t(key: string, vars: Record<string, unknown> = {}): string {
  const template = resolveKey(key);
  if (template === undefined) {
    logger.warn(`Missing translation key: ${key}`);
    return `[${key}]`; // visible fallback so devs notice
  }
  return substitute(template, vars);
}
