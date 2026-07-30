#!/usr/bin/env node

import { config as loadDotenv } from 'dotenv';
import Database from 'better-sqlite3';
import { mkdirSync, readdirSync, statSync, unlinkSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';

loadDotenv();

const DB_PATH = resolve(process.cwd(), process.env.DATABASE_PATH || 'data/galaxy.db');
const BACKUP_DIR = resolve(process.cwd(), 'data', 'backups');
const RETENTION_DAYS = 7;

function ts() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

async function main() {
  mkdirSync(BACKUP_DIR, { recursive: true });
  const outPath = join(BACKUP_DIR, `galaxy-${ts()}.db`);

  console.log(`[backup] Source:  ${DB_PATH}`);
  console.log(`[backup] Destination: ${outPath}`);

  const db = new Database(DB_PATH, { readonly: true });
  try {
    await db.backup(outPath);
    console.log(`[backup] ✓ Backup written.`);
  } finally {
    db.close();
  }

  const verify = new Database(outPath, { readonly: true });
  try {
    const row = verify.prepare('SELECT COUNT(*) AS n FROM _migrations').get();
    console.log(`[backup] ✓ Verified: ${row.n} migrations applied in backup.`);
  } finally {
    verify.close();
  }

  const cutoff = Date.now() - RETENTION_DAYS * 86400 * 1000;
  let pruned = 0;
  for (const file of readdirSync(BACKUP_DIR)) {
    if (!file.startsWith('galaxy-') || !file.endsWith('.db')) continue;
    const full = join(BACKUP_DIR, file);
    if (statSync(full).mtimeMs < cutoff) {
  unlinkSync(full);
  pruned++;
    }
  }
  if (pruned > 0) {
    console.log(`[backup] ✓ Pruned ${pruned} backup(s) older than ${RETENTION_DAYS} days.`);
  }
  console.log(`[backup] Done.`);
}

main().catch((err) => {
  console.error('[backup] FAILED:', err);
  process.exit(1);
});
