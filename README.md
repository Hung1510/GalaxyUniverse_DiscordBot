# 🌌 Galaxy Universe

A custom Discord bot I'm building for a Vietnamese community server - cosmic/space theme, prefix commands (`g!`), the whole thing. Started as a small side project and has grown into something with a real database, real moderation tools, and (hopefully) real staying power.

## What it's built with

Nothing fancy, just stuff that's fast to develop with and won't fall over at a few hundred members:

- TypeScript, strict mode, on Node 20+
- discord.js v14, prefix commands only for now (`g!`)
- better-sqlite3 with WAL mode - it's a single-server bot, didn't need Postgres for this
- pm2 keeping it alive on an Onidel Singapore VPS
- Bot talks to users in Vietnamese, but the code itself (and comments, when there are any) is in English

## Running it locally

```bash
npm install
cp .env.example .env # put your DISCORD_TOKEN in here
cp config.example.json config.json   # fill in the owner/role IDs
npm run dev    # tsx watch, hot reload
```

Worth running this in a second terminal while you work, just to catch type errors early:
```bash
npm run typecheck
```

## Building for production

```bash
npm run build  # compiles to dist/
npm start  # node dist/index.js
```

On the actual VPS it runs under pm2, not just `node`:
```bash
pm2 start dist/index.js --name galaxy
pm2 logs galaxy
pm2 save
```

## Where everything lives

```
src/
├── index.ts    # startup/shutdown wiring
├── config/ # env + config.json loading, gameplay constants
├── framework/   # command/event loaders, cooldowns, permission checks
├── db/
│   ├── database.ts     # better-sqlite3 setup + migration runner
│   ├── migrations/     # .sql files, run in alphabetical order
│   └── repositories/   # one file per table
├── services/   # the actual business logic, crosses tables/systems
├── events/ # discord.js event handlers
├── commands/   # one file per command
├── lang/vi.json# every user-facing string, in Vietnamese
└── utils/# logger, embed helper, the t() translation function
```

If you want the deeper architecture writeup (in Vietnamese, since that's who it's for), check `ARCHITECTURE.md`.

## Database stuff

It's just a SQLite file sitting at `data/galaxy.db` (path is configurable via `DATABASE_PATH` if you need to move it).

Adding a schema change is simple:
1. Drop a new file in `src/db/migrations/`, name it `00X_whatever.sql`
2. Restart the bot - it applies automatically and gets logged in `_migrations`
3. Don't touch a migration that's already been applied and shipped. Write a new one instead.

You'll see `.db-wal` and `.db-shm` files next to the main db - that's just WAL mode doing its thing, totally normal, leave them alone.

## Backups

```bash
npm run backup   # dumps a snapshot to data/backups/
npm run backup:test  # makes sure the latest backup actually opens
```

On the server, `scripts/backup.js` is wired into cron - see `SETUP.md` for how that's set up.

## Adding a new command

Pretty mechanical at this point:

1. New file at `src/commands/<category>/<name>.ts`:
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
2. Restart the bot. It gets picked up by the loader automatically, no registry to update.

## Adding Vietnamese text

Just add the key to `src/lang/vi.json` and call `t('your.key', { var: 'x' })` wherever you need it. One catch: the JSON is loaded once at boot, so a restart is required before it shows up.

## Stuff that's bitten me before

- **`message.content` comes back empty** - nine times out of ten this means the MessageContent intent isn't switched on in the Developer Portal
- **Bot just... doesn't respond, no errors either** - check it's actually running (`pm2 status`) before anything else, then look at `data/logs/bot.log`
- **Setup commands failing** - the bot needs Manage Roles and Manage Channels in the server, or half the setup flow silently breaks; `g!config` will show you the current jail role state
- **"database is locked" from SQLite** - WAL mode lets you read concurrently but there can only be one writer at a time, so this usually means something else is holding a write open

## Don't commit these

`.env`, `config.json`, `data/`, `node_modules/`, `dist/` - all already in `.gitignore`, but worth knowing why.

## License

Internal project, not meant for redistribution.
