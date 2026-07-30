# 🚀 Pre-Deploy Checklist

Run through this **once** before your first Onidel deploy, and again any time you add a new system.

## Code is ready (this drop covers these)

- [x] **#1** Graceful shutdown - SIGINT/SIGTERM handlers in `index.ts`, `closeDatabase()` checkpoint
- [x] **#1** Restart-safe scheduler - `SchedulerService` + `scheduled_tasks` table
- [x] **#2** Global error handlers + per-command try/catch
- [x] **#3** Backup script - `npm run backup`, `npm run backup:test`
- [x] **#4** Env validation - Zod schemas, fail-fast on bad config
- [x] **#5** Reconnect logging - 4 shard event handlers
- [x] **#6** File logging - `data/logs/bot.log`
- [x] **#7** Config view - `g!config`
- [x] **#8** Mod-log channel + audit DB - `ModLogService`, `void_history`
- [x] **#9** Startup permission audit - `PermissionAuditService`
- [x] **#11** Abuse-vector hardening - `VoidService.jail()` refuses bots/self/higher-role
- [x] **#12** Health info on ping
- [x] **#14** README
- [x] **#15** Expanded .gitignore
- [x] **#17** Metrics - `g!stats`

## You must do these manually before deploy

### Test fresh-guild rehearsal (#16)

The "what if owner accidentally removes the bot" rehearsal.

1. Create a temporary test guild (free, takes 30 seconds)
2. Invite your bot
3. Run `g!ping` - should respond
4. Run `g!setup jail` - should create role + channel
5. **Kick the bot from the guild**
6. **Re-invite it**
7. Run `g!config` - verify the DB still remembers the jail IDs (they'll be stale because the role was deleted)
8. Run `g!setup jail` again - should detect "already_setup" but the role doesn't exist. **EXPECTED CURRENT BEHAVIOR: this returns "already setup" but the role is gone.** This is a known limitation - fix later by adding a `g!setup jail --force` flag or validating role existence in setup.
9. Delete the test guild when done

### Migration sanity (#13)

1. `cp data/galaxy.db /tmp/galaxy.db.bak`
2. `rm data/galaxy.db data/galaxy.db-wal data/galaxy.db-shm` (or just rename)
3. Start the bot fresh
4. It should run all three migrations cleanly (`001_initial`, `002_void`, `003_audit`)
5. Run `g!setup jail`, `g!void @alt 1 test`, `g!free @alt` - verify roundtrip works on a clean DB
6. Restore your dev DB: `mv /tmp/galaxy.db.bak data/galaxy.db`

### Disallowed-intents test

Confirm you'll get a clear error if MessageContent intent ever gets toggled off in the portal.

1. Go to Developer Portal → Bot → toggle Message Content Intent **OFF**
2. Start the bot
3. **Expected:** discord.js throws `DisallowedIntents` on login; the error reaches your logs with a clear message
4. Toggle it back ON before deploying

### Backup script test

```bash
npm run backup
npm run backup:test
ls -la data/backups/
```

Should see one `galaxy-DATE.db` file, and `backup:test` should print tables + row counts.

## Onidel-specific setup

These go in `SETUP.md` and aren't repeated here, but verify:

- [ ] Non-root user created (`galaxy` or similar)
- [ ] Node 20+ installed
- [ ] `pm2` installed globally
- [ ] **`pm2 install pm2-logrotate`** - without this, pm2 logs grow unbounded (item #6)
  - Set rotation: `pm2 set pm2-logrotate:max_size 10M`
  - Set retention: `pm2 set pm2-logrotate:retain 14`
- [ ] Cron entry for `scripts/backup.js`:
  ```
  0 3 * * * cd /home/galaxy/bot && /usr/bin/node scripts/backup.js >> data/logs/backup.log 2>&1
  ```
- [ ] SSH key-only login, password auth disabled
- [ ] UFW firewall: allow 22 + nothing else (Discord is outbound only)
- [ ] `pm2 startup` + `pm2 save` so bot restarts on VPS reboot

## Deferred - do after deploy is stable

### #10 Cooldown survival across restarts

Currently `Cooldowns` is in-memory. Fine for 3-second command cooldowns. **Becomes a problem for:**
- Daily rewards (when economy ships) → use `UserRepo.last_daily`
- Hour-long rate limits

Action: when you build economy, daily rewards use DB column. Don't try to make Cooldowns class survive restarts - wrong abstraction.

### #18 Owner-only eval command

`g!eval` is invaluable for prod debugging but risky. **My recommendation: skip.** Use SSH + sqlite3 CLI instead:
```bash
ssh galaxy@onidel
sqlite3 ~/bot/data/galaxy.db
sqlite> .tables
sqlite> SELECT * FROM void_sentences;
```
Safer than embedding `vm.runInNewContext` and far less surface area.

### #19 Sentry / error tracking

Free tier handles tons of errors/month. Worth adding after first week if you see error volume that's hard to grep through.

```bash
npm install @sentry/node
```
Initialize at top of `index.ts`, set `SENTRY_DSN` env. Won't cover this here - read Sentry's Node docs.

## After deploy - week 1 monitoring

Daily for the first week, check:

```bash
pm2 status# is bot up?
pm2 logs galaxy --lines 100 --nostream  # any errors?
ls -lh data/galaxy.db data/backups/ # DB growing? backups landing?
df -h# VPS disk OK?
```

Any unusual pattern in `g!stats` (especially failure rates above ~1%) → investigate.

## When you add a new feature

Run this 5-step gate before merging:

1. Migration written and the bot starts cleanly on an empty DB
2. Command's abuse vectors documented in the file header
3. `g!stats` shows the new command after running it once
4. Mod-log entry posted for any state-mutating action
5. `npm run typecheck` passes
