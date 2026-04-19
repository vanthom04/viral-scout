import type { ScraperResult } from "@viral-scout/types"
import type { CloudflareEnv } from "@viral-scout/types"

// Contract mà mọi platform scraper phải implement
export interface IScraper {
  readonly platform: string

  // Cào dữ liệu từ 1 source cụ thể
  scrape(targetId: string, env: CloudflareEnv): Promise<ScraperResult>
}

// Factory: map platform string → IScraper instance
// Được dùng trong queue consumer để dispatch đúng scraper
export type ScraperRegistry = Record<string, IScraper>

// Helper: tính totalEngagement từ các chỉ số riêng lẻ
// Mỗi platform có trọng số khác nhau
export const calcTotalEngagement = (stats: {
  likes: number
  comments: number
  shares: number
  views: number
  platform: string
}): number => {
  const { likes, comments, shares, views, platform } = stats

  // Comments và shares có giá trị cao hơn views
  const weights: Record<string, { l: number; c: number; s: number; v: number }> = {
    reddit: { l: 1, c: 3, s: 2, v: 0.01 },
    youtube: { l: 1, c: 5, s: 3, v: 0.001 },
    facebook: { l: 1, c: 4, s: 5, v: 0.005 },
    tiktok: { l: 0.5, c: 3, s: 4, v: 0.002 },
    twitter: { l: 1, c: 3, s: 5, v: 0.01 },
    linkedin: { l: 1, c: 5, s: 4, v: 0.01 }
  }

  const w = weights[platform] ?? { l: 1, c: 3, s: 2, v: 0.001 }

  return Math.round(likes * w.l + comments * w.c + shares * w.s + views * w.v)
}

// Helper: tạo externalId unique per platform
export const makeExternalId = (platform: string, rawId: string): string => `${platform}:${rawId}`
