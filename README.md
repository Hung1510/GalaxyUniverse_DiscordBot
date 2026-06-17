# 🌌 Galaxy Universe

Custom Discord bot for the Galaxy Universe Vietnamese community server.

## Stack

- **TypeScript** (strict, NodeNext modules) on **Node.js 20+**
- **discord.js v14** (prefix `g!`)
- **better-sqlite3** with WAL mode
- **pm2** + **Onidel Singapore VPS** in production
- Bot replies in Vietnamese; code and comments in English

## Quick start (local dev)

```bash
npm install
cp .env.example .env             # then edit DISCORD_TOKEN
cp config.example.json config.json   # then fill in role/owner IDs
npm run dev                      # tsx watch — hot reload
```

In another tab to verify:
```bash
npm run typecheck                # tsc --noEmit
```

## Production build

```bash
npm run build                    # tsc → dist/
npm start                        # node dist/index.js
```

In production, run under pm2:
```bash
pm2 start dist/index.js --name galaxy
pm2 logs galaxy
pm2 save
```

## Where things live

```
src/
├── index.ts                # entry — startup + shutdown wiring
├── config/                 # env + JSON config loader, gameplay constants
├── framework/              # command/event loaders, cooldowns, permissions
├── db/
│   ├── database.ts         # better-sqlite3 init + migration runner
│   ├── migrations/         # .sql files, applied in alphabetical order
│   └── repositories/       # one file per table, thin CRUD layer
├── services/               # business logic (cross-table, cross-system)
├── events/                 # discord.js event handlers
├── commands/               # one file per command, loaded dynamically
├── lang/vi.json            # all user-facing Vietnamese strings
└── utils/                  # logger, embed factory, lang t()
```

Architecture doc (in Vietnamese, for the server owner): `ARCHITECTURE.md`.

## Database

SQLite file at `data/galaxy.db` (configurable via `DATABASE_PATH`).

To add a schema change:
1. Create `src/db/migrations/00X_change_name.sql`
2. Restart bot — migration runner auto-applies and records in `_migrations`
3. **Don't edit** an already-applied migration

WAL sidecar files (`.db-wal`, `.db-shm`) are normal and shouldn't be deleted.

## Backups

```bash
npm run backup           # snapshot to data/backups/galaxy-DATE.db
npm run backup:test      # verify latest backup is readable
```

In production, wire `scripts/backup.js` into cron (see `SETUP.md`).

## Adding a command

1. Create `src/commands/<category>/<name>.ts`:
   ```ts
   import { type Command, PermissionLevel } from '../../framework/Command.js';
   const command: Command = {
     name: 'mycommand',
     description: '...',
     category: 'user',
     cooldown: 5,
     permission: PermissionLevel.USER,
     async execute(ctx) { /* ... */ },
   };
   export default command;
   ```
2. Restart bot. The command loader picks it up automatically.

## Adding a Vietnamese string

Add the key to `src/lang/vi.json`, use `t('your.key', { var: 'x' })` in code. Restart required (JSON is loaded once at startup).

## Common pitfalls

- **`message.content` is empty** → MessageContent intent isn't enabled in the Developer Portal
- **Bot silently ignores commands** → check the process is actually running (`pm2 status`), check `data/logs/bot.log`
- **Setup commands fail** → bot needs Manage Roles + Manage Channels in the guild; check `g!config` for jail role state
- **SQLite "database is locked"** → only one process should write at a time; WAL mode allows concurrent reads but only one writer

## Files you should NOT commit

`.env`, `config.json`, `data/`, `node_modules/`, `dist/`. All in `.gitignore`.

## License

Internal project; not for redistribution.
