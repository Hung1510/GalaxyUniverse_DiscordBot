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

  // INSERT OR REPLACE atomically upserts the row.
  upsert: db.prepare<[string, string | null, string | null, string | null, number]>(`
    INSERT INTO guild_settings (guild_id, jail_role_id, jail_channel_id, custom_prefix, updated_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(guild_id) DO UPDATE SET
      jail_role_id    = COALESCE(excluded.jail_role_id,    guild_settings.jail_role_id),
      jail_channel_id = COALESCE(excluded.jail_channel_id, guild_settings.jail_channel_id),
      custom_prefix   = COALESCE(excluded.custom_prefix,   guild_settings.custom_prefix),
      updated_at      = excluded.updated_at
  `),

  setJail: db.prepare<[string, string, number, string]>(
    'UPDATE guild_settings SET jail_role_id = ?, jail_channel_id = ?, updated_at = ? WHERE guild_id = ?',
  ),
};

export const GuildSettingsRepo = {
  // Fetch settings, undefined if guild has never been configured.
  get(guildId: string): GuildSettingsRow | undefined {
    return stmts.get.get(guildId);
  },

  // Initialize an empty settings row for a new guild.
  getOrCreate(guildId: string): GuildSettingsRow {
    const existing = stmts.get.get(guildId);
    if (existing) return existing;

    stmts.upsert.run(guildId, null, null, null, Date.now());
    const created = stmts.get.get(guildId);
    if (!created) throw new Error(`Failed to create guild_settings for ${guildId}`);
    return created;
  },

  // Set both jail role and jail channel atomically (used by g!setup jail).
  setJail(guildId: string, roleId: string, channelId: string): void {
    this.getOrCreate(guildId);
    stmts.setJail.run(roleId, channelId, Date.now(), guildId);
  },
};
