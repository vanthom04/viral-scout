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
  AUTH_SECRET: string
  NEXTAUTH_URL: string

  // Platform API Keys
  REDDIT_CLIENT_ID: string
  REDDIT_CLIENT_SECRET: string
  YOUTUBE_API_KEY: string
  TWITTER_BEARER_TOKEN: string
  TIKTOK_API_KEY: string
  PROXYCURL_API_KEY: string // LinkedIn

  // Optional: Facebook Graph API
  FACEBOOK_ACCESS_TOKEN?: string
}
