# Galaxy Universe

Discord bot: discord.js v14 + TypeScript + SQLite.

## Tài liệu

- **[SETUP.md](./SETUP.md)** — Hướng dẫn setup từ đầu (Discord Developer Portal, code local, deploy Railway)
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** — Cấu trúc code, vai trò từng file/folder

## Quick start

```bash
npm install
cp .env.example .env # paste DISCORD_TOKEN vào
cp src/config/config.example.json src/config/config.json
npm run dev
```

Lệnh hiện có: `g!ping`, `g!help`, `g!userinfo [@user]`

## Stack

- **Runtime:** Node.js 20+
- **Language:** TypeScript (strict mode)
- **Discord:** discord.js v14
- **Database:** better-sqlite3 (synchronous SQLite)
- **Dev:** `tsx watch` for hot reload
- **Production:** `tsc` build → `node dist/index.js`
- **Hosting:** Railway with persistent volume
