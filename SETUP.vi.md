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
   - **BOT PERMISSIONS**
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

Mở terminal trong VS Code (`Ctrl+`` hoặc Terminal → New Terminal):

```bash
npm install
```

Đợi 1-2 phút. Tải về:
- `discord.js` — thư viện chính nói chuyện với Discord
- `better-sqlite3` — driver SQLite (cần build native — xem "Troubleshooting" nếu lỗi)
- `dotenv` — đọc `.env`
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
PREFIX=g!
NODE_ENV=development
```

> File `.env` đã trong `.gitignore` — KHÔNG bị push lên GitHub.

### Bước 2.4 — Tạo file `config.json`

```bash
cp src/config/config.example.json src/config/config.json
```

Để **rỗng cũng được** lúc này — `g!ping`, `g!help`, `g!userinfo` chạy được không cần role config.

### Bước 2.5 — Chạy bot lần đầu

```bash
npm run dev
```

Lệnh này dùng `tsx watch` — chạy TypeScript trực tiếp **và** tự reload khi sửa file.

**Kết quả mong đợi:**

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

> "Guilds: 0" là vì chưa mời bot. Sang phần 3.

Để **dừng bot**: `Ctrl+C` trong terminal.

---

## Phần 3: Mời bot vào server và test

### Bước 3.1 — Mời bot

1. Mở link OAuth2 ở Bước 1.5 trong browser
2. Chọn server muốn mời bot
3. Confirm permissions, bấm **Authorize**
4. Captcha → xong

Vào server đó, bot xuất hiện ở danh sách member, status **Online**.

### Bước 3.2 — Test các lệnh

Trong bất kỳ channel nào bot có quyền nhìn và gửi tin:

**`g!ping`** → bot reply: `Pong! WebSocket: 42ms · API: 156ms`

**`g!help`** → bot trả về embed liệt kê 3 nhóm lệnh hiện có

**`g!userinfo`** → embed thông tin về bạn

**`g!userinfo @AiĐó`** → embed thông tin user mention

Cả 3 lệnh hoạt động → **Phần 1+2 hoàn tất**, sẵn sàng build Void/Prison.

---

## Troubleshooting

### Lệnh không phản hồi

**Triệu chứng:** Gõ `g!ping` không thấy gì, terminal cũng không log gì.

**Nguyên nhân thường gặp:**

1. **Chưa bật MESSAGE CONTENT INTENT** ở Developer Portal (Bước 1.4). → Quay lại bật, save, restart bot.
2. **Bot không có quyền View Channel hoặc Send Messages trong channel đó.** → Check permission của role bot.
3. **Token sai/cũ.** → Reset token, paste vào `.env`, restart.

### Lỗi `npm install` — `better-sqlite3` build fail

**Triệu chứng:** error có chữ `node-gyp`, `Python`, hoặc `MSBuild`.

**Nguyên nhân:** `better-sqlite3` là native module, cần build tools.

**Fix theo OS:**

- **Windows:** PowerShell admin, `npm install -g windows-build-tools` (hoặc cài Visual Studio Build Tools 2022 với workload "Desktop development with C++")
- **macOS:** `xcode-select --install`
- **Linux (Ubuntu/Debian):** `sudo apt install -y build-essential python3`

Sau đó `npm install` lại.

### Lỗi "Used disallowed intents"

**Triệu chứng:** Bot connect rồi crash ngay.

**Nguyên nhân:** Code khai báo intent privileged nhưng chưa bật ở Developer Portal.

**Fix:** Quay lại Bước 1.4, bật MESSAGE CONTENT INTENT và SERVER MEMBERS INTENT.

### Bot online nhưng `g!help` báo "Có lỗi xảy ra"

**Nguyên nhân:** Hầu hết là bot thiếu quyền **Embed Links** trong channel đó.

**Fix:** Server Settings → Roles → role bot → bật "Embed Links". Hoặc check channel-specific permissions.

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

Hệ điều hành recommend: **Ubuntu 24.04 LTS** (phổ biến, document đầy đủ, support đến 2029).

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
# Nén lại trừ node_modules
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
PREFIX=g!
NODE_ENV=production
```

Save: `Ctrl+O`, Enter, `Ctrl+X`.

Tạo `config.json`:

```bash
cp src/config/config.example.json src/config/config.json
nano src/config/config.json
```

Điền role/channel ID nếu đã có (chưa có thì để rỗng). Save.

#### Bước 4A.8 — Test chạy thử

```bash
npm start
```

Phải thấy `Bot online`. Nếu thấy → Ctrl+C để dừng, sang bước tiếp.

Nếu lỗi: xem log, fix, thử lại.

#### Bước 4A.9 — Cài pm2 để bot tự restart 24/7

`npm start` chạy ở foreground — đóng SSH là bot tắt. Cần **pm2** (process manager):

```bash
sudo npm install -g pm2
```

Khởi động bot qua pm2:

```bash
cd ~/galaxy-universe
pm2 start npm --name galaxy -- start
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

#### Bước 4A.10 — Cập nhật code sau này

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

#### Bước 4A.11 — Backup database định kỳ (KHUYÊN)

```bash
mkdir ~/backups

crontab -e
# Chọn nano nếu hỏi editor
```

Thêm dòng cuối file:

```
0 3 * * * cp /home/galaxy/galaxy-universe/data/galaxy.db /home/galaxy/backups/galaxy-$(date +\%Y\%m\%d).db && find /home/galaxy/backups -name "galaxy-*.db" -mtime +14 -delete
```

Save & exit.

#### Bước 4A.12 — Bảo mật cơ bản

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
- `PREFIX` = `g!`
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

`config.json` trong `.gitignore`. Cách dễ: tạm comment dòng `src/config/config.json` trong `.gitignore`, commit `config.json` (chỉ chứa role/channel ID, không phải secret). **Đảm bảo `.env` vẫn trong gitignore.**

#### Bước 4B.7 — Deploy

Push commit mới → Railway tự build và deploy. Tab **Logs** xem tiến trình. Thấy `Bot online` là xong.

Bot tự restart khi crash.

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
pm2 start npm --name galaxy -- start
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
2. Restart bot — migration runner tự apply
3. **KHÔNG sửa** migration cũ đã chạy (sẽ không re-run, mất sync với DB)

### Lệnh pm2 hay dùng (production)

```bash
pm2 status              # xem bot online không
pm2 logs galaxy         # xem live logs
pm2 logs galaxy --lines 100   # xem 100 log gần nhất
pm2 restart galaxy      # restart bot
pm2 stop galaxy         # stop bot
pm2 delete galaxy       # gỡ khỏi pm2
pm2 monit               # dashboard CPU/RAM/log realtime
```

---

## Sẵn sàng cho bước tiếp

Khi `g!ping`, `g!help`, `g!userinfo` chạy ngon — báo lại để build **step 3: Void/Prison system**:

- `g!setup jail` — tự tạo role tù + channel jail + sync permission cả server
- `g!void @user <số>` — nhốt user
- `g!escape glausan` — gõ keyword để thoát
- `g!voidstatus`, `g!free`, `g!setvoid`

5-7 file mới và 1 migration mới.
