1. **Create the bot on Discord Developer Portal**
2. **Setup code locally**
3. **Invite the bot to a server and test**
4. **Deploy to production**

---

## Prerequisites

Required on your machine:

- **Node.js v20 or newer** — check: open terminal, run `node --version`, must show `v20.x.x` or higher. If missing, download from https://nodejs.org (pick LTS).
- **Git** — check: `git --version`. If missing, https://git-scm.com.
- **A code editor** — VS Code recommended (https://code.visualstudio.com).

Required accounts:

- **Discord account** with **Developer Mode** enabled.
- **A Discord server where you have Manage Server permission** for testing (you can create a fresh test server to avoid breaking the real one).

---

## Part 1: Create the bot on Discord Developer Portal

### Step 1.1 — Open Developer Portal

1. Go to https://discord.com/developers/applications
2. Login with your Discord account
3. Click **"New Application"** (top-right)
4. Name: `...` (this is the *application* name, *bot* name is set later)
5. Tick "I agree", click **Create**

You land on the app management page.

### Step 1.2 — Create the Bot user

1. Left sidebar, click **"Bot"**
2. The bot already exists (Discord auto-creates it when you create the application)
3. **Set avatar and username** under "Username" — match the app name

### Step 1.3 — Get the Bot Token

1. Under **"TOKEN"**, click **"Reset Token"**
2. Confirm. Discord shows the token once only — about 70 characters long.
3. **Copy immediately**, store temporarily in a notepad.

> If you accidentally close the tab → click Reset Token again (the old one will be invalidated).

### Step 1.4 — Enable Privileged Intents

Discord splits events into "intents" — the bot has to declare which ones it listens to. Two of them are **privileged** and must be toggled on in the Developer Portal:

Scroll to **"Privileged Gateway Intents"** on the Bot page:

- **MESSAGE CONTENT INTENT** — enable. *Without this, `message.content` is empty and the bot can't read any commands.*
- **SERVER MEMBERS INTENT** — enable. *Needed to resolve mentions, fetch member info, and run moderation later.*
- PRESENCE INTENT — not needed.

Click **Save Changes** at the bottom.

### Step 1.5 — Generate Invite Link

1. Sidebar, click **"OAuth2"**
2. Under **"OAuth2 URL Generator"**:
   - **SCOPES**: tick `bot`
   - **BOT PERMISSIONS**
3. Scroll to the bottom, copy the **Generated URL**. Used in Part 3.

---

## Part 2: Setup code locally

### Step 2.1 — Get the code

Extract the code into a folder. Or if you have the git repo:

```bash
git clone <your-repo-url> ...
cd ...
```

Open in VS Code: `code .`

### Step 2.2 — Install dependencies

Open terminal in VS Code (`Ctrl+`` or Terminal → New Terminal):

```bash
npm install
```

Wait 1-2 minutes. This pulls:
- `discord.js` — the main library for talking to Discord
- `better-sqlite3` — SQLite driver (needs native build — see "Troubleshooting" if it fails)
- `dotenv` — reads `.env`
- `tsx`, `typescript` — run/compile TypeScript

### Step 2.3 — Create `.env` file

In the project root, copy `.env.example` to `.env`:

```bash
# Linux/Mac:
cp .env.example .env

# Windows PowerShell:
copy .env.example .env
```

Open `.env`, paste the **token** from Step 1.3:

```
DISCORD_TOKEN=MTIzNDU2Nzg5...real-token-here
DATABASE_PATH=./data/galaxy.db
PREFIX=g!
NODE_ENV=development
```

> `.env` is already in `.gitignore` — it will NOT be pushed to GitHub.

### Step 2.4 — Create `config.json`

```bash
cp src/config/config.example.json src/config/config.json
```

Leaving it **empty is fine** for now — `g!ping`, `g!help`, `g!userinfo` work without role config.

### Step 2.5 — Run the bot for the first time

```bash
npm run dev
```

This uses `tsx watch` — runs TypeScript directly **and** auto-reloads on file changes.

**Expected output:**

```
[2026-...] INFO Database opened: /path/to/data/galaxy.db
[2026-...] INFO Running migration: 001_initial.sql
[2026-...] INFO Migrations up to date (1 total)
[2026-...] WARN config.json not found, using config.example.json
[2026-...] INFO Loaded 2 event handlers
[2026-...] INFO Loaded 3 commands
[2026-...] INFO Bot online: GalaxyUniverse#1234
[2026-...] INFO Guilds: 0 · Members (cached): 0
```

> "Guilds: 0" because the bot hasn't been invited yet. Move to Part 3.

To **stop the bot**: `Ctrl+C` in the terminal.

---

## Part 3: Invite the bot and test

### Step 3.1 — Invite the bot

1. Open the OAuth2 link from Step 1.5 in a browser
2. Pick the server to invite the bot to
3. Confirm permissions, click **Authorize**
4. Captcha → done

Open that server. The bot shows up in the member list, status **Online**.

### Step 3.2 — Test the commands

In any channel where the bot has View and Send permissions:

**`g!ping`** → bot replies: `Pong! WebSocket: 42ms · API: 156ms`

**`g!help`** → bot returns an embed listing the 3 current command groups

**`g!userinfo`** → embed with your info

**`g!userinfo @SomeUser`** → embed with the mentioned user's info

All 3 commands working → **Parts 1+2 done**, ready to build Void/Prison.

---

## Troubleshooting

### Commands don't respond

**Symptom:** Type `g!ping`, no reply, terminal also logs nothing.

**Common causes:**

1. **MESSAGE CONTENT INTENT not enabled** on Developer Portal (Step 1.4). → Go back, enable, save, restart bot.
2. **Bot lacks View Channel or Send Messages permission in that channel.** → Check bot role permissions.
3. **Wrong or stale token.** → Reset token, paste into `.env`, restart.

### `npm install` error — `better-sqlite3` build fail

**Symptom:** error mentions `node-gyp`, `Python`, or `MSBuild`.

**Cause:** `better-sqlite3` is a native module, needs build tools.

**Fix by OS:**

- **Windows:** PowerShell as admin, `npm install -g windows-build-tools` (or install Visual Studio Build Tools 2022 with the "Desktop development with C++" workload)
- **macOS:** `xcode-select --install`
- **Linux (Ubuntu/Debian):** `sudo apt install -y build-essential python3`

Then `npm install` again.

### "Used disallowed intents" error

**Symptom:** Bot connects then crashes immediately.

**Cause:** Code declares privileged intents but they're not enabled on Developer Portal.

**Fix:** Go back to Step 1.4, enable MESSAGE CONTENT INTENT and SERVER MEMBERS INTENT.

### Bot online but `g!help` says "An error occurred"

**Cause:** Most often the bot lacks **Embed Links** permission in that channel.

**Fix:** Server Settings → Roles → bot role → enable "Embed Links". Or check channel-specific permissions.

### Database error: `SqliteError: database is locked`

**Cause:** Two bot processes running simultaneously.

**Fix:** Stop all terminals running `npm run dev`, keep only one, restart.

---

## Part 4: Production deploy — choosing a host

When features are stable and you want the bot running 24/7 without keeping your machine on, there are **3 options**. Read the comparison first, then follow the matching section.

### Quick comparison

| | **Onidel VPS** (recommended) | **Railway** | **Local 24/7** |
|---|---|---|---|
| Price/month | ~$3.75–5 | ~$5–10 | $0 (electricity) |
| Auto-restart | Manual setup (pm2) | Built-in | Manual setup |
| Code update | `git pull` + restart | `git push` (auto-deploy) | `git pull` + restart |

Recommended OS: **Ubuntu 24.04 LTS** (widespread, well-documented, supported until 2029).

---

### 4A. Deploy to Onidel VPS

#### Step 4A.1 — Create account and VPS

1. Go to https://onidel.com, register
2. Confirm email
3. Dashboard → **Create Service** → **Premium VPS**
4. Choose:
   - **Location:** Singapore (closest to VN, lowest latency)
   - **OS:** Ubuntu 24.04 LTS
   - **Plan:** cheapest plan (1 vCPU, 1GB RAM, 20GB SSD) — plenty for a 350-2000 user bot
   - **Billing:** monthly (switch to annual later for 15-20% off)
5. Set a **root password** (save it in a password manager — needed for login)
6. Pay (PayPal or card; Onidel also accepts VietQR)
7. Wait ~60 seconds — VPS gets provisioned

When ready, the dashboard shows the VPS **IP address** (e.g. `103.213.xxx.xxx`). Save it.

#### Step 4A.2 — SSH into the VPS for the first time

On your local machine, open a terminal:

```bash
ssh root@103.213.xxx.xxx
```

- First time it'll ask to confirm the fingerprint → type `yes`
- Enter the root password you set earlier

#### Step 4A.3 — Update the system and create a normal user

**Don't run the bot as `root`** — basic security principle. Create a regular user:

```bash
# Update package list
apt update && apt upgrade -y

# Create a 'galaxy' user with sudo rights
adduser galaxy
# (Set password, press Enter to skip other fields)

usermod -aG sudo galaxy

# Switch to the new user
su - galaxy
```

From now on, work under the `galaxy` user. Use `sudo` when root is needed.

#### Step 4A.4 — Install Node.js 20

```bash
# Install curl if missing
sudo apt install -y curl

# Add NodeSource repo for Node 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Install Node
sudo apt install -y nodejs

# Verify
node --version    # must show v20.x.x
npm --version     # must show 10.x or higher
```

#### Step 4A.5 — Install build tools (for `better-sqlite3`)

```bash
sudo apt install -y build-essential python3 git
```

#### Step 4A.6 — Get the code on the VPS

**Option 1 (recommended): clone from GitHub**

```bash
cd ~
git clone https://github.com/<yourusername>/galaxy-universe.git
cd galaxy-universe
```

If the repo is private, use an SSH key or GitHub Personal Access Token. Details at https://docs.github.com/en/authentication.

**Option 2: scp from local** (if not yet pushed to git)

On your **local machine**, open a new terminal (not the SSH one):

```bash
cd /path/to/galaxy-universe
# Tar it up, excluding node_modules
tar --exclude='node_modules' --exclude='data' --exclude='dist' -czf galaxy.tar.gz .
scp galaxy.tar.gz galaxy@103.213.xxx.xxx:~
```

Back on the VPS SSH:

```bash
mkdir galaxy-universe
cd galaxy-universe
tar -xzf ~/galaxy.tar.gz
rm ~/galaxy.tar.gz
```

#### Step 4A.7 — Install dependencies and config

```bash
cd ~/galaxy-universe
npm install
npm run build
```

Create `.env`:

```bash
cp .env.example .env
nano .env
```

Set contents:

```
DISCORD_TOKEN=real-token
DATABASE_PATH=/home/galaxy/galaxy-universe/data/galaxy.db
PREFIX=g!
NODE_ENV=production
```

Save: `Ctrl+O`, Enter, `Ctrl+X`.

Create `config.json`:

```bash
cp src/config/config.example.json src/config/config.json
nano src/config/config.json
```

Fill in role/channel IDs if you have them (leave empty otherwise). Save.

#### Step 4A.8 — Test run

```bash
npm start
```

You must see `Bot online`. If you do → Ctrl+C to stop, move to the next step.

If errors: read logs, fix, retry.

#### Step 4A.9 — Install pm2 so the bot auto-restarts 24/7

`npm start` runs in foreground — closing SSH kills the bot. You need **pm2** (process manager):

```bash
sudo npm install -g pm2
```

Start the bot under pm2:

```bash
cd ~/galaxy-universe
pm2 start npm --name galaxy -- start
```

Verify:

```bash
pm2 status      # 'galaxy' must show as 'online'
pm2 logs galaxy # tail live logs (Ctrl+C exits log view without killing the bot)
```

Configure pm2 to start on VPS reboot:

```bash
pm2 save
pm2 startup
# This prints a `sudo env PATH=...` line — copy-paste and run it
```

#### Step 4A.10 — Updating code later

When you modify code (push to GitHub):

```bash
ssh galaxy@103.213.xxx.xxx
cd ~/galaxy-universe
git pull
npm install         # if there are new deps
npm run build       # recompile
pm2 restart galaxy
pm2 logs galaxy     # check no errors
```

#### Step 4A.11 — Scheduled database backup (RECOMMENDED)

```bash
mkdir ~/backups

crontab -e
# Pick nano if asked which editor
```

Add this line at the end:

```
0 3 * * * cp /home/galaxy/galaxy-universe/data/galaxy.db /home/galaxy/backups/galaxy-$(date +\%Y\%m\%d).db && find /home/galaxy/backups -name "galaxy-*.db" -mtime +14 -delete
```

Save & exit.

#### Step 4A.12 — Basic hardening

**Disable SSH password login, use a key:**

On local, if you don't have an SSH key yet:

```bash
ssh-keygen -t ed25519 -C "your-email@example.com"
# Press Enter through prompts
```

Copy the public key to the VPS:

```bash
ssh-copy-id galaxy@103.213.xxx.xxx
```

SSH again with key (no password needed):

```bash
ssh galaxy@103.213.xxx.xxx
```

Disable password auth (key only):

```bash
sudo nano /etc/ssh/sshd_config
```

Find and set:

```
PasswordAuthentication no
PermitRootLogin no
```

Save. Restart SSH:

```bash
sudo systemctl restart ssh
```

> Before disabling password, **open a new terminal and verify SSH-by-key works**. If you misconfigure, don't close the current session — you still have access to fix it.

**Enable firewall:**

```bash
sudo ufw allow OpenSSH
sudo ufw enable
# Confirm 'y'
sudo ufw status
```

The bot doesn't expose any port (it connects outbound to Discord, doesn't listen). Only SSH needs to be open.

---

### 4B. Deploy to Railway (easier alternative)

If you want to skip sysadmin and pay a bit more, Railway is the easiest option.

#### Step 4B.1 — Push code to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
```

Verify `.env` and `config.json` did NOT get pushed (they're in `.gitignore`).

#### Step 4B.2 — Create Railway project

1. Go to https://railway.app, login with GitHub
2. **New Project** → **Deploy from GitHub repo** → pick your repo
3. Railway auto-detects Node.js and starts the build

#### Step 4B.3 — Set environment variables

In the Railway project, **Variables** tab, add:

- `DISCORD_TOKEN` = the bot token
- `DATABASE_PATH` = `/data/galaxy.db` (not `./data/...` — Railway volumes mount at `/data`)
- `PREFIX` = `g!`
- `NODE_ENV` = `production`

#### Step 4B.4 — Create a persistent volume (CRITICAL)

Without this → every redeploy wipes the SQLite file (level, balance, void status... all reset).

1. Railway service, **Settings** tab
2. Scroll to **Volumes**, click **+ New Volume**
3. **Mount path:** `/data`
4. **Size:** 1 GB
5. **Add**

#### Step 4B.5 — Set start command

**Settings → Deploy:**

- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm start`

#### Step 4B.6 — Push config.json

`config.json` is in `.gitignore`. Easy fix: temporarily comment the `src/config/config.json` line in `.gitignore`, commit `config.json` (it only holds role/channel IDs, not secrets). **Make sure `.env` stays in gitignore.**

#### Step 4B.7 — Deploy

Push a new commit → Railway auto-builds and deploys. Watch the **Logs** tab. When you see `Bot online`, you're done.

The bot auto-restarts on crash.

---

### 4C. Run locally 24/7 (NOT recommended for production)

Only do this if:
- Short-term testing for a few days
- Your machine is always on
- You're OK with: machine off = bot offline

**Setup:**

```bash
# Install pm2 locally (same as VPS)
npm install -g pm2

cd /path/to/galaxy-universe
npm run build
pm2 start npm --name galaxy -- start
pm2 save
pm2 startup
```

Pros: free, no VPS setup.
Cons: reboot/sleep/power outage = bot offline; ISP IP can change; no automatic backups.

---

## Quick reference

### When you edit code (local dev)

`tsx watch` auto-reloads on save. But **adding a new file** sometimes needs a manual restart.

### When you edit `vi.json`

You must restart — JSON is loaded once at startup.

### When you change the DB schema

1. Create a new file `src/db/migrations/00X_change_name.sql`
2. Restart the bot — migration runner auto-applies it
3. **DO NOT modify** already-applied migrations (they won't re-run, leading to DB out-of-sync)

### Useful pm2 commands (production)

```bash
pm2 status              # check if bot is online
pm2 logs galaxy         # tail live logs
pm2 logs galaxy --lines 100   # last 100 log lines
pm2 restart galaxy      # restart the bot
pm2 stop galaxy         # stop the bot
pm2 delete galaxy       # remove from pm2
pm2 monit               # CPU/RAM/log dashboard in real-time
```

---

## Ready for the next step

When `g!ping`, `g!help`, `g!userinfo` all work — let me know to build **step 3: Void/Prison system**:

- `g!setup jail` — auto-create jail role + jail channel + sync permissions across all channels
- `g!void @user <count>` — jail a user
- `g!escape glausan` — type the keyword to escape
- `g!voidstatus`, `g!free`, `g!setvoid`

5-7 new files plus 1 new migration.
