# Scraper Development Guide

## IScraper Interface

Mọi scraper phải implement interface này:

```typescript
interface IScraper {
  readonly platform: string // phải khớp với Platform type
  scrape(targetId: string, env: CloudflareEnv): Promise<ScraperResult>
}

type ScraperResult =
  | { success: true; items: RawScrapedItem[] }
  | { success: false; error: string; retryable: boolean }
```

## RawScrapedItem — Output chuẩn

```typescript
interface RawScrapedItem {
  externalId: string // "{platform}:{nativeId}" e.g. "reddit:abc123"
  platform: Platform
  sourceId: string // ID trong bảng sources
  url: string // URL gốc để user xem
  title: string // Tiêu đề / nội dung đầu
  body: string // Nội dung đầy đủ (max 2000 chars)
  authorHandle: string // Username/handle
  publishedAt: string // ISO 8601
  engagementStats: EngagementStats
  rawJson: Record<string, unknown> // Raw API response (debug)
}

interface EngagementStats {
  likes: number
  comments: number
  shares: number
  views: number
  totalEngagement: number // Dùng calcTotalEngagement() để tính
}
```

## calcTotalEngagement — Tính điểm engagement

```typescript
import { calcTotalEngagement } from "./scraper.interface"

const totalEngagement = calcTotalEngagement({
  likes,
  comments,
  shares,
  views,
  platform: "reddit"
})
```

Mỗi platform có trọng số khác nhau — comments và shares giá trị hơn views:

| Platform | likes | comments | shares | views |
| -------- | ----- | -------- | ------ | ----- |
| reddit   | 1     | 3        | 2      | 0.01  |
| youtube  | 1     | 5        | 3      | 0.001 |
| facebook | 1     | 4        | 5      | 0.005 |
| tiktok   | 0.5   | 3        | 4      | 0.002 |
| twitter  | 1     | 3        | 5      | 0.01  |
| linkedin | 1     | 5        | 4      | 0.01  |

## Template scraper mới

```typescript
// workers/scraper/src/platforms/linkedin.scraper.ts
import type { IScraper } from "./scraper.interface"
import type { ScraperResult, RawScrapedItem, CloudflareEnv } from "@viral-scout/types"
import { calcTotalEngagement } from "./scraper.interface"

export class LinkedInScraper implements IScraper {
  readonly platform = "linkedin"

  async scrape(targetId: string, env: CloudflareEnv): Promise<ScraperResult> {
    try {
      // 1. Gọi API
      const res = await fetch("https://api.proxycurl.com/...", {
        headers: { Authorization: `Bearer ${env.PROXYCURL_API_KEY}` }
      })

      // 2. Handle rate limit
      if (res.status === 429) {
        return { success: false, error: "Rate limited", retryable: true }
      }

      // 3. Handle errors
      if (!res.ok) {
        return {
          success: false,
          error: `API error: ${res.status}`,
          retryable: res.status >= 500
        }
      }

      const data = (await res.json()) as YourApiType

      // 4. Map → RawScrapedItem[]
      const items: RawScrapedItem[] = data.posts.map(
        (post): RawScrapedItem => ({
          externalId: `linkedin:${post.id}`,
          platform: "linkedin",
          sourceId: targetId,
          url: post.url,
          title: post.text.slice(0, 280),
          body: post.text,
          authorHandle: post.author,
          publishedAt: post.createdAt,
          engagementStats: {
            likes: post.likes,
            comments: post.comments,
            shares: post.shares,
            views: post.views,
            totalEngagement: calcTotalEngagement({
              likes: post.likes,
              comments: post.comments,
              shares: post.shares,
              views: post.views,
              platform: "linkedin"
            })
          },
          rawJson: post as unknown as Record<string, unknown>
        })
      )

      return { success: true, items }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        retryable: false
      }
    }
  }
}
```

## Checklist khi thêm scraper mới

- [ ] Tạo file `{platform}.scraper.ts` trong `src/platforms/`
- [ ] Implement `IScraper` đầy đủ
- [ ] Handle `429 Too Many Requests` → `retryable: true`
- [ ] Handle `5xx errors` → `retryable: true`
- [ ] Handle `4xx errors` → `retryable: false`
- [ ] `externalId` format: `"{platform}:{nativeId}"`
- [ ] `body` truncate ở 2000 chars
- [ ] Dùng `calcTotalEngagement()` để tính engagement
- [ ] Đăng ký vào `SCRAPERS` registry trong `src/index.ts`
- [ ] Thêm API key vào `CloudflareEnv` trong `packages/types/src/env.types.ts`
- [ ] Thêm secret vào `wrangler secret put`
- [ ] Thêm source vào D1 (`INSERT INTO sources ...`)

## Rate Limits Reference

| Platform             | Limit                     | Strategy                                     |
| -------------------- | ------------------------- | -------------------------------------------- |
| Reddit               | 100 req/min               | OAuth app token — tự renew                   |
| YouTube Data API v3  | 10,000 units/day          | 1 search = 100 units, 1 video stats = 1 unit |
| Twitter API v2       | 500k tweets/month (Basic) | Filter `min_faves:10` giảm noise             |
| TikTok Research API  | 1000 req/day              | Cache token, batch query                     |
| Facebook Graph API   | 200 calls/user/hour       | Rate limit header `X-App-Usage`              |
| Proxycurl (LinkedIn) | Pay per request           | Expensive — batch carefully                  |

## Virality Score Calibration

AI analyzer dùng engagement stats + title/body để tính virality 1-10:

| Score | Ý nghĩa                                          | Ví dụ                                                            |
| ----- | ------------------------------------------------ | ---------------------------------------------------------------- |
| 9-10  | Hook cực mạnh, proof rõ ràng, tranh cãi tích cực | "Tôi từ bỏ 80tr/tháng để làm content — đây là kết quả sau 1 năm" |
| 7-8   | Angle rõ, list format, số liệu cụ thể            | "5 lỗi sai khi xây personal brand"                               |
| 5-6   | Nội dung OK nhưng thiếu hook hoặc proof          | Generic tips post                                                |
| 1-4   | Off-topic hoặc generic quá                       | "Chào mọi người hôm nay mình share..."                           |

Bài không liên quan finance/content/kiếm tiền → score 1-2 (classifier lọc trước khi đến 70b).
