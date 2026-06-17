1. **Tạo bot trên Discord Developer Portal**
2. **Setup code trên máy local**
3. **Mời bot vào server và test**
4. **Deploy production**

---

## Yêu cầu trước khi bắt đầu

Cần cài sẵn trên máy:

- **Node.js v20 hoặc mới hơn** — kiểm tra: mở terminal gõ `node --version`, phải hiện `v20.x.x` trở lên. Chưa có thì tải ở https://nodejs.org (chọn LTS).
- **Git** — kiểm tra: `git --version`. Chưa có thì https://git-scm.com.
- **Một code editor** — VS Code khuyên dùng (https://code.visualstudio.com).

Cần có:

- **Tài khoản Discord** đã bật **Developer Mode**.
- **Một server Discord bạn có quyền Manage Server** để test (có thể tạo server mới riêng để test trước, đỡ làm hỏng server thật).

---

## Phần 1: Tạo bot trên Discord Developer Portal

### Bước 1.1 — Mở Developer Portal

1. Vào https://discord.com/developers/applications
2. Login bằng tài khoản Discord
3. Bấm nút **"New Application"** (góc phải trên)
4. Đặt tên: `...` (đây là tên *application*, tên *bot* set sau)
5. Tick "I agree", bấm **Create**

Vào trang quản lý app.

### Bước 1.2 — Tạo Bot user

1. Sidebar trái, bấm **"Bot"**
2. Trang Bot có sẵn rồi (Discord tự tạo bot user khi tạo application)
3. **Đặt avatar và tên** ở mục "Username" — nên đặt giống tên app

### Bước 1.3 — Lấy Bot Token

1. Trong mục **"TOKEN"**, bấm **"Reset Token"**
2. Confirm. Discord hiện token một lần duy nhất — dài khoảng 70 ký tự.
3. **Copy ngay**, lưu tạm vào notepad.

> Nếu lỡ tay đóng tab → quay lại bấm Reset Token lần nữa (token cũ sẽ vô hiệu).

### Bước 1.4 — Bật Privileged Intents

Discord chia event thành "intent" — bot phải khai báo trước cái nào nó nghe. 2 trong số đó là **privileged**, phải tự bật trong Developer Portal:

Cuộn xuống mục **"Privileged Gateway Intents"** trong trang Bot:

- **MESSAGE CONTENT INTENT** — bật. *Không bật thì `message.content` rỗng, bot không đọc được lệnh nào hết.*
- **SERVER MEMBERS INTENT** — bật. *Cần để resolve mention, fetch member info, làm moderation sau này.*
- PRESENCE INTENT — không cần bật.

Bấm **Save Changes** ở dưới.

### Bước 1.5 — Tạo Invite Link

1. Sidebar, bấm **"OAuth2"**
2. Trong **"OAuth2 URL Generator"**:
   - **SCOPES**: tick `bot`
   - **BOT PERMISSIONS**: tick các quyền sau (cần đủ để bot làm việc):
     - Send Messages, Embed Links, Read Message History (cơ bản)
     - Manage Roles, Manage Channels (cho `g!setup jail`)
     - View Channels
3. Cuộn xuống cuối, copy **Generated URL**. Dùng ở Phần 3.

---

## Phần 2: Setup code trên máy local

### Bước 2.1 — Lấy code

Giải nén code ra một folder. Hoặc nếu đã có repo git:

```bash
git clone <your-repo-url> ...
cd ...
```

Mở folder bằng VS Code: `code .`

### Bước 2.2 — Cài dependencies

Mở terminal trong VS Code (`` Ctrl+` `` hoặc Terminal → New Terminal):

```bash
npm install
```

Đợi 1-2 phút. Tải về:
- `discord.js` — thư viện chính nói chuyện với Discord
- `better-sqlite3` — driver SQLite (cần build native — xem "Troubleshooting" nếu lỗi)
- `dotenv` — đọc `.env`
- `zod` — validate `.env` và `config.json` lúc start
- `tsx`, `typescript` — chạy/compile TypeScript

### Bước 2.3 — Tạo file `.env`

Trong folder gốc, copy `.env.example` thành `.env`:

```bash
# Linux/Mac:
cp .env.example .env

# Windows PowerShell:
copy .env.example .env
```

Mở `.env`, paste **token** ở Bước 1.3:

```
DISCORD_TOKEN=MTIzNDU2Nzg5...token-thật-ở-đây
DATABASE_PATH=./data/galaxy.db
NODE_ENV=development
```

> File `.env` đã trong `.gitignore` — KHÔNG bị push lên GitHub.

> Lưu ý: từ v0.3, `PREFIX` không còn ở `.env` — đã chuyển sang `config.json`.

### Bước 2.4 — Tạo file `config.json`

```bash
# Linux/Mac:
cp config.example.json config.json

# Windows PowerShell:
copy config.example.json config.json
```

> Lưu ý: `config.json` giờ ở **root folder**, không phải `src/config/` nữa.

Mở `config.json`, có thể để rỗng `ownerIds`, `modRoleIds`, `adminRoleIds`, `modLogChannelId` lúc này — `g!ping`, `g!help`, `g!userinfo` chạy được không cần. **Nhưng nên điền `ownerIds` ngay** (Discord user ID của bạn) để sau dùng được `g!stats`.

Cách lấy Discord user ID: bật Developer Mode (Settings → Advanced → Developer Mode), chuột phải avatar của mình → Copy User ID.

```json
{
  "prefix": "g!",
  "ownerIds": ["123456789012345678"],
  "modRoleIds": [],
  "adminRoleIds": [],
  "modLogChannelId": null
}
```

### Bước 2.5 — Chạy bot lần đầu

```bash
npm run dev
```

Lệnh này dùng `tsx watch` — chạy TypeScript trực tiếp **và** tự reload khi sửa file.

**Kết quả mong đợi:**

```
[2026-...] ℹ️  INFO  Config loaded. Prefix: g!, Owners: 1, Mods: 0, Admins: 0
[2026-...] ℹ️  INFO  Database opened: /path/to/data/galaxy.db
[2026-...] ℹ️  INFO  Migration applied: 001_initial.sql
[2026-...] ℹ️  INFO  Migration applied: 002_void.sql
[2026-...] ℹ️  INFO  Migration applied: 003_audit.sql
[2026-...] ℹ️  INFO  Loaded 6 event handlers.
[2026-...] ℹ️  INFO  Loaded 13 commands (5 aliases).
[2026-...] ℹ️  INFO  Logged in as GalaxyUniverse#1234 (123...)
[2026-...] ℹ️  INFO  Watching 0 guild(s)
[2026-...] ℹ️  INFO  Scheduler started (sweep every 30s).
```

> "Watching 0 guild(s)" là vì chưa mời bot. Sang phần 3.

Để **dừng bot**: `Ctrl+C` trong terminal. Bot sẽ shutdown gracefully (close DB, destroy client) — sẽ thấy log:
```
Received SIGINT — shutting down...
Discord client destroyed.
Database closed cleanly.
```

---

## Phần 3: Mời bot vào server và test

### Bước 3.1 — Mời bot

1. Mở link OAuth2 ở Bước 1.5 trong browser
2. Chọn server muốn mời bot
3. Confirm permissions, bấm **Authorize**
4. Captcha → xong

Vào server đó, bot xuất hiện ở danh sách member, status **Online**.

Lúc bot online, sẽ thấy log thêm:
```
Permission audit OK for guild "Server Name" (123...)
```

Nếu báo issue, fix theo log (vd thiếu Manage Roles → đổi permission của role bot trong server).

### Bước 3.2 — Test các lệnh cơ bản

Trong bất kỳ channel nào bot có quyền nhìn và gửi tin:

**`g!ping`** → bot reply embed có:
- WebSocket: ~40-60ms (Singapore → Discord SG region)
- Database: 0-1ms
- Memory: ~60-80 MB
- Uptime
- Commands run

**`g!help`** → bot trả về embed liệt kê các nhóm lệnh hiện có (chỉ hiện lệnh bạn có quyền dùng).

**`g!userinfo`** → embed thông tin về bạn (level, XP, balance hiện đang 0 — bình thường, hệ thống economy/level chưa build).

**`g!userinfo @AiĐó`** → embed thông tin user mention.

**`g!config`** (admin-only — bạn phải là owner trong `config.json` hoặc có role admin) → xem cấu hình hiện tại của bot trong server này.

Các lệnh chạy → **Phần 1+2 hoàn tất**, sẵn sàng test Void.

### Bước 3.3 — Test Void (tuỳ chọn)

Cần ít nhất:
- Bot có Manage Roles + Manage Channels
- Bạn có role admin được khai trong `config.adminRoleIds`, hoặc owner ID khai trong `config.ownerIds`
- Một alt account đã join server để test (xem hướng dẫn tạo alt ở phần đầu chat)

```
g!setup jail        # tạo role Void + channel #the-void, sync permission tất cả channel
g!void @alt 3 test  # nhốt alt, 3 lần glausan
```

Switch sang alt → vào #the-void → gõ `glausan` 3 lần (đợi 30s giữa mỗi lần). Lần cuối: alt được thả.

```
g!voidstatus @alt   # confirm đã thả
g!voidhistory @alt  # thấy 1 record
g!voidlist          # rỗng
```

---

## Troubleshooting

### Lệnh không phản hồi

**Triệu chứng:** Gõ `g!ping` không thấy gì, terminal cũng không log gì.

**Nguyên nhân thường gặp:**

1. **Chưa bật MESSAGE CONTENT INTENT** ở Developer Portal (Bước 1.4). → Quay lại bật, save, restart bot.
2. **Bot process không chạy.** → Check terminal, có thấy "Logged in as..." không? Không thì chạy `npm run dev`.
3. **Bot không có quyền View Channel hoặc Send Messages trong channel đó.** → Check permission của role bot.
4. **Token sai/cũ.** → Reset token, paste vào `.env`, restart.

### Lỗi `npm install` — `better-sqlite3` build fail

**Triệu chứng:** error có chữ `node-gyp`, `Python`, hoặc `MSBuild`.

**Nguyên nhân:** `better-sqlite3` là native module, cần build tools.

**Fix theo OS:**

- **Windows:** PowerShell admin, `npm install -g windows-build-tools` (hoặc cài Visual Studio Build Tools 2022 với workload "Desktop development with C++")
- **macOS:** `xcode-select --install`
- **Linux (Ubuntu/Debian):** `sudo apt install -y build-essential python3`

Sau đó `npm install` lại.

### Lỗi "Used disallowed intents"

**Triệu chứng:** Bot connect rồi crash ngay với error có chữ `DisallowedIntents`.

**Nguyên nhân:** Code khai báo intent privileged nhưng chưa bật ở Developer Portal.

**Fix:** Quay lại Bước 1.4, bật MESSAGE CONTENT INTENT và SERVER MEMBERS INTENT.

### Lỗi "Invalid .env configuration" lúc start

**Triệu chứng:** Bot crash ngay khi start với log:
```
[ERROR] Invalid .env configuration:
  DISCORD_TOKEN: DISCORD_TOKEN should have 3 dot-separated parts (xxx.yyy.zzz)
```

**Nguyên nhân:** Token paste thiếu hoặc sai format. Token thật phải 3 phần ngăn nhau bằng dấu chấm.

**Fix:** Reset token lại ở Bước 1.3, copy đầy đủ.

### Lỗi "config.json not found"

**Triệu chứng:** Bot crash với log:
```
[ERROR] config.json not found at /path/to/config.json
```

**Nguyên nhân:** Chưa copy `config.example.json` thành `config.json`. (Trong v0.3, file này ở root chứ không phải `src/config/`.)

**Fix:** `cp config.example.json config.json` ở folder gốc.

### Bot online nhưng `g!help` báo "Có lỗi xảy ra"

**Nguyên nhân:** Hầu hết là bot thiếu quyền **Embed Links** trong channel đó.

**Fix:** Server Settings → Roles → role bot → bật "Embed Links". Hoặc check channel-specific permissions.

Tip: chạy `g!stats` (owner-only) sẽ thấy command failed count tăng lên — verify được là lỗi internal chứ không phải bot ignore.

### Bot online nhưng `g!setup jail` không tạo role/channel

**Triệu chứng:** Bot reply "Bot thiếu quyền: Manage Roles, Manage Channels" (hoặc tương tự).

**Fix:** Server Settings → Roles → role bot → bật Manage Roles và Manage Channels. Hoặc re-invite bot với OAuth link có đúng permissions (Bước 1.5).

### Bot online nhưng permission audit log warn issue

**Triệu chứng:** Lúc start, log có:
```
[WARN] Permission audit found 2 issue(s) in guild "...":
  - Missing perm: Manage Roles
  - Jail role 123... (in DB) no longer exists — re-run g!setup jail
```

**Fix theo từng issue:**
- Thiếu perm → đổi role bot trong server settings
- Jail role/channel bị xóa → chạy lại `g!setup jail` (nhưng phải xóa entry trong DB trước, hoặc dùng admin SQL — TBD, sẽ fix sau)

### Database lỗi: `SqliteError: database is locked`

**Nguyên nhân:** Có 2 process bot cùng chạy.

**Fix:** Dừng tất cả terminal đang chạy `npm run dev`, chỉ giữ 1, chạy lại.

---

## Phần 4: Deploy production — chọn host

Khi feature ổn muốn bot chạy 24/7 không cần mở máy, có **3 option**. Đọc so sánh trước, rồi follow phần tương ứng.

### So sánh nhanh

| | **Onidel VPS** (khuyên dùng) | **Railway** | **Chạy local 24/7** |
|---|---|---|---|
| Giá/tháng | ~$3.75–5 | ~$5–10 | $0 (tiền điện) |
| Auto-restart | Phải tự cài (pm2) | Sẵn có | Phải tự cài |
| Update code | `git pull` + restart | `git push` (auto-deploy) | `git pull` + restart |
| Backup DB | Cron script (đã có sẵn) | Manual / external | Manual |

Hệ điều hành recommend: **Ubuntu 24.04 LTS** (phổ biến, document đầy đủ, support đến 2029).

> ⚠️ **Trước khi deploy lần đầu, đọc và làm theo `DEPLOY_CHECKLIST.md`.** Có vài thứ phải test manual trước khi go-live (backup script, fresh-guild rehearsal, migration trên DB rỗng).

---

### 4A. Deploy lên Onidel VPS

#### Bước 4A.1 — Tạo account và VPS

1. Vào https://onidel.com, đăng ký
2. Confirm email
3. Vào dashboard, **Create Service** → **Premium VPS**
4. Chọn:
   - **Location:** Singapore (gần VN nhất, latency tốt nhất)
   - **OS:** Ubuntu 24.04 LTS
   - **Plan:** plan rẻ nhất (1 vCPU, 1GB RAM, 20GB SSD) — quá đủ cho bot 350-2000 user
   - **Billing:** monthly (sau ổn rồi đổi annual để tiết kiệm 15-20%)
5. Đặt **root password** (lưu vào password manager — sẽ dùng đăng nhập)
6. Pay (PayPal hoặc thẻ; Onidel còn nhận VietQR)
7. Đợi ~60 giây — VPS được provision

Khi xong, dashboard hiện **IP address** của VPS (vd `103.213.xxx.xxx`). Lưu lại.

#### Bước 4A.2 — SSH vào VPS lần đầu

Mở terminal trên máy local:

```bash
ssh root@103.213.xxx.xxx
```

- Lần đầu sẽ hỏi confirm fingerprint → gõ `yes`
- Nhập password root đã đặt ở bước trước

#### Bước 4A.3 — Update hệ thống và tạo user thường

**Đừng chạy bot bằng user `root`** — nguyên tắc bảo mật cơ bản. Tạo user thường:

```bash
# Update package list
apt update && apt upgrade -y

# Tạo user 'galaxy' với sudo quyền
adduser galaxy
# (Đặt password, các field khác Enter để skip)

usermod -aG sudo galaxy

# Switch sang user mới
su - galaxy
```

Từ giờ làm việc dưới user `galaxy`. Khi cần root quyền dùng `sudo`.

#### Bước 4A.4 — Cài Node.js 20

```bash
# Cài curl nếu chưa có
sudo apt install -y curl

# Add NodeSource repo cho Node 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Cài Node
sudo apt install -y nodejs

# Verify
node --version    # phải ra v20.x.x
npm --version     # phải ra 10.x trở lên
```

#### Bước 4A.5 — Cài build tools (cho `better-sqlite3`)

```bash
sudo apt install -y build-essential python3 git
```

#### Bước 4A.6 — Lấy code lên VPS

**Cách 1 (khuyên dùng): clone từ GitHub**

```bash
cd ~
git clone https://github.com/<yourusername>/galaxy-universe.git
cd galaxy-universe
```

Nếu repo private, dùng SSH key hoặc GitHub Personal Access Token. Hướng dẫn chi tiết ở https://docs.github.com/en/authentication.

**Cách 2: scp từ máy local lên** (nếu chưa push lên git)

Trên **máy local**, mở terminal mới (không phải SSH):

```bash
cd /path/to/galaxy-universe
# Nén lại trừ node_modules, data, dist
tar --exclude='node_modules' --exclude='data' --exclude='dist' -czf galaxy.tar.gz .
scp galaxy.tar.gz galaxy@103.213.xxx.xxx:~
```

Quay lại SSH vào VPS:

```bash
mkdir galaxy-universe
cd galaxy-universe
tar -xzf ~/galaxy.tar.gz
rm ~/galaxy.tar.gz
```

#### Bước 4A.7 — Cài dependencies và config

```bash
cd ~/galaxy-universe
npm install
npm run build
```

Tạo `.env`:

```bash
cp .env.example .env
nano .env
```

Sửa nội dung:

```
DISCORD_TOKEN=token-thật
DATABASE_PATH=/home/galaxy/galaxy-universe/data/galaxy.db
NODE_ENV=production
```

Save: `Ctrl+O`, Enter, `Ctrl+X`.

Tạo `config.json`:

```bash
cp config.example.json config.json
nano config.json
```

Điền role/owner/channel ID (đã có sẵn lúc này — owner đã gửi). Save.

#### Bước 4A.8 — Test chạy thử

```bash
npm start
```

Phải thấy log đầy đủ migrations + "Logged in as..." + "Permission audit OK" + "Scheduler started". Nếu thấy → Ctrl+C để dừng, sang bước tiếp.

Nếu lỗi: xem log, fix, thử lại.

#### Bước 4A.9 — Cài pm2 để bot tự restart 24/7

`npm start` chạy ở foreground — đóng SSH là bot tắt. Cần **pm2** (process manager):

```bash
sudo npm install -g pm2
```

Khởi động bot qua pm2:

```bash
cd ~/galaxy-universe
pm2 start dist/index.js --name galaxy
```

Verify:

```bash
pm2 status      # phải thấy galaxy ở trạng thái 'online'
pm2 logs galaxy # xem live logs (Ctrl+C để thoát log, không tắt bot)
```

Cấu hình pm2 tự khởi động khi VPS reboot:

```bash
pm2 save
pm2 startup
# Lệnh này in ra một dòng `sudo env PATH=...` — copy paste, chạy lại
```

#### Bước 4A.10 — Cài pm2-logrotate

pm2 console log mặc định grow vô hạn → đầy disk lúc nào không hay. Cài log rotate:

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 14
pm2 set pm2-logrotate:compress true
```

Log cũ sẽ tự nén và xóa sau 14 ngày.

> Bot tự ghi log ra `data/logs/bot.log` (`utils/logger.ts`) — riêng biệt với pm2 logs. Cả hai đều rotate được.

#### Bước 4A.11 — Cập nhật code sau này

Khi sửa code (push lên GitHub):

```bash
ssh galaxy@103.213.xxx.xxx
cd ~/galaxy-universe
git pull
npm install         # nếu có dep mới
npm run build       # compile lại
pm2 restart galaxy
pm2 logs galaxy     # check không lỗi
```

Khi restart, pm2 gửi SIGINT → bot shutdown gracefully (WAL checkpoint + close DB). An toàn.

#### Bước 4A.12 — Backup database định kỳ (PHẢI CÓ)

Bot đã có sẵn script `scripts/backup.js` dùng SQLite online backup API (an toàn để chạy khi bot đang live).

Test manual trước:

```bash
cd ~/galaxy-universe
npm run backup
npm run backup:test
ls -la data/backups/
```

Phải thấy 1 file `galaxy-DATE.db` và verify đọc được.

Setup cron chạy hằng đêm:

```bash
crontab -e
# Chọn nano nếu hỏi editor
```

Thêm dòng cuối file:

```
0 3 * * * cd /home/galaxy/galaxy-universe && /usr/bin/node scripts/backup.js >> data/logs/backup.log 2>&1
```

Save & exit. Cron sẽ chạy 3 AM mỗi đêm, backup ghi log ra `data/logs/backup.log`.

Script tự prune backup cũ hơn 7 ngày → không cần quan tâm clean up.

#### Bước 4A.13 — Bảo mật cơ bản

**Tắt SSH password login, dùng key:**

Trên máy local, nếu chưa có SSH key:

```bash
ssh-keygen -t ed25519 -C "your-email@example.com"
# Enter qua hết
```

Copy public key lên VPS:

```bash
ssh-copy-id galaxy@103.213.xxx.xxx
```

SSH lại bằng key (không cần password):

```bash
ssh galaxy@103.213.xxx.xxx
```

Tắt password auth (chỉ dùng key):

```bash
sudo nano /etc/ssh/sshd_config
```

Tìm và sửa:

```
PasswordAuthentication no
PermitRootLogin no
```

Save. Restart SSH:

```bash
sudo systemctl restart ssh
```

> Trước khi tắt password, **mở terminal mới và verify SSH bằng key vẫn được**. Nếu lỡ tay sai config, đừng đóng terminal hiện tại — bạn vẫn còn quyền sửa.

**Bật firewall:**

```bash
sudo ufw allow OpenSSH
sudo ufw enable
# Confirm 'y'
sudo ufw status
```

Bot không cần expose port nào (nó connect ra Discord, không listen). Chỉ cần SSH.

---

### 4B. Deploy lên Railway (alternative dễ hơn)

Nếu bạn muốn skip phần sysadmin và chấp nhận trả nhiều hơn, Railway là option dễ nhất.

#### Bước 4B.1 — Đẩy code lên GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
```

Verify `.env` và `config.json` KHÔNG bị push (đã trong `.gitignore`).

#### Bước 4B.2 — Tạo project Railway

1. Vào https://railway.app, login bằng GitHub
2. **New Project** → **Deploy from GitHub repo** → chọn repo
3. Railway tự detect Node.js, bắt đầu build

#### Bước 4B.3 — Set environment variables

Trong project Railway, tab **Variables**, thêm:

- `DISCORD_TOKEN` = token bot
- `DATABASE_PATH` = `/data/galaxy.db` (không phải `./data/...` — Railway volume mount tại `/data`)
- `NODE_ENV` = `production`

#### Bước 4B.4 — Tạo persistent volume (CỰC QUAN TRỌNG)

Không có cái này → mỗi lần deploy lại, file SQLite mất sạch (level, balance, void status... reset hết).

1. Service Railway, tab **Settings**
2. Cuộn xuống **Volumes**, bấm **+ New Volume**
3. **Mount path:** `/data`
4. **Size:** 1 GB
5. **Add**

#### Bước 4B.5 — Set start command

**Settings → Deploy:**

- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm start`

#### Bước 4B.6 — Push config.json

`config.json` trong `.gitignore`. Cách dễ: tạm comment dòng `config.json` trong `.gitignore`, commit `config.json` (chỉ chứa role/channel ID, không phải secret). **Đảm bảo `.env` vẫn trong gitignore.**

#### Bước 4B.7 — Deploy

Push commit mới → Railway tự build và deploy. Tab **Logs** xem tiến trình. Thấy `Logged in as...` là xong.

Bot tự restart khi crash.

> Railway không có cron mặc định cho backup. Nếu muốn backup định kỳ trên Railway, hoặc setup `node-cron` trong code, hoặc dùng external service (vd GitHub Actions schedule). Onidel + cron đơn giản hơn cho việc này.

---

### 4C. Chạy local 24/7 (KHÔNG khuyên cho production)

Chỉ làm khi:
- Test ngắn hạn vài ngày
- Máy bạn lúc nào cũng bật
- Ổn với việc tắt máy = bot offline

**Setup:**

```bash
# Cài pm2 trên máy local (giống VPS)
npm install -g pm2

cd /path/to/galaxy-universe
npm run build
pm2 start dist/index.js --name galaxy
pm2 save
pm2 startup
```

Pros: free, không setup VPS.
Cons: máy reboot/sleep/cúp điện = bot offline; ISP IP có thể đổi; không có backup tự động.

---

## Quick reference

### Khi sửa code (local dev)

`tsx watch` tự reload khi save. Nhưng **thêm file mới** đôi khi cần restart manual.

### Khi sửa `vi.json`

Phải restart bot — JSON load 1 lần lúc start.

### Khi sửa schema DB

1. Tạo file mới `src/db/migrations/00X_tên_thay_đổi.sql`
2. Restart bot — migration runner tự apply (wrap trong transaction)
3. **KHÔNG sửa** migration cũ đã chạy (sẽ không re-run, mất sync với DB)

### Khi sửa `config.json`

Restart bot — Zod validate lại lúc start.

### Lệnh pm2 hay dùng (production)

```bash
pm2 status              # xem bot online không
pm2 logs galaxy         # xem live logs
pm2 logs galaxy --lines 100   # xem 100 log gần nhất
pm2 restart galaxy      # restart bot (graceful — SIGINT trước)
pm2 stop galaxy         # stop bot
pm2 delete galaxy       # gỡ khỏi pm2
pm2 monit               # dashboard CPU/RAM/log realtime
```

### Lệnh backup hay dùng

```bash
npm run backup         # backup ngay
npm run backup:test    # verify backup mới nhất đọc được
ls -lh data/backups/   # check size + tuổi backup
```

### Lệnh debug DB trực tiếp (qua sqlite3 CLI)

```bash
sudo apt install -y sqlite3   # nếu chưa có
sqlite3 data/galaxy.db
sqlite> .tables
sqlite> SELECT * FROM void_sentences;
sqlite> SELECT * FROM void_history ORDER BY released_at DESC LIMIT 10;
sqlite> .quit
```

> Đừng INSERT/UPDATE/DELETE qua CLI khi bot đang chạy — WAL mode cho phép concurrent reads, nhưng writes nên đi qua bot.

---

## Sẵn sàng cho bước tiếp

Khi `g!ping`, `g!help`, `g!userinfo`, `g!setup jail`, `g!void`, `g!escape`, `g!free` chạy ngon và đã đi qua **DEPLOY_CHECKLIST.md** — báo lại để build **step 4: Level + Economy + Moderation + Tickets + Lunari void extensions** (theo thứ tự depth-first đã chốt).