import type { CloudflareEnv, ScraperJob } from "@viral-scout/types"
import type { IScraper, ScraperRegistry } from "./platforms/scraper.interface"

import { RedditScraper } from "./platforms/reddit.scraper"
import { YouTubeScraper } from "./platforms/youtube.scraper"
import { TwitterScraper } from "./platforms/twitter.scraper"
import { TikTokScraper } from "./platforms/tiktok.scraper"
import { FacebookScraper } from "./platforms/facebook.scraper"
import { deduplicateAndInsert } from "./pipeline/normalizer"
import { isRelevantPost, analyzePost } from "./pipeline/analyzer"
import { saveAnalysis, logCronRun } from "./db/writes"

// Registry: map platform → scraper instance
const SCRAPERS: ScraperRegistry = {
  reddit: new RedditScraper(),
  youtube: new YouTubeScraper(),
  twitter: new TwitterScraper(),
  tiktok: new TikTokScraper(),
  facebook: new FacebookScraper()
  // linkedin: new LinkedInScraper(), — thêm sau khi có Proxycurl API key
}

// Xử lý 1 scraper job từ Queue
const processJob = async (job: ScraperJob, env: CloudflareEnv): Promise<void> => {
  const startMs = Date.now()
  const scraper: IScraper | undefined = SCRAPERS[job.platform]

  if (!scraper) {
    console.warn(`[scraper] No scraper registered for platform: ${job.platform}`)
    return
  }

  console.info(`[scraper] Starting ${job.platform}:${job.targetId}`)

  let postsScraped = 0
  let postsAnalyzed = 0
  let postsSkipped = 0

  try {
    const result = await scraper.scrape(job.targetId, env)

    if (!result.success) {
      // Retry nếu retryable (Queue tự retry)
      if (result.retryable) throw new Error(result.error)

      await logCronRun(env, {
        sourceId: job.sourceId,
        status: "failed",
        postsScraped: 0,
        postsAnalyzed: 0,
        postsSkipped: 0,
        durationMs: Date.now() - startMs,
        errorMessage: result.error,
        runAt: new Date().toISOString()
      })
      return
    }

    postsScraped = result.items.length

    // Xử lý từng item qua pipeline: dedup → classify → analyze → save
    for (const item of result.items) {
      // 1. Classifier nhẹ — lọc off-topic (dùng llama-3.1-8b)
      const relevant = await isRelevantPost(env, item.title)
      if (!relevant) {
        postsSkipped++
        continue
      }

      // 2. Dedup + insert vào posts
      const postId = await deduplicateAndInsert(env, item, job.sourceId)
      if (!postId) {
        postsSkipped++
        continue
      }

      // 3. Phân tích bằng llama-3.3-70b
      const analysis = await analyzePost(env, {
        title: item.title,
        body: item.body,
        platform: item.platform,
        engagementStats: item.engagementStats
      })

      if (!analysis) continue

      // 4. Lưu kết quả AI + tags
      await saveAnalysis(env, postId, analysis)
      postsAnalyzed++
    }

    await logCronRun(env, {
      sourceId: job.sourceId,
      status: postsAnalyzed > 0 ? "success" : "partial",
      postsScraped,
      postsAnalyzed,
      postsSkipped,
      durationMs: Date.now() - startMs,
      errorMessage: undefined,
      runAt: new Date().toISOString()
    })

    console.info(
      `[scraper] Done ${job.platform}:${job.targetId} — scraped=${postsScraped} analyzed=${postsAnalyzed} skipped=${postsSkipped} time=${Date.now() - startMs}ms`
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    console.error(`[scraper] Failed ${job.platform}:${job.targetId}`, message)

    await logCronRun(env, {
      sourceId: job.sourceId,
      status: "failed",
      postsScraped,
      postsAnalyzed,
      postsSkipped,
      durationMs: Date.now() - startMs,
      errorMessage: message,
      runAt: new Date().toISOString()
    })

    // Re-throw để Queue biết cần retry
    throw error
  }
}

// Queue consumer export
export default {
  async queue(batch: MessageBatch<ScraperJob>, env: CloudflareEnv): Promise<void> {
    for (const message of batch.messages) {
      try {
        await processJob(message.body, env)
        message.ack()
      } catch {
        message.retry()
      }
    }
  }
} satisfies ExportedHandler<CloudflareEnv, never, ScraperJob>
