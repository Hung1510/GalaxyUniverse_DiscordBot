CREATE TABLE IF NOT EXISTS void_history (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id      TEXT NOT NULL,
    guild_id     TEXT NOT NULL,
    total_count  INTEGER NOT NULL,
    completed    INTEGER NOT NULL,
    reason       TEXT,
    jailed_by    TEXT NOT NULL,
    released_by  TEXT,
    release_type TEXT NOT NULL,
    jailed_at    INTEGER NOT NULL,
    released_at  INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_void_history_user  ON void_history(user_id, released_at DESC);
CREATE INDEX IF NOT EXISTS idx_void_history_guild ON void_history(guild_id, released_at DESC);

CREATE TABLE IF NOT EXISTS scheduled_tasks (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    task_type   TEXT NOT NULL,
    payload     TEXT NOT NULL,
    run_at      INTEGER NOT NULL,
    created_at  INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_scheduled_run_at ON scheduled_tasks(run_at);
