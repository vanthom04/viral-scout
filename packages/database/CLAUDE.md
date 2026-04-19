# packages/database — CLAUDE.md

Package `@viral-scout/database` — Drizzle ORM schema + typed queries cho Cloudflare D1. Được dùng bởi cả `apps/web` và `workers/scraper`.

## Files

| File                               | Mô tả                                                                              |
| ---------------------------------- | ---------------------------------------------------------------------------------- |
| `src/schema.ts`                    | Drizzle table definitions + inferred types                                         |
| `src/queries/posts.queries.ts`     | getViralPosts, getPostById, postExistsByExternalId, insertPost, upsertAnalyzedPost |
| `src/queries/sources.queries.ts`   | getActiveSources, getAllSources, toggleSourceActive, getAllTags, insertPostTags    |
| `src/queries/cron-logs.queries.ts` | insertCronLog, getRecentLogsForSource, getJobHealthSummary                         |
| `src/index.ts`                     | Barrel re-export + `drizzle` factory re-export                                     |
| `drizzle.config.ts`                | Config cho drizzle-kit generate/migrate                                            |
| `migrations/0001_init_seed.sql`    | Seed tags + default sources                                                        |

## Schema — 7 bảng app + 4 bảng auth

```
App tables (Drizzle managed):
  sources        — platform config, cron schedule
  posts          — raw scraped posts
  analyzed_posts — AI results (1:1 với posts)
  tags           — taxonomy 15 tags (seed only)
  post_tags      — junction posts ↔ tags
  saved_ideas    — user saved posts
  cron_logs      — scraper job health

Auth tables (Better Auth managed — đừng sửa):
  user, session, account, verification
  → defined in apps/web/src/db/auth-schema.ts
```

## Khởi tạo Drizzle instance

```typescript
import { drizzle } from "drizzle-orm/d1"
import * as schema from "@viral-scout/database"

// Trong Workers (scraper, scheduler)
const db = drizzle(env.DB, { schema })

// Trong apps/web — dùng helper
import { getDb } from "@/lib/db"
const db = await getDb() // wraps getCloudflareContext
```

## Query patterns

```typescript
import { getViralPosts, insertPost, upsertAnalyzedPost } from "@viral-scout/database";

// Lấy posts viral với filter
const posts = await getViralPosts(db, {
  minVirality: 7,
  platforms:   ["reddit", "youtube"],
  limit:       20,
});

// Insert post mới
const { id } = await insertPost(db, newPost);

// Upsert analyzed post (idempotent)
await upsertAnalyzedPost(db, { postId, viralityScore, hookAngles: JSON.stringify([...]), ... });
```

## Lưu ý D1 quan trọng

- **Không native array columns** — arrays phải `JSON.stringify` trước khi lưu
  - `hookAngles` trong `analyzed_posts` là `text` chứa JSON string
  - Parse lại khi đọc: `JSON.parse(row.hookAngles) as string[]`
- **Không interactive transactions** — D1 dùng batch() API
- **`onConflictDoUpdate`** thay vì upsert custom
- Index đã được setup cho các queries phổ biến — tránh full table scan

## Migration workflow

```bash
# Generate migration từ schema changes
cd packages/database
pnpm drizzle-kit generate

# Apply local (development)
wrangler d1 execute viral-scout-db --local --file=migrations/<file>.sql

# Apply production
wrangler d1 execute viral-scout-db --file=migrations/<file>.sql

# Seed data
wrangler d1 execute viral-scout-db --local --file=migrations/0001_init_seed.sql
```

## Thêm query mới

1. Thêm function vào file query tương ứng trong `src/queries/`
2. Export từ `src/index.ts`
3. Type sẽ được infer tự động từ Drizzle schema

```typescript
// Pattern chuẩn
export const myQuery = async (db: DB, param: string) =>
  db.select({ ... }).from(table).where(eq(table.col, param));
```

## Inferred Types

```typescript
// Dùng inferred types thay vì tự define
import type { Post, NewPost, AnalyzedPost, Source } from "@viral-scout/database"

// NewPost = typeof posts.$inferInsert
// Post    = typeof posts.$inferSelect
```
