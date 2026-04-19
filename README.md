# Viral Scout

Content intelligence platform — tự động cào bài viral từ Reddit, YouTube, Facebook, TikTok, X, LinkedIn và dùng AI phân tích để giúp content creator Việt Nam tạo ý tưởng nhanh hơn.

## Quick Start

```bash
# Cài deps
pnpm install

# Setup Cloudflare resources
wrangler d1 create viral-scout-db
wrangler queues create scraper-queue

# Điền D1 database_id vào wrangler.jsonc (3 files)
# Copy .dev.vars.example → .dev.vars và điền API keys

# Khởi tạo DB
wrangler d1 execute viral-scout-db --local --file=packages/database/migrations/0001_init_seed.sql

# Chạy
pnpm dev  # http://localhost:3000
```

Xem [docs/setup.md](./docs/setup.md) để hướng dẫn đầy đủ.

## Features

- **Trending Feed** — realtime posts viral từ 5+ platforms, filter theo platform/tag/virality score
- **Idea Generator** — chọn bài viral, AI gen hook/outline/caption/CTA streaming realtime
- **Analytics** — charts virality distribution, platform breakdown, top tags
- **Source Monitor** — theo dõi health cron jobs, scraper logs

## Stack

|          |                                                     |
| -------- | --------------------------------------------------- |
| Frontend | Next.js 16 + React 19 + Tailwind CSS v4 + shadcn/ui |
| Auth     | Better Auth 1.5 (login-only, no signup)             |
| Database | Cloudflare D1 (SQLite) + Drizzle ORM                |
| AI       | Cloudflare Workers AI (llama-3.3-70b)               |
| Scraping | Cloudflare Workers + Queues                         |
| Deploy   | OpenNext Cloudflare                                 |

## Structure

```
viral-scout/
├── packages/
│   ├── config/      # tsconfig shared
│   ├── types/       # TypeScript types
│   └── database/    # Drizzle schema + queries
├── workers/
│   ├── scraper/     # Queue consumer
│   └── scheduler/   # Cron trigger
└── apps/
    └── web/         # Next.js dashboard
```

## Documentation

- [docs/architecture.md](./docs/architecture.md) — System design, data flow, ADRs
- [docs/setup.md](./docs/setup.md) — Setup từ đầu đến deploy
- [docs/scraper-guide.md](./docs/scraper-guide.md) — Thêm scraper platform mới
- [CLAUDE.md](./CLAUDE.md) — Context cho AI coding tools
- [llms.txt](./llms.txt) — AI-friendly project index

## Commands

```bash
pnpm dev          # Dev tất cả packages
pnpm build        # Build
pnpm type-check   # TypeScript check
pnpm deploy       # Deploy lên Cloudflare
```

## License

MIT
