
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

let fileLoggingAvailable = false;
try {
  if (!existsSync(LOG_DIR)) {
    mkdirSync(LOG_DIR, { recursive: true });
  }
  fileLoggingAvailable = true;
} catch {

}

function timestamp(): string {
  return new Date().toISOString();
}

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

  const fn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
  fn(line);

  if (fileLoggingAvailable) {
    try {
      appendFileSync(LOG_FILE, line + '\n', 'utf8');
    } catch {
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
