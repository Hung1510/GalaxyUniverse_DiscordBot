CREATE TABLE IF NOT EXISTS users (
    user_id  TEXT PRIMARY KEY,
    balance  INTEGER NOT NULL DEFAULT 0,
    bank     INTEGER NOT NULL DEFAULT 0,
    xp   INTEGER NOT NULL DEFAULT 0,
    level    INTEGER NOT NULL DEFAULT 0,
    daily_streak INTEGER NOT NULL DEFAULT 0,
    last_daily   INTEGER,
    created_at   INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_xp  ON users(xp DESC);
CREATE INDEX IF NOT EXISTS idx_users_balance ON users(balance DESC);

CREATE TABLE IF NOT EXISTS guild_settings (
    guild_id    TEXT PRIMARY KEY,
    jail_role_id    TEXT,
    jail_channel_id TEXT,
    custom_prefix   TEXT,
    updated_at  INTEGER NOT NULL
);
