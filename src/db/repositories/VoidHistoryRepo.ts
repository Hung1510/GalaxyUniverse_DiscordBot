
import { db } from '../database.js';

export interface VoidHistoryRow {
  id: number;
  user_id: string;
  guild_id: string;
  total_count: number;
  completed: number;
  reason: string | null;
  jailed_by: string;
  released_by: string | null;
  release_type: 'escape' | 'free' | 'admin';
  jailed_at: number;
  released_at: number;
}

const stmts = {
  insert: db.prepare<[
    string, string, number, number, string | null, string, string | null, string, number, number
  ]>(
    `INSERT INTO void_history
 (user_id, guild_id, total_count, completed, reason, jailed_by, released_by, release_type, jailed_at, released_at)
 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ),
  byUser: db.prepare<[string, number], VoidHistoryRow>(
    'SELECT * FROM void_history WHERE user_id = ? ORDER BY released_at DESC LIMIT ?',
  ),
  countByUser: db.prepare<[string], { c: number }>(
    'SELECT COUNT(*) as c FROM void_history WHERE user_id = ?',
  ),
};

export const VoidHistoryRepo = {
  record(row: Omit<VoidHistoryRow, 'id'>): void {
    stmts.insert.run(
  row.user_id, row.guild_id, row.total_count, row.completed,
  row.reason, row.jailed_by, row.released_by, row.release_type,
  row.jailed_at, row.released_at,
    );
  },
  byUser(userId: string, limit = 10): VoidHistoryRow[] {
    return stmts.byUser.all(userId, limit);
  },
  countByUser(userId: string): number {
    return stmts.countByUser.get(userId)?.c ?? 0;
  },
};
