import { db } from '../database.js';

export interface UserRow {
  user_id: string;
  balance: number;
  bank: number;
  xp: number;
  level: number;
  daily_streak: number;
  last_daily: number | null;
  created_at: number;
}

export interface LeaderboardRow {
  user_id: string;
  xp: number;
  level: number;
  rank: number;
}

const stmts = {
  get: db.prepare<[string], UserRow>('SELECT * FROM users WHERE user_id = ?'),
  insert: db.prepare<[string, number]>(
    'INSERT INTO users (user_id, created_at) VALUES (?, ?)',
  ),

  addXp: db.prepare<[number, string]>(
    'UPDATE users SET xp = xp + ? WHERE user_id = ?',
  ),
  setLevel: db.prepare<[number, string]>(
    'UPDATE users SET level = ? WHERE user_id = ?',
  ),
  setXpAndLevel: db.prepare<[number, number, string]>(
    'UPDATE users SET xp = ?, level = ? WHERE user_id = ?',
  ),

  topByXp: db.prepare<[number, number], LeaderboardRow>(
    `SELECT user_id, xp, level,
            RANK() OVER (ORDER BY xp DESC) AS rank
     FROM users
     WHERE xp > 0
     ORDER BY xp DESC
     LIMIT ? OFFSET ?`,
  ),

  rankOf: db.prepare<[string], { rank: number }>(
    `SELECT (
       SELECT COUNT(*) + 1 FROM users u2
       WHERE u2.xp > (SELECT xp FROM users WHERE user_id = ?)
     ) AS rank`,
  ),
  countWithXp: db.prepare<[], { c: number }>(
    'SELECT COUNT(*) AS c FROM users WHERE xp > 0',
  ),
};

export const UserRepo = {
  get(userId: string): UserRow | undefined {
    return stmts.get.get(userId);
  },
  getOrCreate(userId: string): UserRow {
    let row = stmts.get.get(userId);
    if (!row) {
      stmts.insert.run(userId, Date.now());
      row = stmts.get.get(userId)!;
    }
    return row;
  },
    addXp(userId: string, amount: number): UserRow {
    this.getOrCreate(userId);
    stmts.addXp.run(amount, userId);
    return stmts.get.get(userId)!;
  },
  setLevel(userId: string, level: number): void {
    this.getOrCreate(userId);
    stmts.setLevel.run(level, userId);
  },
  setXpAndLevel(userId: string, xp: number, level: number): void {
    this.getOrCreate(userId);
    stmts.setXpAndLevel.run(xp, level, userId);
  },
    topByXp(limit: number, offset = 0): LeaderboardRow[] {
    return stmts.topByXp.all(limit, offset);
  },
    rankOf(userId: string): number {
    const row = stmts.get.get(userId);
    if (!row || row.xp === 0) return 0;
    return stmts.rankOf.get(userId)?.rank ?? 0;
  },
    countWithXp(): number {
    return stmts.countWithXp.get()?.c ?? 0;
  },
};
