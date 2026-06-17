-- Migration 003 — audit trail + persisted scheduled tasks.
--
-- void_history: every completed/cancelled void sentence, for audit log
--   queries like g!voidhistory @user. Without this, the moment someone
--   is released the record is gone — bad for staff reviewing patterns.
--
-- scheduled_tasks: DB-backed scheduling so timers survive bot restarts
--   (Step 3 fix mentioned earlier: setTimeout dies on restart).
--   Currently used for: time-based void releases (if we add them later).

CREATE TABLE IF NOT EXISTS void_history (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id      TEXT NOT NULL,
    guild_id     TEXT NOT NULL,
    total_count  INTEGER NOT NULL,
    completed    INTEGER NOT NULL,        -- how many glausan typed before release
    reason       TEXT,
    jailed_by    TEXT NOT NULL,
    released_by  TEXT,                    -- NULL if self-escaped
    release_type TEXT NOT NULL,           -- 'escape' | 'free' | 'admin'
    jailed_at    INTEGER NOT NULL,
    released_at  INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_void_history_user  ON void_history(user_id, released_at DESC);
CREATE INDEX IF NOT EXISTS idx_void_history_guild ON void_history(guild_id, released_at DESC);

CREATE TABLE IF NOT EXISTS scheduled_tasks (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    task_type   TEXT NOT NULL,            -- 'void_release', future: 'unmute', etc.
    payload     TEXT NOT NULL,            -- JSON
    run_at      INTEGER NOT NULL,         -- unix ms
    created_at  INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_scheduled_run_at ON scheduled_tasks(run_at);
