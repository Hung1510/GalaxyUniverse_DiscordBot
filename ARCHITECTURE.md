Galaxy Universe — Cấu Trúc Dự Án

Tài liệu này giải thích từng file/folder trong dự án

---

##  Cấu trúc tổng quan

```
galaxy-universe/
├── src/
│   ├── commands/         # Mỗi lệnh là 1 file riêng
│   ├── events/           # Xử lý event Discord (message, ready, member join...)
│   ├── framework/        # "Bộ máy" của bot — load command, check permission, cooldown
│   ├── db/               # Database SQLite + migrations + repository
│   ├── services/         # Business logic phức tạp (cross-table)
│   ├── lang/             # Toàn bộ chữ tiếng Việt user thấy
│   ├── config/           # Cấu hình (cooldown, limit, role ID...)
│   ├── types/            # Type chung dùng nhiều nơi
│   ├── utils/            # Helper nhỏ (logger, embed, format)
│   └── index.ts          # File khởi động bot
├── data/                 # File .db SQLite (Railway mount volume vào đây)
├── .env                  # Token bot, secret (KHÔNG commit lên git)
├── .env.example          # Mẫu .env để người khác copy
├── tsconfig.json         # Cấu hình TypeScript
├── package.json          # Dependencies + scripts
└── README.md
```

---

## Entry point

### `src/index.ts`
File khởi động bot. Khi chạy `npm start`, Node sẽ chạy file này đầu tiên.

**Nó làm gì theo thứ tự:**
1. Load biến môi trường từ `.env` (token bot, đường dẫn DB)
2. Load `config.json` (role ID mod/admin, channel ID...)
3. Khởi tạo database SQLite, chạy migrations nếu có cái mới
4. Tạo Discord Client với đúng **intents** cần thiết (Guilds, GuildMessages, MessageContent, GuildMembers — chi tiết sẽ giải thích trong code)
5. Đăng ký toàn bộ event handler từ folder `events/`
6. Đăng ký toàn bộ command từ folder `commands/`
7. `client.login(token)` — bot online

**File này KHÔNG chứa logic bot.**

---

## ⚙️ Framework — "bộ máy" của bot

Folder `src/framework/` là phần code **ít sửa nhất** sau khi viết xong. Đây là engine chạy command. Hầu hết thời gian dev sau này bạn làm trong `commands/` và `services/`, không động vào đây.

### `src/framework/Command.ts`
Định nghĩa **interface `Command`** — mọi file lệnh phải tuân theo cái này.

Ví dụ một command phải khai báo:
- `name`: tên lệnh ("ping", "daily", "void"...)
- `aliases`: tên thay thế (`g!bal` = `g!balance`)
- `category`: thuộc nhóm nào (user, economy, void...)
- `cooldown`: bao nhiêu giây giữa 2 lần dùng
- `permission`: ai được dùng (everyone, mod, admin)
- `execute(ctx)`: hàm chạy khi user gõ lệnh

Cũng định nghĩa **type `CommandContext`** — object truyền vào `execute` chứa: message, args, user, guild, db, lang... — mọi thứ command cần.

Mọi command đều cùng shape → handler chỉ cần 1 logic dispatch chung, không phải xử lý riêng từng lệnh.

### `src/framework/CommandHandler.ts`
Bộ điều phối lệnh. Khi user gõ `g!ping`, file này:
1. Parse message → tách prefix, tên lệnh, args
2. Tìm command tương ứng trong registry
3. Check **cooldown** (user vừa dùng lệnh này chưa?)
4. Check **permission** (user có quyền không?)
5. Tạo `CommandContext`, gọi `command.execute(ctx)`
6. Catch lỗi → log + báo user "có lỗi xảy ra" bằng tiếng Việt

Cũng có hàm **`loadCommands()`** quét folder `commands/` lúc bot start, đọc tất cả file `.ts`, register vào Map.

### `src/framework/EventHandler.ts`
Tương tự `CommandHandler` nhưng cho event Discord. Quét folder `events/`, đăng ký mỗi file vào event tương ứng (`ready`, `messageCreate`...).

### `src/framework/Cooldowns.ts`
Quản lý cooldown trong RAM. Dùng `Map<string, number>` với key dạng `"userId:commandName"`, value là timestamp hết cooldown.

**Tại sao trong RAM, không vào DB:** Cooldown ngắn (vài giây đến vài phút), check rất nhiều (mỗi lệnh). Hit DB sẽ chậm. Mất khi restart cũng không sao — coi như reset.

**Ngoại lệ:** `daily` cooldown 24h thì lưu DB, vì restart bot không nên cho user claim lại.

### `src/framework/Permissions.ts`
Helper check quyền. Hàm chính: `isStaff(member)` → trả `true` nếu user có role Mod hoặc Admin (đọc role ID từ config).

Cũng có `getPermissionLevel(member)` trả về enum `USER | MOD | ADMIN` — để command nào cần phân biệt mod vs admin có thể dùng.

---

##ommands — mỗi lệnh 1 file

Folder `src/commands/` chia theo nhóm chức năng. Mỗi file `.ts` xuất ra 1 object `Command`.

### `src/commands/user/`
- `ping.ts` — `g!ping`, kiểm tra bot có sống không, hiện latency
- `help.ts` — `g!help`, list lệnh theo nhóm
- `userinfo.ts` — `g!userinfo @user`, hiện info user (join date, role...)
- `avatar.ts` — `g!avatar @user`, hiện avatar size lớn
- `server.ts` — `g!server`, info server (member count, owner, boost level)
- `invite.ts` — `g!invite`, link mời bot
- `uptime.ts` — `g!uptime`, bot chạy được bao lâu

### `src/commands/void/` — **Hệ thống nhà tù (làm trước theo yêu cầu owner)**
- `setup.ts` — `g!setup jail`, tạo role tù + channel jail, sync permission tất cả channel
- `jailsetting.ts` — `g!jailsetting`, sync lại permission khi có channel mới
- `void.ts` — `g!void @user <số_lần> [lý_do]`, nhốt user
- `escape.ts` — `g!escape glausan`, user gõ để giảm số lần
- `voidstatus.ts` — `g!voidstatus`, xem còn bao nhiêu lần
- `setvoid.ts` — `g!setvoid @user <số>`, mod chỉnh số lần
- `free.ts` — `g!free @user`, mod thả

### `src/commands/level/`, `economy/`, `moderation/`, `ticket/`, `games/`, `shop/`, `galaxy/`, `system/`
Làm sau theo build order. Cấu trúc giống nhau: 1 file = 1 lệnh.

**Quy ước:** tên file = tên lệnh. `g!daily` → `commands/economy/daily.ts`. Dễ tìm.

---

## 📡 Events — phản ứng với Discord

Folder `src/events/` chứa các handler cho event của Discord (gateway events).

### `src/events/ready.ts`
Chạy **một lần duy nhất** khi bot kết nối thành công với Discord.

**Nó làm gì:**
- Log ra console: `"Bot online: GalaxyUniverse#1234, ở X server, Y user"`
- Set bot status (ví dụ `"Đang xem 🌌 vũ trụ"`, hoặc `"g!help | 350 thành viên"`)
- Bắt đầu background jobs nếu có (ví dụ: timer auto-release void user sau 7 ngày)

Chỉ chạy 1 lần — nếu bot disconnect rồi reconnect, event này có thể trigger lại (gọi là `clientReady` v14), nhưng các thiết lập đều idempotent.

### `src/events/messageCreate.ts`
Chạy **mỗi khi có tin nhắn mới** trong server bot có mặt. Đây là event hoạt động nhiều nhất.

**Logic theo thứ tự:**
1. Bỏ qua nếu là bot khác (tránh loop bot trả lời bot)
2. Bỏ qua nếu là DM (chỉ xử lý trong guild)
3. **Cấp XP** nếu user không trong cooldown XP (60s) — gọi `LevelService.giveXp()`
4. **Track void attempt** nếu user đang bị nhốt và đang gõ trong jail channel — gọi `VoidService.handleAttempt()`
5. Check tin nhắn có bắt đầu bằng prefix `g!` không. Không → return.
6. Có prefix → chuyển cho `CommandHandler.handle(message)`

**Lưu ý quan trọng:** event này chạy cho **MỌI tin nhắn**, kể cả tin nhắn không phải command. Vì vậy logic phải nhanh — đừng query DB không cần thiết. Cooldown XP check trong RAM trước, chỉ hit DB khi thực sự cấp XP.

### `src/events/interactionCreate.ts` (làm sau)
Cho slash command sau này. Hiện tại bot dùng prefix `g!` nên file này có thể để trống hoặc chưa làm.

### `src/events/guildMemberAdd.ts` (làm sau)
Welcome message khi có người mới vào server.

---

## Database — lưu trữ dữ liệu

Folder `src/db/` chứa toàn bộ logic database. Dùng SQLite qua `better-sqlite3` (đồng bộ, file-based, không cần server riêng).

### `src/db/database.ts`
Khởi tạo connection SQLite. Khi import file này lần đầu, nó:
1. Mở file `data/galaxy.db` (tạo nếu chưa có)
2. Chạy `PRAGMA journal_mode = WAL` (write-ahead logging — nhanh hơn, an toàn hơn)
3. Chạy migration runner: đọc `_migrations` table, chạy file `.sql` nào chưa apply
4. Export `db` instance cho các repository dùng

### `src/db/migrations/`
Mỗi file `.sql` là một thay đổi schema, đặt tên theo số thứ tự để chạy đúng order.

- `001_initial.sql` — tạo bảng `users` (id, balance, bank, xp, level, created_at) và `guild_settings` (role ID mod/admin/jail, channel ID modlog/ticket-category/jail...)
- `002_void.sql` — bảng `void_sentences` (user_id, total_count, remaining, reason, jailed_at, jailed_by)
- `003_warnings.sql`, `004_economy.sql`... — thêm khi build feature mới

**Tại sao file SQL riêng:** dễ review, version control, và rollback hơn là code migration ORM. Với scale 350-2000 user, ORM là overkill.

### `src/db/repositories/`
**Repository = lớp truy cập 1 bảng**. Mỗi file 1 bảng. Command/service KHÔNG được query SQL trực tiếp — phải qua repo.

- `UserRepo.ts` — `getUser(id)`, `createUser(id)`, `updateBalance(id, amount)`, `getOrCreate(id)` (rất hay dùng vì user có thể chưa tồn tại)
- `GuildSettingsRepo.ts` — `getSettings(guildId)`, `setJailRole(guildId, roleId)`...
- `VoidRepo.ts` — `getSentence(userId)`, `createSentence(...)`, `decrementRemaining(userId)`, `release(userId)`

**Tại sao tách:** sau này nếu đổi DB (hypothetically Postgres), chỉ sửa repo, không phải tìm SQL rải rác trong 50 file command.

---

## Services — business logic phức tạp

Folder `src/services/` chứa logic **vượt quá 1 bảng** hoặc **dùng ở nhiều command**.

**Ví dụ phân biệt:**
- "Lấy balance của user" → `UserRepo.getUser()` đủ rồi, không cần service
- "Cấp XP, check level up, nếu lên level thì cộng tiền thưởng + post tin nhắn level up + cập nhật role" → đây là service vì đụng tới 3 thứ

### `src/services/LevelService.ts`
- `giveXp(userId, amount)` — cộng XP, check level up, trigger reward
- `getRequiredXp(level)` — công thức `5*level² + 50*level + 100`
- `xpCooldownMap` — Map trong RAM track ai vừa được cấp XP, không cấp lại trong 60s

### `src/services/VoidService.ts`
- `jail(userId, count, reason, jailedBy)` — gán role, tạo record DB
- `handleAttempt(userId, content)` — user gõ "glausan", check, decrement, có khi reset (30%), check escape thành công
- `release(userId, releasedBy)` — xóa role, xóa record, log

### `src/services/EconomyService.ts` (sau)
- `transfer(fromId, toId, amount)` — atomic, check balance, update cả 2
- `claimDaily(userId)` — check streak, tính reward, update streak

### `src/services/ModLogService.ts` (sau)
- `log(action, target, mod, reason)` — ghi DB + post embed lên channel modlog

**Quy tắc:** command file chỉ nên gọi 1-2 service method, không chứa logic phức tạp. Command là "input handler", service là "business brain".

---

## 🇻🇳 Lang — chữ tiếng Việt

### `src/lang/vi.json`
**Toàn bộ** text user thấy nằm ở đây. Cấu trúc nested:

```json
{
  "common": {
    "error": " Có lỗi xảy ra, thử lại sau nhé.",
    "no_permission": " Bạn không có quyền dùng lệnh này.",
    "cooldown": " Đợi {seconds}s nữa rồi dùng tiếp."
  },
  "void": {
    "jailed": " {user} đã bị nhốt vào Void {count} lần. Lý do: {reason}",
    "wrong_keyword": " Sai rồi! Tiến độ reset về 0.",
    "escaped": " {user} đã thoát khỏi Void!"
  }
}
```

Helper `t(key, vars)` ở `utils/lang.ts` đọc và thay placeholder.

**Tại sao tách ra:** owner hoặc bạn muốn đổi câu chữ — chỉ sửa JSON, không động vào code. Sau này muốn thêm tiếng Anh thì tạo `en.json` cùng key.

---

##  Config — cài đặt

### `src/config/constants.ts`
**Số liệu game logic** — các constant đã chốt với owner: cooldown, bet limit, công thức XP, void rules...

```ts
export const ECONOMY = {
  DAILY_BASE: 500,
  DAILY_STREAK_BONUS: 50,
  DAILY_MAX: 5000,
  WORK_MIN: 200,
  WORK_MAX: 800,
  // ...
} as const;
```

`as const` để TypeScript biết đây là literal type, không bị widen thành `number`.

### `src/config/config.example.json`
Mẫu config check vào git. User copy thành `config.json`, điền role ID.

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

### `src/config/config.json` (gitignored)
File thật chứa ID. Owner gửi ID sau, paste vào đây.

### `src/config/config.ts`
Loader: đọc `config.json`, validate, export typed object. Nếu config thiếu field bắt buộc → bot báo lỗi và exit lúc start (fail fast).

---

##  Utils — helper nhỏ

Folder `src/utils/` chứa các helper dùng chung không thuộc service nào cụ thể.

- `logger.ts` — wrapper log có timestamp + màu (winston hoặc pino)
- `embed.ts` — factory tạo Embed Discord với theme cosmic mặc định (màu tím vũ trụ, footer)
- `format.ts` — `formatNumber(1234567)` → `"1.234.567"`, `formatTime(ms)` → `"2 giờ 30 phút"`
- `lang.ts` — hàm `t(key, vars)` đọc `vi.json`
- `random.ts` — `randomInt(min, max)`, `randomChoice(array)` — wrap `Math.random` cho test dễ hơn

---

##  Types — type chung

### `src/types/`
Type/interface dùng ở nhiều nơi:
- `models.ts` — interface `User`, `VoidSentence`, `GuildSettings` — match schema DB
- `discord.ts` — type extend Discord.js (ví dụ `GuildMessage` = `Message<true>` cho command chỉ chạy trong guild)
- `command.ts` — re-export `Command`, `CommandContext` từ framework

---

##  Files cấp root

### `.env`
Chứa secret. Format:
```
DISCORD_TOKEN=...
DATABASE_PATH=./data/galaxy.db
NODE_ENV=production
```
**KHÔNG commit lên git.** Đã add vào `.gitignore`.

### `.env.example`
Bản mẫu, có commit. Copy thành `.env` rồi điền.

### `tsconfig.json`
Cấu hình TypeScript. Quan trọng: `"strict": true`, `"target": "ES2022"`, `"module": "ES2022"`, `"moduleResolution": "Bundler"`.

### `package.json`
Scripts:
- `npm run dev` — chạy với `tsx watch` (hot reload khi sửa code)
- `npm run build` — compile TS → JS bằng `tsc`
- `npm start` — chạy bản build (production)

### `data/galaxy.db`
File SQLite. **Folder `data/` được Railway mount như persistent volume** — restart bot không mất data.

`.gitignore` phải có `data/`.

---

##  Luồng chạy ví dụ: user gõ `g!void @abc 10`

Để hiểu cách các file phối hợp, đây là flow đầy đủ:

1. **Discord** → gửi message event đến bot qua gateway
2. **`events/messageCreate.ts`** → nhận event, bỏ qua bot/DM, gọi `CommandHandler.handle(message)`
3. **`framework/CommandHandler.ts`** → parse "g!void", tìm command "void" trong registry
4. **`framework/Permissions.ts`** → check user có role Mod/Admin không (đọc từ config)
5. **`framework/Cooldowns.ts`** → check user vừa gõ `g!void` chưa
6. Tạo `CommandContext`, gọi `commands/void/void.ts`
7. **`commands/void/void.ts`** → parse args (mention, số 10), validate, gọi `VoidService.jail(...)`
8. **`services/VoidService.ts`** → gọi `VoidRepo.createSentence(...)` lưu DB, `member.roles.add(jailRole)` Discord API, gọi `ModLogService.log(...)`
9. **`db/repositories/VoidRepo.ts`** → INSERT vào `void_sentences`
10. Service trả về thành công, command reply embed bằng text từ `lang/vi.json`

10 bước nhưng mỗi file 1 việc rõ ràng. Sau này debug dễ — biết lỗi ở layer nào.

---

##  Tóm tắt: file nào sửa khi nào?

| Khi muốn... | Sửa file |
|---|---|
| Thêm lệnh mới | Tạo file mới trong `commands/<category>/` |
| Đổi lời chào / text | `lang/vi.json` |
| Đổi cooldown / số tiền | `config/constants.ts` |
| Đổi role ID mod/admin | `config/config.json` |
| Sửa schema DB | Tạo migration mới `db/migrations/00X_*.sql` + update repo |
| Thêm event Discord (vd: member join) | Tạo file mới trong `events/` |
| Logic phức tạp đụng nhiều bảng | Service trong `services/` |
| Sửa cách bot dispatch lệnh | `framework/CommandHandler.ts` (hiếm khi cần) |

---
