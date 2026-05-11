import Database from 'better-sqlite3';
import { readFileSync, readdirSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, basename } from 'node:path';
import { env } from '../config/config.js';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

//ensure  parent directory exists. On Railway the volume is mounted
const dbPath = resolve(process.cwd(), env.DATABASE_PATH);
const dbDir = dirname(dbPath);
mkdirSync(dbDir, { recursive: true });

export const db = new Database(dbPath);

// WAL mode
db.pragma('journal_mode = WAL');

// Enforce foreign key constraints
db.pragma('foreign_keys = ON');

logger.info(`Database opened: ${dbPath}`);

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
    .sort(); // alphabetical

  // Find which already run.
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

    const tx = db.transaction(() => {
      db.exec(sql);
      insert.run(basename(file), Date.now());
    });

    try {
      tx();
    } catch (err) {
      logger.error(`Migration failed: ${file}`, err);
      throw err;
    }
  }

  logger.info(`Migrations up to date (${files.length} total)`);
}

runMigrations();
