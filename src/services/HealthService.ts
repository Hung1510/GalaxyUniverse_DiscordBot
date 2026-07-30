
import type { Client } from 'discord.js';
import { db } from '../db/database.js';
import { metrics } from './MetricsService.js';

export interface HealthSnapshot {
  wsPingMs: number;
  dbQueryMs: number;
  uptimeMs: number;
  memMb: number;
  totalCommands: number;
}

export function snapshot(client: Client<true>): HealthSnapshot {
  const wsPingMs = Math.round(client.ws.ping);

  const t = Date.now();

  db.prepare('SELECT 1 as ok').get();
  const dbQueryMs = Date.now() - t;

  const memMb = Math.round(process.memoryUsage().rss / 1024 / 1024);
  const allCmds = metrics.snapshot();
  const totalCommands = allCmds.reduce((acc, x) => acc + x.total, 0);

  return {
    wsPingMs,
    dbQueryMs,
    uptimeMs: metrics.uptimeMs(),
    memMb,
    totalCommands,
  };
}

export function formatUptime(ms: number): string {
  const sec = Math.floor(ms / 1000);
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return `${d}d ${h}h ${m}m`;
}
