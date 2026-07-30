import { db } from '../database.js';

export interface VoidSentenceRow {
  user_id: string;
  guild_id: string;
  total_count: number;
  remaining: number;
  reason: string | null;
  jailed_by: string;
  jailed_at: number;
  last_attempt: number | null;
}

const stmts = {
  getSentence: db.prepare<[string], VoidSentenceRow>(
    'SELECT * FROM void_sentences WHERE user_id = ?',
  ),
  insertSentence: db.prepare<[string, string, number, number, string | null, string, number]>(
    'INSERT INTO void_sentences (user_id, guild_id, total_count, remaining, reason, jailed_by, jailed_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
  ),
  deleteSentence: db.prepare<[string]>('DELETE FROM void_sentences WHERE user_id = ?'),
  updateLastAttempt: db.prepare<[number, string]>(
    'UPDATE void_sentences SET last_attempt = ? WHERE user_id = ?',
  ),
  decrementRemaining: db.prepare<[string]>(
    'UPDATE void_sentences SET remaining = remaining - 1, last_attempt = strftime("%s","now")*1000 WHERE user_id = ?',
  ),
  setRemaining: db.prepare<[number, string]>(
    'UPDATE void_sentences SET remaining = ? WHERE user_id = ?',
  ),
  getImmunity: db.prepare<[string], { released_at: number }>(
    'SELECT released_at FROM void_immunity WHERE user_id = ?',
  ),
  upsertImmunity: db.prepare<[string, string, number]>(
    'INSERT INTO void_immunity (user_id, guild_id, released_at) VALUES (?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET released_at = excluded.released_at',
  ),
  deleteImmunity: db.prepare<[string]>('DELETE FROM void_immunity WHERE user_id = ?'),

  listByGuild: db.prepare<[string], VoidSentenceRow>(
    'SELECT * FROM void_sentences WHERE guild_id = ? ORDER BY jailed_at ASC',
  ),
};

export const VoidRepo = {
  getSentence(userId: string): VoidSentenceRow | undefined {
    return stmts.getSentence.get(userId);
  },
  listByGuild(guildId: string): VoidSentenceRow[] {
    return stmts.listByGuild.all(guildId);
  },
  createSentence(
    userId: string,
    guildId: string,
    count: number,
    reason: string | null,
    jailedBy: string,
  ): VoidSentenceRow {
    stmts.insertSentence.run(userId, guildId, count, count, reason, jailedBy, Date.now());
    return stmts.getSentence.get(userId)!;
  },
  deleteSentence(userId: string): void {
    stmts.deleteSentence.run(userId);
  },
  decrementRemaining(userId: string): number {
    stmts.decrementRemaining.run(userId);
    const row = stmts.getSentence.get(userId);
    return row?.remaining ?? 0;
  },
  setRemaining(userId: string, value: number): void {
    stmts.setRemaining.run(value, userId);
  },
  updateLastAttempt(userId: string): void {
    stmts.updateLastAttempt.run(Date.now(), userId);
  },
  immunityRemaining(userId: string, windowMs: number): number {
    const row = stmts.getImmunity.get(userId);
    if (!row) return 0;
    const left = row.released_at + windowMs - Date.now();
    return left > 0 ? left : 0;
  },
  setImmunity(userId: string, guildId: string): void {
    stmts.upsertImmunity.run(userId, guildId, Date.now());
  },
  clearImmunity(userId: string): void {
    stmts.deleteImmunity.run(userId);
  },
};
