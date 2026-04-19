// Danh sách platforms được hỗ trợ
export type Platform = "reddit" | "youtube" | "facebook" | "tiktok" | "twitter" | "linkedin"

export const PLATFORMS: Platform[] = [
  "reddit",
  "youtube",
  "facebook",
  "tiktok",
  "twitter",
  "linkedin"
]

// Metadata của 1 source (lưu trong bảng sources)
export interface Source {
  id: string
  platform: Platform
  name: string
  // Ví dụ: subreddit slug, YouTube channel ID, FB group ID...
  targetId: string
  cronSchedule: string // "0 */2 * * *"
  isActive: boolean
  createdAt: string
}

// Job được enqueue vào Scraper Queue
export interface ScraperJob {
  sourceId: string
  platform: Platform
  targetId: string
  triggeredAt: string // ISO string
}

// Kết quả từ mỗi scraper trước khi normalize
export interface RawScrapedItem {
  externalId: string // ID gốc trên platform
  platform: Platform
  sourceId: string
  url: string
  title: string
  body: string
  authorHandle: string
  publishedAt: string // ISO string
  engagementStats: EngagementStats
  rawJson: Record<string, unknown> // Toàn bộ payload gốc
}

export interface EngagementStats {
  likes: number
  comments: number
  shares: number
  views: number
  // Tổng hợp — dùng để tính virality score thô
  totalEngagement: number
}

export type ScraperResult =
  | { success: true; items: RawScrapedItem[] }
  | { success: false; error: string; retryable: boolean }
