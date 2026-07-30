import { db } from '../database.js';

export interface GuildSettingsRow {
  guild_id: string;
  jail_role_id: string | null;
  jail_channel_id: string | null;
  custom_prefix: string | null;
  updated_at: number;
}

const stmts = {
  get: db.prepare<[string], GuildSettingsRow>(
    'SELECT * FROM guild_settings WHERE guild_id = ?',
  ),
  insert: db.prepare<[string, number]>(
    'INSERT INTO guild_settings (guild_id, updated_at) VALUES (?, ?)',
  ),
  setJail: db.prepare<[string, string, number, string]>(
    'UPDATE guild_settings SET jail_role_id = ?, jail_channel_id = ?, updated_at = ? WHERE guild_id = ?',
  ),
};

export const GuildSettingsRepo = {
  get(guildId: string): GuildSettingsRow | undefined {
    return stmts.get.get(guildId);
  },
  getOrCreate(guildId: string): GuildSettingsRow {
    let row = stmts.get.get(guildId);
    if (!row) {
  stmts.insert.run(guildId, Date.now());
  row = stmts.get.get(guildId)!;
    }
    return row;
  },
  setJail(guildId: string, roleId: string, channelId: string): void {
    this.getOrCreate(guildId);
    stmts.setJail.run(roleId, channelId, Date.now(), guildId);
  },
};
