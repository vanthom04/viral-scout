// Cloudflare Worker bindings — single source of truth
// Import type này ở apps/web, workers/scraper, workers/scheduler

export interface CloudflareEnv {
  // D1 Database
  DB: D1Database

  // Workers AI
  AI: Ai

  // Queues
  SCRAPER_QUEUE: Queue

  // Auth
  BETTER_AUTH_SECRET: string
  BETTER_AUTH_URL: string

  // YouTube
  YOUTUBE_API_KEY: string

  // TikTok Research API (OAuth2 client credentials)
  TIKTOK_CLIENT_KEY: string
  TIKTOK_CLIENT_SECRET: string

  // Optional platforms (chưa có key hoặc bị hạn chế)
  REDDIT_CLIENT_ID?: string
  REDDIT_CLIENT_SECRET?: string
  TWITTER_BEARER_TOKEN?: string
  FACEBOOK_ACCESS_TOKEN?: string
}
