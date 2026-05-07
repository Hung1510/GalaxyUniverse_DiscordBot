/**
 * Simple console logger with timestamps and level prefixes.
 *
 * No external dep — winston/pino would be overkill for one server.
 * If we ever need structured logs (log shipping, search), swap implementation
 * here without touching call sites.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const levelTags: Record<LogLevel, string> = {
  debug: '🐛 DEBUG',
  info: 'ℹ️  INFO ',
  warn: '⚠️  WARN ',
  error: '❌ ERROR',
};

function timestamp(): string {
  return new Date().toISOString();
}

function format(level: LogLevel, msg: string): string {
  return `[${timestamp()}] ${levelTags[level]} ${msg}`;
}

export const logger = {
  debug(msg: string, ...rest: unknown[]): void {
    if (process.env.NODE_ENV === 'production') return;
    console.debug(format('debug', msg), ...rest);
  },
  info(msg: string, ...rest: unknown[]): void {
    console.log(format('info', msg), ...rest);
  },
  warn(msg: string, ...rest: unknown[]): void {
    console.warn(format('warn', msg), ...rest);
  },
  error(msg: string, ...rest: unknown[]): void {
    console.error(format('error', msg), ...rest);
  },
};
