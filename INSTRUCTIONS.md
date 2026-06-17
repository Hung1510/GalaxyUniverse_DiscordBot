# Galaxy Universe — Toàn bộ các bước setup và test

Tài liệu này liệt kê **tuần tự** mọi việc cần làm để đưa bot từ trạng thái hiện tại (step 1+2+3 code đã có, `g!ping` đã chạy) đến trạng thái sẵn sàng cho owner test trên server thật.

Mỗi mục có một checkbox. Khi làm xong, tick lại. Khi vướng chỗ nào, dừng lại và hỏi.

---

## Phần A: Hoàn tất test Void/Prison trên test server

### Bước A.1 — Test `g!help` sau khi bật step 3

- [ ] Mở Discord, vào test server, channel bất kỳ
- [ ] Gõ `g!help`
- [ ] Verify embed có **2 category**: "Người dùng (3)" và "Void (7)"
- [ ] Verify 7 lệnh void: `escape`, `free`, `jailsetting`, `setup`, `setvoid`, `void`, `voidstatus`

### Bước A.2 — Test `g!setup jail`

- [ ] Gõ `g!setup jail`
- [ ] Verify bot reply `Đang setup Void, đợi xíu...`
- [ ] Đợi 5-10 giây, message tự edit thành embed thành công
- [ ] Verify embed nói "Setup Void hoàn tất" với role và channel
- [ ] Verify sidebar Discord xuất hiện channel mới `#the-void`
- [ ] Verify role mới `Void` (vào Server Settings → Roles để xem)
- [ ] Verify role bot ĐANG ở trên role Void trong danh sách roles (kéo lên nếu chưa)

### Bước A.3 — Chuẩn bị second account để test jail flow

Cần một user khác để test `g!void`. Vì bot từ chối tự nhốt mình và không nhốt bot khác.

- [ ] Tạo Discord account thứ 2 (browser khác hoặc điện thoại), hoặc nhờ bạn join test server
- [ ] Get invite link từ test server (right click server icon → Invite People → Copy)
- [ ] Second account dùng invite link, join test server
- [ ] Verify second account thấy được channels trong server từ main account

### Bước A.4 — Test `g!void`

Từ **main account**:

- [ ] Gõ `g!void @secondaccount 5 testing reason`
- [ ] Verify bot reply embed "đã bị nhốt vào Void 5 lần. Lý do: testing reason"
- [ ] Vào Server Settings → Members → second account → verify đã có role Void
- [ ] Switch sang **second account**, verify chỉ thấy được channel `#the-void`, các channel khác biến mất khỏi sidebar

### Bước A.5 — Test `g!voidstatus`

Từ main account:

- [ ] Gõ `g!voidstatus @secondaccount`
- [ ] Verify embed hiện "Tiến độ: 5/5 lần"
- [ ] Verify embed có field "Lý do: testing reason"

### Bước A.6 — Test mechanic gõ "glausan"

Từ **second account**, trong channel `#the-void`:

- [ ] Gõ `glausan` (không có prefix)
- [ ] Verify bot reply progress: "Tiến độ: 4/5"
- [ ] Đợi 3 giây (vì có ATTEMPT_COOLDOWN_MS = 3s)
- [ ] Gõ `glausan` lần nữa → "Tiến độ: 3/5"
- [ ] Test cooldown: gõ `glausan` 2 lần liên tiếp trong 1 giây
- [ ] Verify lần thứ 2 báo "Đợi Xs rồi gõ tiếp"

### Bước A.7 — Test typo và reset

Từ second account:

- [ ] Gõ một chữ sai như `gluasan` hoặc `xxx`
- [ ] Có 30% chance bot báo "Sai rồi! Tiến độ reset về 0"
- [ ] Nếu không trúng reset, lặp lại vài lần đến khi trúng (xác suất ~30% mỗi lần)
- [ ] Sau khi trúng reset, verify tiến độ = total_count (vd nếu sentence 5 lần, sau reset là 5/5 lại)
- [ ] Nếu không trúng reset, bot báo "Sai rồi. Còn lại: N" — tiến độ không đổi

### Bước A.8 — Test escape thành công

Từ second account, trong `#the-void`:

- [ ] Gõ `glausan` đủ số lần để hết sentence
- [ ] Verify embed "đã thoát khỏi Void" xuất hiện
- [ ] Switch sang main account, verify second account đã mất role Void
- [ ] Switch lại second account, verify lại thấy được tất cả channel

### Bước A.9 — Test immunity

Ngay sau khi second account thoát (Bước A.8), từ main account:

- [ ] Gõ `g!void @secondaccount 5 retry`
- [ ] Verify bot từ chối: "User vừa được thả, chờ X phút nữa mới nhốt lại được"
- [ ] (Immunity là 1 giờ theo config, không cần đợi để test xong)

### Bước A.10 — Test `g!setvoid` (mod override)

- [ ] Jail lại second account: `g!void @secondaccount 10 setvoid test`
  - Nếu báo immunity, mở `data/galaxy.db` bằng DB Browser for SQLite (https://sqlitebrowser.org/), xóa row trong `void_immunity` table, restart bot
- [ ] Gõ `g!setvoid @secondaccount 2`
- [ ] Verify embed "Tiến độ: 2/10"
- [ ] Cho second account gõ `glausan` 2 lần
- [ ] Verify escape thành công

### Bước A.11 — Test `g!free` (mod release)

- [ ] Jail lại second account
- [ ] Từ main account: `g!free @secondaccount`
- [ ] Verify embed "đã được @main ân xá khỏi Void"
- [ ] Verify second account mất role Void

### Bước A.12 — Test `g!jailsetting` (re-sync khi có channel mới)

- [ ] Tạo channel mới trong test server (vd: `#test-channel`)
- [ ] Switch sang second account, jail nó (`g!void @secondaccount 5`)
- [ ] Verify second account VẪN thấy được `#test-channel` mới (vì chưa sync)
- [ ] Từ main: `g!jailsetting`
- [ ] Verify bot báo "Đã sync permission cho N channel"
- [ ] Verify second account giờ không thấy `#test-channel` nữa
- [ ] Free second account để dọn dẹp

### Bước A.13 — Test edge case: self-jail và bot-jail

- [ ] `g!void @main` → bot báo "Không tự nhốt mình được"
- [ ] `g!void @Galaxy Universe` → bot báo "Không nhốt được bot"

### Bước A.14 — Test permission gate

- [ ] Switch sang second account
- [ ] Gõ `g!void @main 5 trying`
- [ ] Verify bot báo "Không có quyền dùng lệnh này" (vì second account không có role Mod/Admin và không phải server owner)

---

## Phần B: Push code lên GitHub

### Bước B.1 — Verify .gitignore hoạt động

Trong terminal, ở folder dự án:

- [ ] `git init` (nếu chưa init)
- [ ] `git add .`
- [ ] `git status`
- [ ] Verify các file/folder sau **KHÔNG** xuất hiện trong "Changes to be committed":
  - `.env`
  - `src/config/config.json`
  - `node_modules/`
  - `data/`
  - `dist/`
- [ ] Nếu có file nào trong list trên, DỪNG LẠI và sửa `.gitignore` trước

### Bước B.2 — Tạo repo trên GitHub

- [ ] Vào https://github.com/new
- [ ] Repository name: `GalaxyUniverse_DiscordBot`
- [ ] Description: tùy ý
- [ ] Visibility: **Private** (khuyên dùng)
- [ ] **KHÔNG tick** "Add README", "Add .gitignore", "Add license"
- [ ] Bấm "Create repository"

### Bước B.3 — Push code

Trong terminal, ở folder dự án:

- [ ] `git commit -m "Initial commit: step 1+2+3 (skeleton, sqlite, void system)"`
- [ ] `git branch -M main`
- [ ] `git remote add origin https://github.com/Hung1510/GalaxyUniverse_DiscordBot.git`
- [ ] `git push -u origin main`
- [ ] Verify code đã lên GitHub (refresh trang repo, thấy file)
- [ ] **Mở repo trên GitHub, browse từng folder, verify lại không có `.env` hay token nào lộ**

---

## Phần C: Hoàn thiện documentation

### Bước C.1 — Update README

- [ ] Mở `README.md` trong project
- [ ] Update phần "Build status": tick `[x]` cho Step 3
- [ ] Commit: `git add README.md && git commit -m "docs: mark step 3 complete" && git push`

### Bước C.2 — Thêm KILLSWITCH.md

- [ ] Tạo file `KILLSWITCH.md` ở project root
- [ ] Copy nội dung killswitch order từ chat trước (5 mức)
- [ ] Commit và push

---

## Phần D: Quyết định hosting và deploy

### Bước D.1 — Discuss với owner

- [ ] Hỏi owner: Onidel Singapore VPS hay Railway?
- [ ] Nếu Onidel: ai trả tiền VPS, ai admin? (khuyên: bạn admin, owner trả tiền)
- [ ] Nếu Railway: GitHub repo phải kết nối với account nào?

### Bước D.2A — Deploy Onidel (nếu chọn Onidel)

Follow `SETUP.vi.md` Phần 4A từ bước đầu đến bước 12. Checklist tóm tắt:

- [ ] Tạo account Onidel, tạo VPS Singapore Ubuntu 24.04
- [ ] SSH vào VPS, update hệ thống
- [ ] Tạo user `galaxy`, thêm sudo
- [ ] Cài Node.js 20
- [ ] Cài build tools (`build-essential python3 git`)
- [ ] Clone repo từ GitHub
- [ ] Tạo `.env` với token thật
- [ ] Tạo `config.json` (để rỗng hoặc điền role ID của test server)
- [ ] `npm install && npm run build`
- [ ] Test `npm start`, verify thấy "Bot online"
- [ ] Cài pm2, start bot qua pm2
- [ ] Setup pm2 auto-restart trên boot
- [ ] Setup cron backup DB
- [ ] Bảo mật: SSH key, tắt password auth, bật ufw firewall

### Bước D.2B — Deploy Railway (nếu chọn Railway)

Follow `SETUP.vi.md` Phần 4B. Checklist:

- [ ] Tạo Railway project, connect GitHub repo
- [ ] Add environment variables (DISCORD_TOKEN, DATABASE_PATH=`/data/galaxy.db`, PREFIX, NODE_ENV=production)
- [ ] Tạo persistent volume mount `/data`
- [ ] Set build command `npm install && npm run build`, start command `npm start`
- [ ] Xử lý config.json (tạm comment trong gitignore, push, rồi un-comment)
- [ ] Verify logs thấy "Bot online"

---

## Phần E: Chuẩn bị giao bot cho owner

### Bước E.1 — Lấy thông tin từ owner

Cần xin owner:

- [ ] Server ID của server thật
- [ ] Role IDs của Admin role(s) và Mod role(s) trên server thật
- [ ] Vài channel ID owner muốn cho bot dùng:
  - [ ] Channel để log mod actions (sau dùng cho `g!warn`, `g!ban`)
  - [ ] Category để tạo ticket channels (sau dùng cho `g!ticket`)
  - [ ] Channel để post ticket transcript (sau dùng cho `g!close`)
  - [ ] Channel welcome message (sau dùng cho `guildMemberAdd`)

### Bước E.2 — Update config.json

Trên production server (Onidel/Railway):

- [ ] SSH vào VPS hoặc Railway shell
- [ ] Mở `src/config/config.json`
- [ ] Điền role/channel IDs owner đã đưa
- [ ] Restart bot (`pm2 restart galaxy`)
- [ ] Verify logs không có warning về config

### Bước E.3 — Mời bot vào server thật

- [ ] Từ Developer Portal, regenerate OAuth2 URL (same permissions)
- [ ] Gửi URL cho owner
- [ ] Owner mời bot
- [ ] Verify bot xuất hiện trong server thật, status online

### Bước E.4 — Setup Void trên server thật

- [ ] Từ account có role Admin trên server thật: `g!setup jail`
- [ ] Verify role và channel được tạo
- [ ] Verify channels khác đã được sync deny ViewChannel
- [ ] Owner test `g!void` với một test user trên server thật

---

## Phần F: Sẵn sàng cho step 4 (Level system)

Khi nào tất cả Phần A đến E pass, bot đã online ổn định trên production, owner đã verify bot hoạt động đúng → quay lại chat báo "ready for step 4".

Step 4 sẽ thêm:

- XP per message với 60s cooldown
- Level-up calculation (formula `5n² + 50n + 100`)
- Level-up reward (100 × new level coins, owner toggle)
- Commands: `g!rank`, `g!level`, `g!top`
- Migration 003 cho `xp_cooldowns` table (hoặc dùng in-memory map)

Sau Step 4: Economy (step 5) → Moderation → Tickets → Games → Shop/Role → Galaxy.

---

## Quick troubleshooting reference

| Vấn đề | Check |
|---|---|
| Bot không phản hồi lệnh | Message Content Intent có bật không? Bot có quyền Send Messages? |
| `g!setup jail` báo missing perms | Bot role có Manage Roles + Manage Channels? |
| `g!void` báo lỗi không gán được role | Bot role có TRÊN role Void trong list không? |
| Jailed user vẫn thấy channels khác | Chạy `g!jailsetting` để re-sync |
| Migration không apply | Check `_migrations` table, xóa row nếu cần force re-run |
| `npm install` lỗi `better-sqlite3` | Cài build tools (xem SETUP Troubleshooting) |
| Bot reply text như `[void.jailed]` | Thiếu key trong `vi.json`, check console warn |
| `database is locked` | Có 2 process bot cùng chạy, kill bớt |

---

## Khi nào cần hỏi lại

Hỏi ngay khi:

- Một bước test fail và không hiểu lý do
- Lỗi terminal không hiểu
- Owner đưa ra yêu cầu không có trong spec gốc
- Cần quyết định trade-off (vd: hosting, permission tier, gameplay number)
- Cảm thấy không chắc về security implication

Đừng tự đoán mò khi liên quan tới:

- Token, secret
- DB schema thay đổi
- Permission trên Discord
- Pushing lên GitHub
