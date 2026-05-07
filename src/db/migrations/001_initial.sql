-- Initial schema: users and guild_settings.
-- Future migrations will add tables for void, warnings, tickets, etc.

CREATE TABLE IF NOT EXISTS users (
    user_id      TEXT PRIMARY KEY,         -- Discord snowflake
    balance      INTEGER NOT NULL DEFAULT 0,
    bank         INTEGER NOT NULL DEFAULT 0,
    xp           INTEGER NOT NULL DEFAULT 0,
    level        INTEGER NOT NULL DEFAULT 0,
    daily_streak INTEGER NOT NULL DEFAULT 0,
    last_daily   INTEGER,                  -- unix ms; nullable = never claimed
    created_at   INTEGER NOT NULL          -- unix ms
);

CREATE INDEX IF NOT EXISTS idx_users_xp     ON users(xp DESC);
CREATE INDEX IF NOT EXISTS idx_users_balance ON users(balance DESC);

-- Per-guild config that's set at runtime (e.g. by g!setup jail).
-- Hardcoded role/channel IDs go in config.json instead.
CREATE TABLE IF NOT EXISTS guild_settings (
    guild_id              TEXT PRIMARY KEY,
    jail_role_id          TEXT,
    jail_channel_id       TEXT,
    custom_prefix         TEXT,            -- override of g! per-guild (future)
    updated_at            INTEGER NOT NULL
);
