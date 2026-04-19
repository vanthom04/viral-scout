# workers/scheduler — CLAUDE.md

Cloudflare Worker chạy như **Cron trigger** — đọc active sources từ D1, enqueue `ScraperJob` vào `scraper-queue` cho `workers/scraper` consume.

## Entry Point

`src/index.ts`:

```typescript
export default {
  async scheduled(_event, env, ctx): Promise<void> {
    ctx.waitUntil(fanOutJobs(env))
  }
} satisfies ExportedHandler<CloudflareEnv>
```

`ctx.waitUntil()` quan trọng — đảm bảo async work hoàn thành sau khi event handler return.

## Cron Schedule

```jsonc
// wrangler.jsonc
"triggers": { "crons": ["0 */2 * * *"] }  // Mỗi 2 giờ
```

Thay đổi schedule → update `wrangler.jsonc` và redeploy.

## Fan-out Pattern

```typescript
const sources = await getActiveSources(db) // Chỉ sources isActive = true
await env.SCRAPER_QUEUE.sendBatch(
  sources.map((source) => ({ body: { sourceId, platform, targetId, triggeredAt } }))
)
```

Mỗi source trở thành 1 Queue message độc lập — scraper consumer xử lý song song.

## Thêm/tắt source

Source được quản lý trong bảng `sources` của D1:

- Thêm source mới: INSERT vào bảng `sources` (hoặc qua Monitor UI)
- Tắt source: `toggleSourceActive(db, sourceId, false)` — set `is_active = false`
- Schedule riêng cho từng source được lưu trong `cron_schedule` column nhưng hiện tại scheduler chạy tất cả active sources theo cùng 1 cron

## Debug

```bash
# Trigger manually (local)
cd workers/scheduler && wrangler dev
# Dùng Wrangler UI hoặc curl để trigger scheduled event

# Deploy
wrangler deploy

# Xem logs
wrangler tail --name viral-scout-scheduler
```
