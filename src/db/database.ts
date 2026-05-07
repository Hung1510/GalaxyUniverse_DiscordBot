/**
 * Database initialization and migration runner.
 *
 * Why better-sqlite3:
 * - Synchronous API → no `await` everywhere, simpler code
 * - Single-file → one volume mount on Railway and you're done
 * - Plenty fast for our scale (sub-millisecond reads, tens of thousands of
 *   writes per second on cheap hardware)
 *
 * Migration approach:
 * - Each .sql file in db/migrations/ is run once, in order, on startup
 * - We track which ones have been applied in a `_migrations` table
 * - Adding a feature = drop a new 00X_*.sql file, restart bot
 *
 * No ORM. For our scale it adds complexity without payoff.
 */

import Database from 'better-sqlite3';
import { readFileSync, readdirSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, basename } from 'node:path';
import { env } from '../config/config.js';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ────────────────────────────────────────────────────────────────────────────
// Open database
// ────────────────────────────────────────────────────────────────────────────

// Make sure the parent directory exists. On Railway the volume is mounted
// at /data; on local dev it's ./data. Either way, ensure it.
const dbPath = resolve(process.cwd(), env.DATABASE_PATH);
const dbDir = dirname(dbPath);
mkdirSync(dbDir, { recursive: true });

export const db = new Database(dbPath);

// WAL mode = better concurrency + crash safety. Default is "delete" mode
// which serializes all writes through a journal file.
db.pragma('journal_mode = WAL');

// Enforce foreign key constraints (off by default in SQLite, surprising default).
db.pragma('foreign_keys = ON');

logger.info(`Database opened: ${dbPath}`);

// ────────────────────────────────────────────────────────────────────────────
// Migration runner
// ────────────────────────────────────────────────────────────────────────────

function runMigrations(): void {
  // Bootstrap the tracking table itself.
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      filename   TEXT PRIMARY KEY,
      applied_at INTEGER NOT NULL
    )
  `);

  const migrationsDir = resolve(__dirname, 'migrations');
  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort(); // alphabetical → 001, 002, 003 ordering

  // Find which ones we've already run.
  const stmt = db.prepare<[string], { filename: string }>(
    'SELECT filename FROM _migrations WHERE filename = ?',
  );
  const insert = db.prepare<[string, number]>(
    'INSERT INTO _migrations (filename, applied_at) VALUES (?, ?)',
  );

  for (const file of files) {
    if (stmt.get(file)) continue; // already applied

    const sql = readFileSync(resolve(migrationsDir, file), 'utf8');
    logger.info(`Running migration: ${file}`);

    // Wrap each migration in a transaction so a failure doesn't leave us
    // in a half-applied state.
    const tx = db.transaction(() => {
      db.exec(sql);
      insert.run(basename(file), Date.now());
    });

    try {
      tx();
    } catch (err) {
      logger.error(`Migration failed: ${file}`, err);
      throw err; // don't let the bot run on a half-migrated DB
    }
  }

  logger.info(`Migrations up to date (${files.length} total)`);
}

runMigrations();
