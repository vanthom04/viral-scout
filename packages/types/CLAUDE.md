# packages/types — CLAUDE.md

Package `@viral-scout/types` — single source of truth cho tất cả TypeScript types trong monorepo. Không có runtime code, chỉ có types và một vài pure utility functions.

## Nguyên tắc

- **Không dependencies** ngoài `@cloudflare/workers-types`
- **Không runtime side effects** — chỉ `type`, `interface`, `const enum`, pure functions
- Import package này từ bất kỳ đâu trong monorepo

## Files

| File                   | Mô tả                                                                           |
| ---------------------- | ------------------------------------------------------------------------------- |
| `src/env.types.ts`     | `CloudflareEnv` — tất cả Cloudflare bindings + secrets                          |
| `src/scraper.types.ts` | `Platform`, `RawScrapedItem`, `ScraperResult`, `ScraperJob`                     |
| `src/post.types.ts`    | `RawPost`, `AnalyzedPost`, `PostFilters`, `ContentType`, `TagSlug`              |
| `src/ai.types.ts`      | `AIAnalyzeInput/Output`, `GeneratedIdea`, `isValidAIOutput`, `toAnalysisResult` |
| `src/index.ts`         | Barrel re-export tất cả                                                         |

## CloudflareEnv — Type quan trọng nhất

```typescript
interface CloudflareEnv {
  DB: D1Database // Drizzle D1
  AI: Ai // Workers AI
  SCRAPER_QUEUE: Queue // Scraper jobs
  BETTER_AUTH_SECRET: string
  REDDIT_CLIENT_ID: string
  YOUTUBE_API_KEY: string
  // ...
}
```

Type này được dùng trong **tất cả** workers và apps. Khi thêm binding mới:

1. Thêm vào `env.types.ts`
2. Thêm vào `wrangler.jsonc` của từng worker cần dùng
3. Thêm vào `.dev.vars`

## Platform type

```typescript
type Platform = "reddit" | "youtube" | "facebook" | "tiktok" | "twitter" | "linkedin"
```

Khi thêm platform mới → update type này + `PLATFORMS` array + implement `IScraper`.

## TagSlug — 15 tags cố định

```typescript
type TagSlug =
  | "thu-nhap-thu-dong"
  | "tu-do-tai-chinh"
  | "x2-x3-thu-nhap"
  | "personal-brand"
  | "content-viral"
  | "dong-tien"
  | "kiem-tien-online"
  | "xay-kenh"
  | "thu-nhap-cao"
  | "cau-chuyen-thuong-hieu"
  | "loi-chao-hang"
  | "viral-trieu-view"
  | "quay-video"
  | "fanpage"
  | "followers"
```

Tags này khớp với seed data trong `packages/database/migrations/0001_init_seed.sql`.

## AI Output Validation

```typescript
// Type guard — validate raw JSON từ Workers AI
isValidAIOutput(value: unknown): value is AIAnalyzeRawOutput

// Convert raw → clean AIAnalysisResult
toAnalysisResult(raw: AIAnalyzeRawOutput): AIAnalysisResult
```

Dùng trong `workers/scraper/src/pipeline/analyzer.ts`.

## Cách dùng đúng

```typescript
// ✅ Import type — verbatimModuleSyntax bắt buộc
import type { RawPost, Platform } from "@viral-scout/types"

// ✅ Import value (functions, constants)
import { isValidAIOutput, toAnalysisResult, PLATFORMS } from "@viral-scout/types"

// ❌ Không import cả * nếu chỉ cần 1 vài types
import * as Types from "@viral-scout/types" // Tránh
```
