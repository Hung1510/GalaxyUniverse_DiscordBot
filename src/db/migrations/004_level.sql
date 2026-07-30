CREATE TABLE IF NOT EXISTS level_role_rewards (
    guild_id   TEXT NOT NULL,
    level      INTEGER NOT NULL,
    role_id    TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    PRIMARY KEY (guild_id, level)
);

CREATE INDEX IF NOT EXISTS idx_level_rewards_guild ON level_role_rewards(guild_id, level);
