#!/usr/bin/env node

import Database from 'better-sqlite3';
import { readdirSync, statSync } from 'node:fs';
import { resolve, join } from 'node:path';

const BACKUP_DIR = resolve(process.cwd(), 'data', 'backups');

function main() {
  let files;
  try {
    files = readdirSync(BACKUP_DIR)
  .filter((f) => f.startsWith('galaxy-') && f.endsWith('.db'))
  .map((f) => ({ f, mtime: statSync(join(BACKUP_DIR, f)).mtimeMs }))
  .sort((a, b) => b.mtime - a.mtime);
  } catch (err) {
    console.error(`[restore-test] No backup directory yet (${BACKUP_DIR}).`);
    console.error('[restore-test] Run `npm run backup` first.');
    process.exit(1);
  }

  if (files.length === 0) {
    console.error('[restore-test] No backup files found.');
    process.exit(1);
  }

  const latest = join(BACKUP_DIR, files[0].f);
  console.log(`[restore-test] Testing latest backup: ${files[0].f}`);

  const db = new Database(latest, { readonly: true });
  try {
    const tables = db.prepare(
  "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
    ).all();
    console.log(`[restore-test] Tables (${tables.length}):`);
    for (const t of tables) {
  const count = db.prepare(`SELECT COUNT(*) AS n FROM "${t.name}"`).get();
  console.log(`  - ${t.name}: ${count.n} rows`);
    }

    const mig = db.prepare('SELECT filename FROM _migrations ORDER BY filename').all();
    console.log(`[restore-test] Migrations applied: ${mig.map((r) => r.filename).join(', ')}`);

    console.log('[restore-test] ✓ Backup is readable.');
  } finally {
    db.close();
  }
}

main();
