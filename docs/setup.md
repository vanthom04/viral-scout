# Setup Guide

## Prerequisites

- Node.js >= 20.19.0
- pnpm >= 9.0.0
- Cloudflare account (Free tier đủ để bắt đầu)
- Wrangler CLI: `pnpm install -g wrangler`

## 1. Cài dependencies

```bash
git clone <repo>
cd viral-scout
pnpm install
```

## 2. Đăng nhập Cloudflare

```bash
wrangler login
```

## 3. Tạo D1 Database

```bash
wrangler d1 create viral-scout-db
```

Copy `database_id` từ output. Điền vào **3 file** sau:

- `apps/web/wrangler.jsonc`
- `workers/scraper/wrangler.jsonc`
- `workers/scheduler/wrangler.jsonc`

```jsonc
"d1_databases": [{ "database_id": "PASTE_ID_HERE" }]
```

## 4. Tạo Queue

```bash
wrangler queues create scraper-queue
wrangler queues create scraper-dlq   # Dead letter queue
```

## 5. Setup Database

```bash
# Schema (tạo tables)
cd packages/database
pnpm drizzle-kit generate   # Gen migration từ schema.ts

# Apply local
wrangler d1 execute viral-scout-db --local --file=migrations/0001_create_schema.sql

# Seed tags + default sources
wrangler d1 execute viral-scout-db --local --file=migrations/0001_init_seed.sql

# Apply production (sau khi test local xong)
wrangler d1 execute viral-scout-db --file=migrations/0001_create_schema.sql
wrangler d1 execute viral-scout-db --file=migrations/0001_init_seed.sql
```

## 6. Setup shadcn/ui

```bash
cd apps/web
pnpm dlx shadcn@latest init

# Cài các components đang dùng
pnpm dlx shadcn@latest add \
  field empty spinner sidebar badge card separator \
  toggle-group avatar dropdown-menu skeleton sonner \
  chart table button input label
```

## 7. Environment Variables

```bash
# Copy template
cp apps/web/.dev.vars.example apps/web/.dev.vars
```

Điền giá trị vào `apps/web/.dev.vars`:

```bash
# Generate secret
openssl rand -hex 32  # → paste vào BETTER_AUTH_SECRET

BETTER_AUTH_SECRET=your-32-char-secret
BETTER_AUTH_URL=http://localhost:3000

# Reddit (https://www.reddit.com/prefs/apps)
REDDIT_CLIENT_ID=
REDDIT_CLIENT_SECRET=

# YouTube (https://console.cloud.google.com/)
YOUTUBE_API_KEY=

# Twitter/X (https://developer.twitter.com/)
TWITTER_BEARER_TOKEN=

# TikTok (https://developers.tiktok.com/)
TIKTOK_API_KEY=

# Facebook (https://developers.facebook.com/) — optional
FACEBOOK_ACCESS_TOKEN=
```

Thêm secrets lên Cloudflare (production):

```bash
wrangler secret put BETTER_AUTH_SECRET    --name viral-scout-web
wrangler secret put REDDIT_CLIENT_ID      --name viral-scout-scraper
wrangler secret put REDDIT_CLIENT_SECRET  --name viral-scout-scraper
wrangler secret put YOUTUBE_API_KEY       --name viral-scout-scraper
wrangler secret put TWITTER_BEARER_TOKEN  --name viral-scout-scraper
wrangler secret put TIKTOK_API_KEY        --name viral-scout-scraper
```

## 8. Tạo tài khoản admin

Better Auth không có giao diện tạo tài khoản vì `disableSignUp: true`. Dùng Better Auth CLI:

```bash
cd apps/web

# Tạo tài khoản (local dev)
pnpm dlx better-auth@latest admin create-user \
  --email admin@example.com \
  --password "your-secure-password" \
  --name "Admin"
```

Hoặc tạo thủ công qua API (production):

```bash
curl -X POST https://your-domain.com/api/auth/admin/create-user \
  -H "Content-Type: application/json" \
  -H "x-admin-secret: $BETTER_AUTH_SECRET" \
  -d '{"email":"admin@example.com","password":"secure","name":"Admin"}'
```

## 9. Chạy local

```bash
# Từ root — chạy tất cả
pnpm dev

# Hoặc từng app riêng
cd apps/web && pnpm dev          # http://localhost:3000
cd workers/scraper && wrangler dev
cd workers/scheduler && wrangler dev
```

## 10. Test scraper

```bash
# Gửi job thủ công vào queue (local)
wrangler queues send scraper-queue \
  '{"sourceId":"src_reddit_pf","platform":"reddit","targetId":"personalfinance","triggeredAt":"2025-04-18T00:00:00Z"}'
```

## 11. Deploy Production

```bash
# Deploy tất cả
cd apps/web
pnpm deploy   # = opennextjs-cloudflare build && deploy

cd workers/scraper
wrangler deploy

cd workers/scheduler
wrangler deploy
```

## Troubleshooting

### `getCloudflareContext has been called without initOpenNextCloudflareForDev`

→ Đảm bảo `next.config.ts` có `initOpenNextCloudflareForDev()` call trước `export default`.

### Better Auth: `disableSignUp` không hoạt động

→ Kiểm tra `emailAndPassword.disableSignUp: true` trong `src/lib/auth.ts`.

### D1 `SQLITE_AUTH` error

→ Đảm bảo đã apply migration trước khi chạy Better Auth generate.

### Queue không nhận messages

→ Kiểm tra `binding` name trong `wrangler.jsonc` của scheduler (`SCRAPER_QUEUE`) khớp với `env.SCRAPER_QUEUE` trong code.
