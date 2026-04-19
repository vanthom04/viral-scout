# Architecture

## Tổng quan

Viral Scout dùng kiến trúc **event-driven** với Cloudflare Workers làm runtime duy nhất — không có server riêng, không có Docker, không có long-running processes.

## System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    Cloudflare Network                           │
│                                                                 │
│  ┌──────────────┐     ┌──────────────┐     ┌────────────────┐  │
│  │  Scheduler   │────▶│ scraper-queue│────▶│    Scraper     │  │
│  │  (Cron 2h)   │     │  (CF Queue)  │     │  (Consumer)    │  │
│  └──────────────┘     └──────────────┘     └───────┬────────┘  │
│                                                    │           │
│  ┌──────────────┐                          ┌───────▼────────┐  │
│  │   Next.js    │◀─────────────────────────│  Cloudflare D1 │  │
│  │  (OpenNext)  │                          │  (SQLite edge) │  │
│  └──────┬───────┘                          └───────▲────────┘  │
│         │                                          │           │
│  ┌──────▼───────┐                          ┌───────┴────────┐  │
│  │  Workers AI  │                          │  Workers AI    │  │
│  │ (Idea gen)   │                          │ (Analyze posts)│  │
│  └──────────────┘                          └────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
         ▲
         │ HTTPS
         │
    [Browser]
```

## Data Flow Chi Tiết

### 1. Scraping Pipeline (background, mỗi 2h)

```
Cron trigger (wrangler.jsonc)
  → workers/scheduler/src/index.ts: scheduled()
    → D1: SELECT * FROM sources WHERE is_active = true
      → SCRAPER_QUEUE.sendBatch([...ScraperJob])
        → workers/scraper/src/index.ts: queue()
          → For each message:
              1. SCRAPERS[platform].scrape(targetId, env)
                 → Platform API (Reddit/YouTube/Twitter/TikTok/Facebook)
              2. isRelevantPost(title) → llama-3.1-8b
                 → false: skip (postsSkipped++)
              3. postExistsByExternalId() → D1
                 → exists: skip dedup
              4. insertPost() → D1: posts table
              5. analyzePost() → llama-3.3-70b
                 → { viralityScore, contentType, hookAngles, suggestedTags, ... }
              6. saveAnalysis() → D1: analyzed_posts + post_tags
              7. logCronRun() → D1: cron_logs
```

### 2. Dashboard Read Path (per request)

```
Browser → apps/web (OpenNext Worker)
  → proxy.ts: check session cookie
    → /dashboard/* routes: Server Component
      → getDb() → getCloudflareContext({ async: true }) → env.DB
        → getViralPosts(db, filters) → D1: JOIN posts + analyzed_posts
          → render PostFeed với initialPosts
```

### 3. Idea Generator (streaming)

```
Browser: POST /api/generate-idea
  → apps/web: API route
    → getCloudflareContext() → env.AI
      → env.AI.run("llama-3.3-70b", { stream: true, messages })
        → ReadableStream (SSE)
          → Browser: EventSource / fetch ReadableStream reader
            → IdeaResultStream: append chunks realtime
```

## ADR — Architecture Decision Records

### ADR-001: Cloudflare Workers thay vì VPS

**Quyết định:** Dùng Cloudflare Workers + D1 + Queues thay vì VPS + PostgreSQL.

**Lý do:**

- Zero cold start, edge deployment toàn cầu
- D1 đủ cho ~10M rows với SQLite
- Queue có built-in retry, DLQ, backpressure
- Chi phí: Workers free tier + D1 $0.75/GB

**Trade-offs:**

- CPU time limit: 30s/request (scraping phải async qua Queue)
- D1 không support interactive transactions
- Bundle size limit: 10MB (Workers Paid)

### ADR-002: Drizzle ORM thay vì Prisma

**Quyết định:** Drizzle ORM với D1 dialect.

**Lý do:**

- Prisma engine binary không chạy được trên Workers
- Drizzle edge-compatible, bundle nhỏ hơn
- SQL-like syntax, dễ debug

### ADR-003: Better Auth thay vì NextAuth

**Quyết định:** Better Auth 1.5 với `disableSignUp: true`.

**Lý do:**

- NextAuth/Auth.js chưa hỗ trợ D1 native đến v5
- Better Auth 1.5 support D1 first-class
- `disableSignUp` built-in — không cần custom logic
- Singleton pattern hoạt động tốt với OpenNext async context

### ADR-004: Tách workers/scraper riêng khỏi apps/web

**Quyết định:** Scraper chạy như Worker riêng biệt thay vì trong Next.js app.

**Lý do:**

- Next.js Worker có CPU time limit chặt hơn cho request handling
- Scraper cần gọi nhiều API ngoài → latency cao → không phù hợp cho request path
- Queue consumer có thể scale độc lập
- Dễ deploy, debug, monitor từng worker riêng

### ADR-005: Workers AI thay vì Groq

**Quyết định:** Cloudflare Workers AI cho cả batch analysis và streaming.

**Lý do:**

- Cùng ecosystem với D1, Queue — billing chung, latency ~0ms
- Không cần API key riêng
- Batch analysis không cần tốc độ cao → Workers AI đủ
- Streaming idea generator hơi chậm hơn Groq nhưng acceptable cho UX

## Performance Considerations

| Bottleneck                     | Giải pháp                                                    |
| ------------------------------ | ------------------------------------------------------------ |
| Scraping 6 platforms đồng thời | Queue fan-out — mỗi source là 1 message độc lập              |
| AI analysis rate limit         | Classifier 8b lọc off-topic trước → giảm ~60% calls đến 70b  |
| D1 read latency                | Server Components fetch trực tiếp — không qua API route      |
| Dashboard load time            | `Promise.all` cho parallel queries, `Suspense` cho streaming |
| Bundle size                    | Dynamic imports cho Chart components, no barrel exports      |
