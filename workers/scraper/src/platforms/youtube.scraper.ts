import type { IScraper } from "./scraper.interface"
import type { ScraperResult, RawScrapedItem, CloudflareEnv } from "@viral-scout/types"
import { calcTotalEngagement } from "./scraper.interface"

const YT_BASE = "https://www.googleapis.com/youtube/v3"

interface YouTubeSearchItem {
  id: { videoId: string }
  snippet: {
    title: string
    description: string
    channelTitle: string
    publishedAt: string
  }
}

interface YouTubeSearchResponse {
  items: YouTubeSearchItem[]
}

interface YouTubeVideoStats {
  id: string
  statistics: {
    viewCount: string
    likeCount: string
    commentCount: string
  }
}

interface YouTubeStatsResponse {
  items: YouTubeVideoStats[]
}

export class YouTubeScraper implements IScraper {
  readonly platform = "youtube"

  // targetId: keyword hoặc channel ID tuỳ config source
  async scrape(targetId: string, env: CloudflareEnv): Promise<ScraperResult> {
    try {
      const apiKey = env.YOUTUBE_API_KEY

      // Tìm videos theo keyword, published trong 48h
      const publishedAfter = new Date(Date.now() - 48 * 3_600_000).toISOString()

      const searchUrl = new URL(`${YT_BASE}/search`)
      searchUrl.searchParams.set("part", "snippet")
      searchUrl.searchParams.set("q", targetId)
      searchUrl.searchParams.set("type", "video")
      searchUrl.searchParams.set("order", "viewCount")
      searchUrl.searchParams.set("publishedAfter", publishedAfter)
      searchUrl.searchParams.set("maxResults", "20")
      searchUrl.searchParams.set("relevanceLanguage", "vi")
      searchUrl.searchParams.set("key", apiKey)

      const searchRes = await fetch(searchUrl.toString())
      if (searchRes.status === 429) {
        return { success: false, error: "YouTube API quota exceeded", retryable: false }
      }
      if (!searchRes.ok) {
        return {
          success: false,
          error: `YouTube search failed: ${searchRes.status}`,
          retryable: searchRes.status >= 500
        }
      }

      const searchData = (await searchRes.json()) as YouTubeSearchResponse
      const videoIds = searchData.items.map((i) => i.id.videoId).join(",")

      if (!videoIds) return { success: true, items: [] }

      // Lấy statistics cho tất cả videos trong 1 request
      const statsUrl = new URL(`${YT_BASE}/videos`)
      statsUrl.searchParams.set("part", "statistics")
      statsUrl.searchParams.set("id", videoIds)
      statsUrl.searchParams.set("key", apiKey)

      const statsRes = await fetch(statsUrl.toString())
      const statsData = (await statsRes.json()) as YouTubeStatsResponse
      const statsMap = new Map(statsData.items.map((s) => [s.id, s.statistics]))

      const items: RawScrapedItem[] = searchData.items.map((item): RawScrapedItem => {
        const stats = statsMap.get(item.id.videoId)
        const views = parseInt(stats?.viewCount ?? "0", 10)
        const likes = parseInt(stats?.likeCount ?? "0", 10)
        const comments = parseInt(stats?.commentCount ?? "0", 10)

        return {
          externalId: `youtube:${item.id.videoId}`,
          platform: "youtube",
          sourceId: targetId,
          url: `https://youtube.com/watch?v=${item.id.videoId}`,
          title: item.snippet.title,
          body: item.snippet.description.slice(0, 1000),
          authorHandle: item.snippet.channelTitle,
          publishedAt: item.snippet.publishedAt,
          engagementStats: {
            likes,
            comments,
            shares: 0, // YouTube không expose share count
            views,
            totalEngagement: calcTotalEngagement({
              likes,
              comments,
              shares: 0,
              views,
              platform: "youtube"
            })
          },
          rawJson: item as unknown as Record<string, unknown>
        }
      })

      return { success: true, items }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error"
      return { success: false, error: message, retryable: false }
    }
  }
}
