import { drizzle } from "@viral-scout/database"
import { getActiveSources } from "@viral-scout/database"
import type { CloudflareEnv } from "@viral-scout/types"
import * as schema from "@viral-scout/database"

// Fan-out scraper jobs từ cron trigger vào Queue
const fanOutScraperJobs = async (env: CloudflareEnv): Promise<void> => {
  const db = drizzle(env.DB, { schema })
  const sources = await getActiveSources(db)

  if (sources.length === 0) return

  await env.SCRAPER_QUEUE.sendBatch(
    sources.map((source) => ({
      body: {
        sourceId: source.id,
        platform: source.platform,
        targetId: source.targetId,
        triggeredAt: new Date().toISOString()
      }
    }))
  )

  console.info(`[cron] Enqueued ${sources.length} scraper jobs`)
}

export default {
  async scheduled(_event, env, ctx): Promise<void> {
    ctx.waitUntil(fanOutScraperJobs(env))
  }
} satisfies ExportedHandler<CloudflareEnv>
