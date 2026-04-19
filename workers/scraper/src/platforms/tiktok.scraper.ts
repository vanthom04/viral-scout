import type { IScraper } from "./scraper.interface"
import type { ScraperResult, RawScrapedItem, CloudflareEnv } from "@viral-scout/types"
import { calcTotalEngagement } from "./scraper.interface"

const TIKTOK_BASE = "https://open.tiktokapis.com/v2"

interface TikTokVideo {
  id: string
  video_description: string
  create_time: number
  author_name: string
  like_count: number
  comment_count: number
  share_count: number
  view_count: number
  hashtag_names: string[]
}

interface TikTokSearchResponse {
  data?: {
    videos: TikTokVideo[]
    cursor: number
    has_more: boolean
    search_id: string
  }
  error?: { code: string; message: string }
}

// Lấy app access token từ TikTok Research API
const getAccessToken = async (apiKey: string): Promise<string | null> => {
  // TikTok Research API dùng API key trực tiếp làm Bearer token
  // Nếu dùng client credentials flow thì implement ở đây
  return apiKey
}

export class TikTokScraper implements IScraper {
  readonly platform = "tiktok"

  // targetId: hashtag slug, e.g. "thunhapthudong"
  async scrape(targetId: string, env: CloudflareEnv): Promise<ScraperResult> {
    try {
      const token = await getAccessToken(env.TIKTOK_API_KEY)
      if (!token) {
        return { success: false, error: "Cannot get TikTok access token", retryable: false }
      }

      // TikTok Research API — keyword search
      const res = await fetch(`${TIKTOK_BASE}/research/video/query/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          query: {
            and: [{ operation: "IN", field_name: "hashtag_name", field_values: [targetId] }]
          },
          start_date: new Date(Date.now() - 3 * 24 * 3_600_000)
            .toISOString()
            .split("T")[0]!
            .replace(/-/g, ""),
          end_date: new Date().toISOString().split("T")[0]!.replace(/-/g, ""),
          max_count: 20,
          fields: [
            "id",
            "video_description",
            "create_time",
            "author_name",
            "like_count",
            "comment_count",
            "share_count",
            "view_count",
            "hashtag_names"
          ]
        })
      })

      if (res.status === 429) {
        return { success: false, error: "TikTok rate limited", retryable: true }
      }
      if (!res.ok) {
        return {
          success: false,
          error: `TikTok API error: ${res.status}`,
          retryable: res.status >= 500
        }
      }

      const data = (await res.json()) as TikTokSearchResponse

      if (data.error || !data.data?.videos) {
        return {
          success: false,
          error: data.error?.message ?? "No videos returned",
          retryable: false
        }
      }

      const items: RawScrapedItem[] = data.data.videos.map((video): RawScrapedItem => {
        const {
          like_count: likes,
          comment_count: comments,
          share_count: shares,
          view_count: views
        } = video

        return {
          externalId: `tiktok:${video.id}`,
          platform: "tiktok",
          sourceId: targetId,
          url: `https://www.tiktok.com/@${video.author_name}/video/${video.id}`,
          title: video.video_description.slice(0, 300),
          body: video.hashtag_names.map((h) => `#${h}`).join(" "),
          authorHandle: video.author_name,
          publishedAt: new Date(video.create_time * 1000).toISOString(),
          engagementStats: {
            likes,
            comments,
            shares,
            views,
            totalEngagement: calcTotalEngagement({
              likes,
              comments,
              shares,
              views,
              platform: "tiktok"
            })
          },
          rawJson: video as unknown as Record<string, unknown>
        }
      })

      return { success: true, items }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error"
      return { success: false, error: message, retryable: false }
    }
  }
}
