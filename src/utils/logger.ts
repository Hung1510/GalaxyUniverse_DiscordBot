/**
 * Logger with file output (item #6).
 *
 * Console output disappears on a VPS after pm2 rotates logs, and during
 * crashes you often can't get to console at all. We tee everything to
 * disk so post-mortem debugging is possible.
 *
 * Log file lives at: data/logs/bot.log (rotated by pm2-logrotate in prod)
 *
 * Log levels:
 *   debug  → suppressed in production (NODE_ENV=production)
 *   info   → normal events (command ran, user joined, etc.)
 *   warn   → recoverable issues (rate limit hit, missing optional config)
 *   error  → exceptions, failed operations
 */

import { appendFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { inspect } from 'node:util';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const levelTags: Record<LogLevel, string> = {
  debug: '🐛 DEBUG',
  info: 'ℹ️  INFO ',
  warn: '⚠️  WARN ',
  error: '❌ ERROR',
};

const LOG_DIR = resolve(process.cwd(), 'data', 'logs');
const LOG_FILE = resolve(LOG_DIR, 'bot.log');

// Ensure log dir exists. We do this once at module load — if the dir can't
// be created (permissions, readonly fs), we fall back to console-only.
let fileLoggingAvailable = false;
try {
  if (!existsSync(LOG_DIR)) {
    mkdirSync(LOG_DIR, { recursive: true });
  }
  fileLoggingAvailable = true;
} catch {
  // Fall back to console only.
}

function timestamp(): string {
  return new Date().toISOString();
}

/** Format extra args as inspectable strings (handles Error, objects, etc.) */
function formatExtras(rest: unknown[]): string {
  if (rest.length === 0) return '';
  return ' ' + rest.map((x) => {
    if (x instanceof Error) return x.stack ?? x.message;
    return inspect(x, { depth: 3, breakLength: 120 });
  }).join(' ');
}

function write(level: LogLevel, msg: string, rest: unknown[]): void {
  const extras = formatExtras(rest);
  const line = `[${timestamp()}] ${levelTags[level]} ${msg}${extras}`;

  // Always write to console
  const fn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
  fn(line);

  // Tee to file if available
  if (fileLoggingAvailable) {
    try {
      appendFileSync(LOG_FILE, line + '\n', 'utf8');
    } catch {
      // If a single write fails (disk full, etc.), don't crash the bot.
    }
  }
}

export const logger = {
  debug(msg: string, ...rest: unknown[]): void {
    if (process.env.NODE_ENV === 'production') return;
    write('debug', msg, rest);
  },
  info(msg: string, ...rest: unknown[]): void {
    write('info', msg, rest);
  },
  warn(msg: string, ...rest: unknown[]): void {
    write('warn', msg, rest);
  },
  error(msg: string, ...rest: unknown[]): void {
    write('error', msg, rest);
  },
};
