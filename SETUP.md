# 🌌 Galaxy Universe — Hướng dẫn setup từ A đến Z

Tài liệu này dẫn bạn đi từ **chưa có gì** đến **bot online trong server**, gõ `g!ping` thấy phản hồi. Giả định bạn chưa từng dùng discord.js.

Có 3 phần:

1. **Tạo bot trên Discord Developer Portal** (~5 phút)
2. **Setup code trên máy local** (~10 phút)
3. **Mời bot vào server và test** (~2 phút)

Sau đó là phần **deploy lên Railway** ở cuối — làm khi nào sẵn sàng để bot chạy 24/7.

---

## 📋 Yêu cầu trước khi bắt đầu

Cần cài sẵn trên máy:

- **Node.js v20 hoặc mới hơn** — kiểm tra: mở terminal gõ `node --version`, phải hiện `v20.x.x` trở lên. Chưa có thì tải ở https://nodejs.org (chọn LTS).
- **Git** — kiểm tra: `git --version`. Chưa có thì https://git-scm.com.
- **Một code editor** — VS Code khuyên dùng (https://code.visualstudio.com).

Cần có:

- **Tài khoản Discord** đã bật **Developer Mode** (sẽ hướng dẫn bật ở dưới).
- **Một server Discord bạn có quyền Manage Server** để test (có thể tạo server mới riêng để test trước, đỡ làm hỏng server thật).

---

## Phần 1: Tạo bot trên Discord Developer Portal

### Bước 1.1 — Mở Developer Portal

1. Vào https://discord.com/developers/applications
2. Login bằng tài khoản Discord
3. Bấm nút **"New Application"** (góc phải trên)
4. Đặt tên: `Galaxy Universe` (hoặc gì cũng được — đây là tên của *application*, tên *bot* set sau)
5. Tick "I agree", bấm **Create**

Bạn sẽ vào trang quản lý app. Đây là nơi cấu hình bot.

### Bước 1.2 — Tạo Bot user

1. Ở sidebar trái, bấm **"Bot"**
2. Trang Bot có sẵn rồi (Discord tự tạo bot user khi tạo application)
3. **Đặt avatar và tên** ở mục "Username" — nên đặt giống tên app

### Bước 1.3 — Lấy Bot Token (CỰC QUAN TRỌNG)

Token là "mật khẩu" của bot. Ai có token là điều khiển bot được. **KHÔNG share, KHÔNG commit lên git.**

1. Vẫn ở trang Bot, trong mục **"TOKEN"**, bấm **"Reset Token"**
2. Confirm. Discord hiện token một lần duy nhất — dài khoảng 70 ký tự.
3. **Copy ngay**, lưu tạm vào notepad. Sẽ dùng ở Phần 2.

> Nếu lỡ tay đóng tab → quay lại bấm Reset Token lần nữa (token cũ sẽ vô hiệu).

### Bước 1.4 — Bật Privileged Intents (RẤT QUAN TRỌNG)

Discord chia event thành "intent" — bot phải khai báo trước cái nào nó nghe. 2 trong số đó là **privileged**, phải tự bật trong Developer Portal:

Cuộn xuống mục **"Privileged Gateway Intents"** trong trang Bot:

- ✅ **MESSAGE CONTENT INTENT** — bật. *Không bật thì `message.content` rỗng, bot không đọc được lệnh nào hết.*
- ✅ **SERVER MEMBERS INTENT** — bật. *Cần để resolve mention, fetch member info, làm moderation sau này.*
- PRESENCE INTENT — không cần bật, mình không dùng.

Bấm **Save Changes** ở dưới.

> Bot trong **dưới 100 server** thì không cần Discord verify để bật mấy cái này. Bot vượt 100 server mới phải apply verification.

### Bước 1.5 — Lấy Application ID và tạo Invite Link

1. Ở sidebar, bấm **"OAuth2"**
2. Trong **"OAuth2 URL Generator"**:
   - **SCOPES**: tick `bot`
   - **BOT PERMISSIONS** — tick các quyền sau (cho bước test này, sau muốn bớt sẽ bớt):
     - View Channels
     - Send Messages
     - Embed Links
     - Read Message History
     - Use External Emojis
     - Manage Messages *(cho `g!clear` sau này)*
     - Manage Roles *(cho `g!void`, role shop sau này)*
     - Manage Channels *(cho `g!setup jail`, ticket sau này)*
     - Moderate Members *(cho `g!mute` — Discord native timeout)*
     - Kick Members
     - Ban Members
3. Cuộn xuống cuối, copy **Generated URL**. Giữ lại link này, dùng ở Phần 3.

Permission integer của các quyền trên là `1376267103302` — thấy số này trong URL là đúng.

---

## Phần 2: Setup code trên máy local

### Bước 2.1 — Lấy code

Tải file `galaxy-universe.zip` đính kèm message này, giải nén ra một folder. Hoặc nếu đã đẩy lên git rồi thì:

```bash
git clone <your-repo-url> galaxy-universe
cd galaxy-universe
```

Mở folder bằng VS Code: `code .`

### Bước 2.2 — Cài dependencies

Mở terminal trong VS Code (`Ctrl+`` hoặc menu Terminal → New Terminal), gõ:

```bash
npm install
```

Đợi 1-2 phút. Sẽ tải về:
- `discord.js` — thư viện chính nói chuyện với Discord
- `better-sqlite3` — driver SQLite (cần build native — nếu lỗi xem "Troubleshooting" ở dưới)
- `dotenv` — đọc file `.env`
- `tsx`, `typescript` — chạy/compile TypeScript

### Bước 2.3 — Tạo file `.env`

Trong folder gốc dự án, copy file `.env.example` thành `.env`:

```bash
# Trên Linux/Mac:
cp .env.example .env

# Trên Windows PowerShell:
copy .env.example .env
```

Mở file `.env` trong VS Code, paste **token** ở Bước 1.3 vào:

```
DISCORD_TOKEN=MTIzNDU2Nzg5...token-thật-của-bạn-ở-đây
DATABASE_PATH=./data/galaxy.db
PREFIX=g!
NODE_ENV=development
```

> **Lưu ý:** file `.env` đã được liệt kê trong `.gitignore` — sẽ KHÔNG bị push lên GitHub.

### Bước 2.4 — Tạo file `config.json`

Copy file mẫu:

```bash
cp src/config/config.example.json src/config/config.json
```

Hiện tại để **rỗng cũng được** — bot vẫn chạy được lệnh `g!ping`, `g!help`, `g!userinfo`. Lát nữa khi build moderation/ticket sẽ điền role ID và channel ID vào.

```json
{
  "modRoleIds": [],
  "adminRoleIds": [],
  "modLogChannelId": "",
  "ticketCategoryId": "",
  "transcriptsChannelId": "",
  "welcomeChannelId": ""
}
```

### Bước 2.5 — Chạy bot lần đầu

```bash
npm run dev
```

Lệnh này dùng `tsx watch` — chạy code TypeScript trực tiếp **và** tự reload khi bạn sửa file.

**Kết quả mong đợi:**

```
[2026-...] ℹ️  INFO  Database opened: /path/to/data/galaxy.db
[2026-...] ℹ️  INFO  Running migration: 001_initial.sql
[2026-...] ℹ️  INFO  Migrations up to date (1 total)
[2026-...] ⚠️  WARN  config.json not found, using config.example.json
            (← warning này bình thường nếu bạn để config trống)
[2026-...] ℹ️  INFO  Loaded 2 event handlers
[2026-...] ℹ️  INFO  Loaded 3 commands
[2026-...] ℹ️  INFO  ✅ Bot online: GalaxyUniverse#1234
[2026-...] ℹ️  INFO     Guilds: 0 · Members (cached): 0
```

> "Guilds: 0" là vì chưa mời bot vào server. Sang phần 3.

Để **dừng bot**: bấm `Ctrl+C` trong terminal.

---

## Phần 3: Mời bot vào server và test

### Bước 3.1 — Mời bot

1. Mở link OAuth2 đã tạo ở Bước 1.5 trong browser
2. Chọn server bạn muốn mời bot vào
3. Confirm các permission, bấm **Authorize**
4. Captcha → xong

Mở Discord, vào server đó. Bot sẽ xuất hiện ở danh sách member, status **Online** (vì code đang chạy).

### Bước 3.2 — Test các lệnh

Trong bất kỳ channel nào bot có quyền nhìn và gửi tin:

**`g!ping`** → bot reply: `🏓 Pong! WebSocket: 42ms · API: 156ms`

**`g!help`** → bot trả về embed liệt kê 3 nhóm lệnh đang có (User, ...)

**`g!userinfo`** → embed thông tin về bạn

**`g!userinfo @AiĐó`** → embed thông tin user bạn mention

✅ Nếu cả 3 lệnh đều hoạt động → **Phần 1+2 hoàn tất**, sẵn sàng build Void/Prison ở step tiếp theo.

---

## ❌ Troubleshooting

### Lệnh không phản hồi

**Triệu chứng:** Gõ `g!ping` không thấy gì, terminal cũng không log gì.

**Nguyên nhân thường gặp:**

1. **Chưa bật MESSAGE CONTENT INTENT** ở Developer Portal (Bước 1.4). → Quay lại bật, save, restart bot.
2. **Bot không có quyền View Channel hoặc Send Messages trong channel đó.** → Check role permission của bot trong server.
3. **Token sai/cũ.** → Reset token, paste vào `.env`, restart.

### Lỗi `npm install` — `better-sqlite3` build fail

**Triệu chứng:** thấy error `node-gyp` hoặc `Python` hoặc `MSBuild`.

**Nguyên nhân:** `better-sqlite3` là native module, cần build tools để compile.

**Fix theo hệ điều hành:**

- **Windows:** mở PowerShell admin, chạy `npm install -g windows-build-tools` (hoặc cài Visual Studio Build Tools 2022 với workload "Desktop development with C++")
- **macOS:** `xcode-select --install`
- **Linux (Ubuntu/Debian):** `sudo apt install -y build-essential python3`

Sau đó `npm install` lại.

### Lỗi "Used disallowed intents"

**Triệu chứng:** Bot connect rồi crash với lỗi này.

**Nguyên nhân:** Code khai báo intent bị Discord coi là privileged (ví dụ MessageContent), nhưng chưa bật ở Developer Portal.

**Fix:** Quay lại Bước 1.4, bật MESSAGE CONTENT INTENT và SERVER MEMBERS INTENT.

### Bot online nhưng `g!help` báo "Có lỗi xảy ra"

**Triệu chứng:** Lỗi đỏ trong terminal.

**Nguyên nhân:** Hầu hết là `MissingPermissions` — bot không có quyền Embed Links trong channel đó.

**Fix:** Server Settings → Roles → role bot → bật "Embed Links". Hoặc check channel-specific permissions.

### Database lỗi: `SqliteError: database is locked`

**Nguyên nhân:** Có 2 process bot cùng chạy đè nhau lên file DB.

**Fix:** Dừng tất cả terminal đang chạy `npm run dev`, xác minh chỉ có 1 instance, chạy lại.

### Command thêm mới nhưng không xuất hiện

**Nguyên nhân:** Đặt sai chỗ hoặc thiếu `export default`.

**Check:**
- File phải nằm trong `src/commands/<category>/<name>.ts`
- File phải có `export default` một object satisfies `Command` interface
- Restart bot (`Ctrl+C` rồi `npm run dev` lại) — thực ra `tsx watch` tự reload, nhưng đôi khi không bắt được file mới

---

## 🚀 Deploy lên Railway (làm sau khi feature ổn)

Phần này làm khi bạn muốn bot chạy 24/7 không cần mở máy.

### Bước A — Đẩy code lên GitHub

1. Tạo repo mới trên GitHub (private khuyên dùng vì dự án có config nội bộ)
2. Trong folder dự án:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

**Verify** file `.env` và `config.json` KHÔNG bị push (đã trong `.gitignore`).

### Bước B — Tạo project Railway

1. Vào https://railway.app, login bằng GitHub
2. **New Project** → **Deploy from GitHub repo** → chọn repo Galaxy Universe
3. Railway tự detect Node.js, bắt đầu build

### Bước C — Set environment variables

1. Trong project Railway, vào tab **Variables**
2. Thêm:
   - `DISCORD_TOKEN` = token bot (giống `.env` local)
   - `DATABASE_PATH` = `/data/galaxy.db` *(không phải `./data/...` — Railway volume sẽ mount tại `/data`)*
   - `PREFIX` = `g!`
   - `NODE_ENV` = `production`

### Bước D — Tạo persistent volume (CỰC QUAN TRỌNG)

Không có cái này → mỗi lần deploy lại, file SQLite mất sạch (level, balance, void status... reset hết).

1. Trong service Railway, vào tab **Settings**
2. Cuộn xuống **Volumes**, bấm **+ New Volume**
3. **Mount path:** `/data`
4. **Size:** 1 GB (thừa thãi cho 2000 user)
5. Bấm **Add**

### Bước E — Set start command

Trong **Settings → Deploy**:

- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm start`

### Bước F — Push config.json lên Railway

`config.json` có trong `.gitignore` nên Railway không có. 2 cách:

**Cách dễ:** comment dòng `src/config/config.json` trong `.gitignore`, commit `config.json` lên (vì nó chỉ chứa role/channel ID, không phải secret). *Đảm bảo `.env` vẫn trong gitignore!*

**Cách đúng:** dùng Railway Volume, copy `config.json` qua CLI Railway (`railway run`). Phức tạp hơn, để dành sau.

### Bước G — Deploy

Push commit mới → Railway tự build và deploy. Xem **Logs** tab để theo dõi. Khi thấy `✅ Bot online` là xong.

Bot sẽ tự restart khi crash (Railway default behavior).

---

## 📝 Quick reference

### Khi sửa code

`tsx watch` tự reload khi save. Nhưng **thêm file mới** đôi khi cần restart manual.

### Khi sửa `vi.json`

Phải restart bot — file JSON load 1 lần lúc start.

### Khi sửa schema DB

1. Tạo file mới `src/db/migrations/00X_tên_thay_đổi.sql`
2. Restart bot — migration runner sẽ tự apply
3. **KHÔNG sửa** migration cũ đã chạy (sẽ không re-run, mất sync với DB)

### Cấu trúc commit git được khuyến nghị

```
feat(void): add g!setup jail command
fix(handler): cooldown not refunded on error
docs: update SETUP.md with Railway volume step
```

---

## 🌠 Sẵn sàng cho bước tiếp

Khi `g!ping`, `g!help`, `g!userinfo` đều chạy ngon — báo lại để mình tiếp tục build **step 3: Void/Prison system**. Sẽ có:

- `g!setup jail` — tự tạo role tù + channel jail + sync permission cả server
- `g!void @user <số>` — nhốt user
- `g!escape glausan` — gõ keyword để thoát
- `g!voidstatus`, `g!free`, `g!setvoid`

Ngắn gọn: nốt là 5-7 file mới và 1 migration mới.
