import { db } from '../database.js';
import { ECONOMY } from '../../config/constants.js';

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

const stmts = {
  get: db.prepare<[string], UserRow>('SELECT * FROM users WHERE user_id = ?'),

  insert: db.prepare<[string, number, number]>(
    'INSERT INTO users (user_id, balance, created_at) VALUES (?, ?, ?)',
  ),

  updateBalance: db.prepare<[number, string]>(
    'UPDATE users SET balance = ? WHERE user_id = ?',
  ),

  addBalance: db.prepare<[number, string]>(
    'UPDATE users SET balance = balance + ? WHERE user_id = ?',
  ),

  updateXp: db.prepare<[number, number, string]>(
    'UPDATE users SET xp = ?, level = ? WHERE user_id = ?',
  ),

  topByXp: db.prepare<[number], UserRow>(
    'SELECT * FROM users ORDER BY xp DESC LIMIT ?',
  ),

  topByBalance: db.prepare<[number], UserRow>(
    'SELECT * FROM users ORDER BY balance DESC LIMIT ?',
  ),
};

export const UserRepo = {
  /** Fetch a user; returns undefined if not found. */
  get(userId: string): UserRow | undefined {
    return stmts.get.get(userId);
  },

  getOrCreate(userId: string): UserRow {
    const existing = stmts.get.get(userId);
    if (existing) return existing;

    stmts.insert.run(userId, ECONOMY.STARTING_BALANCE, Date.now());
    const created = stmts.get.get(userId);
    if (!created) throw new Error(`Failed to create user ${userId}`);
    return created;
  },

  setBalance(userId: string, balance: number): void {
    stmts.updateBalance.run(balance, userId);
  },

  addBalance(userId: string, delta: number): void {
    stmts.addBalance.run(delta, userId);
  },

  setXp(userId: string, xp: number, level: number): void {
    stmts.updateXp.run(xp, level, userId);
  },

  topByXp(limit = 10): UserRow[] {
    return stmts.topByXp.all(limit);
  },

  topByBalance(limit = 10): UserRow[] {
    return stmts.topByBalance.all(limit);
  },
};
