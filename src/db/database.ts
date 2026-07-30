
import Database from 'better-sqlite3';
import { readFileSync, readdirSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, basename } from 'node:path';
import { env } from '../config/config.js';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = resolve(process.cwd(), env.DATABASE_PATH);
mkdirSync(dirname(dbPath), { recursive: true });

export const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
logger.info(`Database opened: ${dbPath}`);

function runMigrations(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
  filename   TEXT PRIMARY KEY,
  applied_at INTEGER NOT NULL
    )
  `);

  const migrationsDir = resolve(__dirname, 'migrations');
  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  const checkStmt = db.prepare<[string], { filename: string }>(
    'SELECT filename FROM _migrations WHERE filename = ?',
  );
  const recordStmt = db.prepare<[string, number]>(
    'INSERT INTO _migrations (filename, applied_at) VALUES (?, ?)',
  );

  for (const file of files) {
    if (checkStmt.get(file)) continue;
    const sql = readFileSync(resolve(migrationsDir, file), 'utf8');

    const tx = db.transaction(() => {
  db.exec(sql);
  recordStmt.run(file, Date.now());
    });
    tx();
    logger.info(`Migration applied: ${basename(file)}`);
  }
}

runMigrations();

export function closeDatabase(): void {
  try {

    db.pragma('wal_checkpoint(TRUNCATE)');
    db.close();
    logger.info('Database closed cleanly.');
  } catch (err) {
    logger.error('Error closing database:', err);
  }
}
