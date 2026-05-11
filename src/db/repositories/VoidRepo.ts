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

export interface VoidImmunityRow {
  user_id: string;
  guild_id: string;
  released_at: number;
}

const stmts = {
  getSentence: db.prepare<[string], VoidSentenceRow>(
    'SELECT * FROM void_sentences WHERE user_id = ?',
  ),

  createSentence: db.prepare<[string, string, number, number, string | null, string, number]>(`
    INSERT INTO void_sentences (user_id, guild_id, total_count, remaining, reason, jailed_by, jailed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `),

  // Decrement remaining count and record attempt time.
  decrementRemaining: db.prepare<[number, string]>(
    'UPDATE void_sentences SET remaining = remaining - 1, last_attempt = ? WHERE user_id = ?',
  ),

  // Reset progress to total_count on typo punishment.
  resetProgress: db.prepare<[number, string]>(
    'UPDATE void_sentences SET remaining = total_count, last_attempt = ? WHERE user_id = ?',
  ),

  // Mod override of remaining count.
  setRemaining: db.prepare<[number, string]>(
    'UPDATE void_sentences SET remaining = ? WHERE user_id = ?',
  ),

  // Record attempt time without changing count (used for cooldown-only tracking).
  touchAttempt: db.prepare<[number, string]>(
    'UPDATE void_sentences SET last_attempt = ? WHERE user_id = ?',
  ),

  deleteSentence: db.prepare<[string]>(
    'DELETE FROM void_sentences WHERE user_id = ?',
  ),

  listByGuild: db.prepare<[string], VoidSentenceRow>(
    'SELECT * FROM void_sentences WHERE guild_id = ?',
  ),

  // Immunity table.
  getImmunity: db.prepare<[string], VoidImmunityRow>(
    'SELECT * FROM void_immunity WHERE user_id = ?',
  ),

  upsertImmunity: db.prepare<[string, string, number]>(`
    INSERT INTO void_immunity (user_id, guild_id, released_at)
    VALUES (?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET released_at = excluded.released_at
  `),

  deleteImmunity: db.prepare<[string]>(
    'DELETE FROM void_immunity WHERE user_id = ?',
  ),
};

export const VoidRepo = {
  getSentence(userId: string): VoidSentenceRow | undefined {
    return stmts.getSentence.get(userId);
  },

  createSentence(
    userId: string,
    guildId: string,
    count: number,
    reason: string | null,
    jailedBy: string,
  ): VoidSentenceRow {
    stmts.createSentence.run(userId, guildId, count, count, reason, jailedBy, Date.now());
    const row = stmts.getSentence.get(userId);
    if (!row) throw new Error(`Failed to create sentence for ${userId}`);
    return row;
  },

  // Returns the new remaining count, or 0 if the user has escaped.
  decrementRemaining(userId: string): number {
    stmts.decrementRemaining.run(Date.now(), userId);
    const row = stmts.getSentence.get(userId);
    return row?.remaining ?? 0;
  },

  resetProgress(userId: string): void {
    stmts.resetProgress.run(Date.now(), userId);
  },

  setRemaining(userId: string, remaining: number): void {
    stmts.setRemaining.run(remaining, userId);
  },

  touchAttempt(userId: string): void {
    stmts.touchAttempt.run(Date.now(), userId);
  },

  deleteSentence(userId: string): void {
    stmts.deleteSentence.run(userId);
  },

  listByGuild(guildId: string): VoidSentenceRow[] {
    return stmts.listByGuild.all(guildId);
  },

  // Returns ms remaining on immunity, or 0 if free to re-jail.
  immunityRemaining(userId: string, immunityMs: number): number {
    const row = stmts.getImmunity.get(userId);
    if (!row) return 0;
    const expires = row.released_at + immunityMs;
    const left = expires - Date.now();
    return left > 0 ? left : 0;
  },

  setImmunity(userId: string, guildId: string): void {
    stmts.upsertImmunity.run(userId, guildId, Date.now());
  },

  clearImmunity(userId: string): void {
    stmts.deleteImmunity.run(userId);
  },
};
