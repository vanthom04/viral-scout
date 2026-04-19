import type { IScraper } from "./scraper.interface"
import type { ScraperResult, RawScrapedItem, CloudflareEnv } from "@viral-scout/types"
import { calcTotalEngagement } from "./scraper.interface"

const TWITTER_BASE = "https://api.twitter.com/2"

interface TwitterTweet {
  id: string
  text: string
  created_at: string
  author_id: string
  public_metrics: {
    like_count: number
    reply_count: number
    retweet_count: number
    impression_count: number
  }
}

interface TwitterUser {
  id: string
  username: string
}

interface TwitterSearchResponse {
  data?: TwitterTweet[]
  includes?: { users?: TwitterUser[] }
}

export class TwitterScraper implements IScraper {
  readonly platform = "twitter"

  // targetId: query string, e.g. "passive+income+OR+financial+freedom lang:vi"
  async scrape(targetId: string, env: CloudflareEnv): Promise<ScraperResult> {
    try {
      const query = decodeURIComponent(targetId)

      const url = new URL(`${TWITTER_BASE}/tweets/search/recent`)
      url.searchParams.set("query", `${query} -is:retweet lang:vi min_faves:10`)
      url.searchParams.set("max_results", "25")
      url.searchParams.set("tweet.fields", "created_at,author_id,public_metrics")
      url.searchParams.set("expansions", "author_id")
      url.searchParams.set("user.fields", "username")

      const res = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${env.TWITTER_BEARER_TOKEN}`
        }
      })

      if (res.status === 429) {
        return { success: false, error: "Twitter rate limited", retryable: true }
      }
      if (!res.ok) {
        return {
          success: false,
          error: `Twitter API error: ${res.status}`,
          retryable: res.status >= 500
        }
      }

      const data = (await res.json()) as TwitterSearchResponse
      if (!data.data || data.data.length === 0) {
        return { success: true, items: [] }
      }

      // Map author_id → username
      const userMap = new Map<string, string>(
        (data.includes?.users ?? []).map((u) => [u.id, u.username])
      )

      const items: RawScrapedItem[] = data.data.map((tweet): RawScrapedItem => {
        const m = tweet.public_metrics
        const likes = m.like_count
        const comments = m.reply_count
        const shares = m.retweet_count
        const views = m.impression_count

        return {
          externalId: `twitter:${tweet.id}`,
          platform: "twitter",
          sourceId: targetId,
          url: `https://x.com/i/web/status/${tweet.id}`,
          title: tweet.text.slice(0, 280),
          body: "",
          authorHandle: userMap.get(tweet.author_id) ?? tweet.author_id,
          publishedAt: tweet.created_at,
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
              platform: "twitter"
            })
          },
          rawJson: tweet as unknown as Record<string, unknown>
        }
      })

      return { success: true, items }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error"
      return { success: false, error: message, retryable: false }
    }
  }
}
