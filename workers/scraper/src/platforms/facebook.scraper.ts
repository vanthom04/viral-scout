import type { IScraper } from "./scraper.interface"
import type { ScraperResult, RawScrapedItem, CloudflareEnv } from "@viral-scout/types"
import { calcTotalEngagement } from "./scraper.interface"

const GRAPH_BASE = "https://graph.facebook.com/v21.0"

interface FacebookPost {
  id: string
  message?: string
  story?: string
  created_time: string
  from?: { name: string; id: string }
  reactions?: { summary: { total_count: number } }
  comments?: { summary: { total_count: number } }
  shares?: { count: number }
}

interface FacebookPostsResponse {
  data: FacebookPost[]
  paging?: { cursors: { after: string }; next?: string }
}

export class FacebookScraper implements IScraper {
  readonly platform = "facebook"

  // targetId: page/group ID, e.g. "kiemtienonline360"
  async scrape(targetId: string, env: CloudflareEnv): Promise<ScraperResult> {
    if (!env.FACEBOOK_ACCESS_TOKEN) {
      return { success: false, error: "FACEBOOK_ACCESS_TOKEN not configured", retryable: false }
    }

    try {
      const url = new URL(`${GRAPH_BASE}/${targetId}/feed`)
      url.searchParams.set(
        "fields",
        [
          "id",
          "message",
          "story",
          "created_time",
          "from",
          "reactions.summary(true)",
          "comments.summary(true)",
          "shares"
        ].join(",")
      )
      url.searchParams.set("limit", "25")
      url.searchParams.set("access_token", env.FACEBOOK_ACCESS_TOKEN)

      const res = await fetch(url.toString())

      if (res.status === 429) {
        return { success: false, error: "Facebook rate limited", retryable: true }
      }
      if (!res.ok) {
        return {
          success: false,
          error: `Facebook Graph API error: ${res.status}`,
          retryable: res.status >= 500
        }
      }

      const data = (await res.json()) as FacebookPostsResponse

      // Lọc posts không có message và quá cũ (>48h)
      const cutoff = Date.now() - 48 * 3_600_000
      const validPosts = data.data.filter(
        (p) => p.message && p.message.length > 20 && new Date(p.created_time).getTime() > cutoff
      )

      const items: RawScrapedItem[] = validPosts.map((post): RawScrapedItem => {
        const likes = post.reactions?.summary.total_count ?? 0
        const comments = post.comments?.summary.total_count ?? 0
        const shares = post.shares?.count ?? 0

        const text = post.message ?? post.story ?? ""

        return {
          externalId: `facebook:${post.id}`,
          platform: "facebook",
          sourceId: targetId,
          url: `https://facebook.com/${post.id.replace("_", "/posts/")}`,
          title: text.split("\n")[0]?.slice(0, 280) ?? "",
          body: text.slice(0, 1500),
          authorHandle: post.from?.name ?? targetId,
          publishedAt: new Date(post.created_time).toISOString(),
          engagementStats: {
            likes,
            comments,
            shares,
            views: 0, // Facebook không expose view count cho posts
            totalEngagement: calcTotalEngagement({
              likes,
              comments,
              shares,
              views: 0,
              platform: "facebook"
            })
          },
          rawJson: post as unknown as Record<string, unknown>
        }
      })

      return { success: true, items }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error"
      return { success: false, error: message, retryable: false }
    }
  }
}
