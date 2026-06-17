-- Migration 004 — Level system role rewards.
--
-- users.xp + users.level already exist from 001_initial.sql.
--
-- level_role_rewards: one row per "when user hits level X, give role Y".
--   Admin manages via g!levelrole add/remove/list. On level-up, LevelService
--   looks up all rewards <= new level and ensures the user has those roles.
--
-- We also store guild_id so the same DB can serve multiple guilds correctly.
-- (Right now bot is single-guild but the schema shouldn't assume that.)

CREATE TABLE IF NOT EXISTS level_role_rewards (
    guild_id   TEXT NOT NULL,
    level      INTEGER NOT NULL,
    role_id    TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    PRIMARY KEY (guild_id, level)
);

CREATE INDEX IF NOT EXISTS idx_level_rewards_guild ON level_role_rewards(guild_id, level);
