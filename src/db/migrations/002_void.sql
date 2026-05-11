-- Step 3: Void/Prison system tables.

-- One row per active sentence. When user is freed/escapes, row is deleted.
-- History (for stats) is logged separately later if needed.
CREATE TABLE IF NOT EXISTS void_sentences (
    user_id        TEXT PRIMARY KEY,
    guild_id       TEXT NOT NULL,
    total_count    INTEGER NOT NULL,         -- original sentence length
    remaining      INTEGER NOT NULL,         -- how many "glausan" left
    reason         TEXT,
    jailed_by      TEXT NOT NULL,            -- mod user_id
    jailed_at      INTEGER NOT NULL,         -- unix ms
    last_attempt   INTEGER                   -- unix ms of last glausan attempt
);

CREATE INDEX IF NOT EXISTS idx_void_guild ON void_sentences(guild_id);

-- After a user is freed, record the release time so we can enforce
-- POST_RELEASE_IMMUNITY_MS before allowing re-jail.
CREATE TABLE IF NOT EXISTS void_immunity (
    user_id     TEXT PRIMARY KEY,
    guild_id    TEXT NOT NULL,
    released_at INTEGER NOT NULL
);
