CREATE TABLE IF NOT EXISTS void_sentences (
    user_id      TEXT PRIMARY KEY,
    guild_id     TEXT NOT NULL,
    total_count  INTEGER NOT NULL,
    remaining    INTEGER NOT NULL,
    reason       TEXT,
    jailed_by    TEXT NOT NULL,
    jailed_at    INTEGER NOT NULL,
    last_attempt INTEGER
);

CREATE INDEX IF NOT EXISTS idx_void_guild ON void_sentences(guild_id);

CREATE TABLE IF NOT EXISTS void_immunity (
    user_id     TEXT PRIMARY KEY,
    guild_id    TEXT NOT NULL,
    released_at INTEGER NOT NULL
);
