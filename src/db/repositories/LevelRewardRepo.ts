
import { db } from '../database.js';

export interface LevelRewardRow {
  guild_id: string;
  level: number;
  role_id: string;
  created_at: number;
}

const stmts = {
  list: db.prepare<[string], LevelRewardRow>(
    'SELECT * FROM level_role_rewards WHERE guild_id = ? ORDER BY level ASC',
  ),

  forLevelUpTo: db.prepare<[string, number], LevelRewardRow>(
    'SELECT * FROM level_role_rewards WHERE guild_id = ? AND level <= ? ORDER BY level ASC',
  ),
  getOne: db.prepare<[string, number], LevelRewardRow>(
    'SELECT * FROM level_role_rewards WHERE guild_id = ? AND level = ?',
  ),
  upsert: db.prepare<[string, number, string, number]>(
    `INSERT INTO level_role_rewards (guild_id, level, role_id, created_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(guild_id, level) DO UPDATE SET role_id = excluded.role_id`,
  ),
  remove: db.prepare<[string, number]>(
    'DELETE FROM level_role_rewards WHERE guild_id = ? AND level = ?',
  ),
};

export const LevelRewardRepo = {
  list(guildId: string): LevelRewardRow[] {
    return stmts.list.all(guildId);
  },
  forLevelUpTo(guildId: string, level: number): LevelRewardRow[] {
    return stmts.forLevelUpTo.all(guildId, level);
  },
  getOne(guildId: string, level: number): LevelRewardRow | undefined {
    return stmts.getOne.get(guildId, level);
  },
  set(guildId: string, level: number, roleId: string): void {
    stmts.upsert.run(guildId, level, roleId, Date.now());
  },
  remove(guildId: string, level: number): boolean {
    const result = stmts.remove.run(guildId, level);
    return result.changes > 0;
  },
};
