import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { logger } from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const langPath = resolve(__dirname, '../lang/vi.json');
const strings = JSON.parse(readFileSync(langPath, 'utf8')) as Record<string, unknown>;

function resolveKey(key: string): string | undefined {
  const segments = key.split('.');
  let current: unknown = strings;
  for (const seg of segments) {
    if (typeof current !== 'object' || current === null) return undefined;
    current = (current as Record<string, unknown>)[seg];
  }
  return typeof current === 'string' ? current : undefined;
}

function substitute(template: string, vars: Record<string, unknown>): string {
  return template.replace(/\{(\w+)\}/g, (match, name: string) => {
    return name in vars ? String(vars[name]) : match;
  });
}

export function t(key: string, vars: Record<string, unknown> = {}): string {
  const template = resolveKey(key);
  if (template === undefined) {
    logger.warn(`Missing translation key: ${key}`);
    return `[${key}]`;
  }
  return substitute(template, vars);
}
