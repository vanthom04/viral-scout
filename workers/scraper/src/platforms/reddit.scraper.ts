import type { ScraperResult, RawScrapedItem, CloudflareEnv } from "@viral-scout/types"
import type { IScraper } from "./scraper.interface"

import { calcTotalEngagement } from "./scraper.interface"

// Reddit OAuth token response
interface RedditTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
}

// Reddit listing response (gốc từ API)
interface RedditPost {
  data: {
    id: string
    title: string
    selftext: string
    author: string
    url: string
    permalink: string
    score: number // upvotes
    num_comments: number
    created_utc: number
    ups: number
    downs: number
    view_count: number | null
  }
}

interface RedditListingResponse {
  data: {
    children: RedditPost[]
  }
}

const REDDIT_BASE = "https://oauth.reddit.com"
const TOKEN_URL = "https://www.reddit.com/api/v1/access_token"
const USER_AGENT = "viral-scout/1.0 (by /u/viral_scout_bot)"

export class RedditScraper implements IScraper {
  readonly platform = "reddit"

  // Lấy access token qua client_credentials flow
  private async getAccessToken(env: CloudflareEnv): Promise<string> {
    const credentials = btoa(`${env.REDDIT_CLIENT_ID}:${env.REDDIT_CLIENT_SECRET}`)

    const res = await fetch(TOKEN_URL, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": USER_AGENT
      },
      body: "grant_type=client_credentials"
    })

    if (!res.ok) {
      throw new Error(`Reddit auth failed: ${res.status} ${res.statusText}`)
    }

    const data = (await res.json()) as RedditTokenResponse
    return data.access_token
  }

  async scrape(
    targetId: string, // subreddit slug, e.g. "personalfinance"
    env: CloudflareEnv
  ): Promise<ScraperResult> {
    try {
      const token = await this.getAccessToken(env)

      // Lấy top 25 bài "hot" trong 24h
      const url = `${REDDIT_BASE}/r/${targetId}/hot.json?limit=25&t=day`

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "User-Agent": USER_AGENT
        }
      })

      if (res.status === 429) {
        return { success: false, error: "Rate limited by Reddit", retryable: true }
      }

      if (!res.ok) {
        return {
          success: false,
          error: `Reddit API error: ${res.status}`,
          retryable: res.status >= 500
        }
      }

      const listing = (await res.json()) as RedditListingResponse
      const children = listing.data.children

      const items: RawScrapedItem[] = children
        // Lọc bỏ pinned posts và posts không có text
        .filter((child) => child.data.title.length > 10)
        .map((child): RawScrapedItem => {
          const post = child.data
          const likes = post.ups
          const comments = post.num_comments
          const shares = 0 // Reddit không expose share count
          const views = post.view_count ?? 0

          return {
            externalId: `reddit:${post.id}`,
            platform: "reddit",
            sourceId: targetId,
            url: `https://reddit.com${post.permalink}`,
            title: post.title,
            body: post.selftext.slice(0, 2000), // Giới hạn body
            authorHandle: post.author,
            publishedAt: new Date(post.created_utc * 1000).toISOString(),
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
                platform: "reddit"
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
