# 🌌 Galaxy Universe

Discord bot tùy chỉnh cho cộng đồng Việt Nam theme vũ trụ. discord.js v14 + TypeScript + SQLite.

## Tài liệu

- **[SETUP.md](./SETUP.md)** — Hướng dẫn setup từ đầu (Discord Developer Portal, code local, deploy Railway)
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** — Cấu trúc code, vai trò từng file/folder

## Quick start

```bash
npm install
cp .env.example .env       # rồi paste DISCORD_TOKEN vào
cp src/config/config.example.json src/config/config.json
npm run dev
```

Lệnh hiện có: `g!ping`, `g!help`, `g!userinfo [@user]`

## Build status

- [x] Step 1+2: Project skeleton + SQLite + User commands
- [ ] Step 3: Void/Prison system
- [ ] Step 4: Level system
- [ ] Step 5: Economy
- [ ] Step 6: Moderation
- [ ] Step 7: Tickets
- [ ] Step 8: Games
- [ ] Step 9: Shop & Role
- [ ] Step 10: Galaxy (themed flavor)

## Stack

- **Runtime:** Node.js 20+
- **Language:** TypeScript (strict mode)
- **Discord:** discord.js v14
- **Database:** better-sqlite3 (synchronous SQLite)
- **Dev:** `tsx watch` for hot reload
- **Production:** `tsc` build → `node dist/index.js`
- **Hosting:** Railway with persistent volume
