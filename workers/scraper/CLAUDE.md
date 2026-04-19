# workers/scraper — CLAUDE.md

Cloudflare Worker chạy như **Queue consumer** — nhận `ScraperJob` từ `scraper-queue`, cào data từ platform API, analyze bằng Workers AI, lưu vào D1.

## Entry Point

`src/index.ts` — export default với `queue` handler:

```typescript
export default {
  async queue(batch: MessageBatch<ScraperJob>, env: CloudflareEnv): Promise<void> {
    for (const message of batch.messages) {
      try {
        await processJob(message.body, env)
        message.ack()
      } catch {
        message.retry() // Queue tự retry với exponential backoff
      }
    }
  }
} satisfies ExportedHandler<CloudflareEnv, never, ScraperJob>
```

## Pipeline Flow (mỗi job)

```
ScraperJob { sourceId, platform, targetId }
  → SCRAPERS[platform].scrape(targetId, env)   ← IScraper
    → isRelevantPost(title, env)               ← llama-3.1-8b (classifier)
      → deduplicateAndInsert(item, sourceId)   ← check D1, insert post
        → analyzePost(item, env)               ← llama-3.3-70b (analyzer)
          → saveAnalysis(postId, result)        ← upsert analyzed_posts + post_tags
            → logCronRun(...)                   ← ghi cron_logs
```

## Scrapers đã implement

| Platform  | File                  | API                                                   |
| --------- | --------------------- | ----------------------------------------------------- |
| Reddit    | `reddit.scraper.ts`   | OAuth2 client_credentials + `/r/{subreddit}/hot.json` |
| YouTube   | `youtube.scraper.ts`  | YouTube Data API v3 — search + statistics             |
| Twitter/X | `twitter.scraper.ts`  | Twitter API v2 Bearer token — search/recent           |
| TikTok    | `tiktok.scraper.ts`   | TikTok Research API v2 — video/query                  |
| Facebook  | `facebook.scraper.ts` | Graph API v21.0 — page/group feed                     |
| LinkedIn  | _(chưa implement)_    | Proxycurl API                                         |

## Thêm scraper mới

1. Tạo `src/platforms/{platform}.scraper.ts` implement `IScraper`:

```typescript
export class LinkedInScraper implements IScraper {
  readonly platform = "linkedin"
  async scrape(targetId: string, env: CloudflareEnv): Promise<ScraperResult> {
    // ...
  }
}
```

2. Đăng ký vào `SCRAPERS` registry trong `src/index.ts`:

```typescript
const SCRAPERS: ScraperRegistry = {
  linkedin: new LinkedInScraper()
  // ...
}
```

3. Thêm API key vào `CloudflareEnv` trong `packages/types/src/env.types.ts`

4. Thêm secret: `wrangler secret put PROXYCURL_API_KEY --name viral-scout-scraper`

## IScraper Contract

```typescript
interface IScraper {
  readonly platform: string
  scrape(targetId: string, env: CloudflareEnv): Promise<ScraperResult>
}

type ScraperResult =
  | { success: true; items: RawScrapedItem[] }
  | { success: false; error: string; retryable: boolean }
```

`retryable: true` → Queue sẽ retry message. `retryable: false` → discard, ghi log lỗi.

## AI Models

| Model                                      | Dùng cho                                           | File                   |
| ------------------------------------------ | -------------------------------------------------- | ---------------------- |
| `@cf/meta/llama-3.1-8b-instruct`           | Classifier — lọc off-topic trước (tiết kiệm token) | `pipeline/analyzer.ts` |
| `@cf/meta/llama-3.3-70b-instruct-fp8-fast` | Analyzer — virality score + hooks đầy đủ           | `pipeline/analyzer.ts` |

Classifier chạy trước: nếu bài không liên quan (return `"no"`) thì skip, không gọi 70b.

## Dedup Logic

```typescript
// pipeline/normalizer.ts
const exists = await postExistsByExternalId(db, platform, externalId)
if (exists) return null // skip, không insert
```

`externalId` format: `"{platform}:{nativeId}"` — e.g. `"reddit:abc123"`, `"youtube:dQw4w9WgXcQ"`

## Wrangler Config

```jsonc
// wrangler.jsonc
{
  "queues": {
    "consumers": [
      {
        "queue": "scraper-queue",
        "max_batch_size": 10, // Xử lý 10 jobs/batch
        "max_batch_timeout": 30, // Timeout 30s
        "max_retries": 3, // Retry 3 lần trước khi vào DLQ
        "dead_letter_queue": "scraper-dlq"
      }
    ]
  }
}
```

## Debug

```bash
# Chạy local
cd workers/scraper && wrangler dev

# Test queue bằng cách gửi message thủ công
wrangler queues send scraper-queue '{"sourceId":"src_reddit_pf","platform":"reddit","targetId":"personalfinance","triggeredAt":"2025-04-18T00:00:00Z"}'

# Xem logs
wrangler tail --name viral-scout-scraper
```
