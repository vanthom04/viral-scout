import type { Platform, EngagementStats } from "./scraper.types"

// Loại nội dung AI phân loại
export type ContentType =
  | "story" // Câu chuyện cá nhân
  | "list" // Dạng liệt kê (5 cách, 3 lỗi...)
  | "proof" // Chứng minh kết quả (screenshot, số liệu)
  | "rant" // Quan điểm mạnh / tranh cãi
  | "how-to" // Hướng dẫn từng bước
  | "question" // Câu hỏi gây tương tác
  | "news" // Tin tức / sự kiện

// Taxonomy tags cố định (khớp với bảng tags trong DB)
export type TagSlug =
  | "thu-nhap-thu-dong"
  | "tu-do-tai-chinh"
  | "x2-x3-thu-nhap"
  | "personal-brand"
  | "content-viral"
  | "dong-tien"
  | "kiem-tien-online"
  | "xay-kenh"
  | "thu-nhap-cao"
  | "cau-chuyen-thuong-hieu"
  | "loi-chao-hang"
  | "quay-video"
  | "fanpage"
  | "followers"

// Post đã lưu vào bảng posts (raw — chưa AI)
export interface RawPost {
  id: string
  sourceId: string
  platform: Platform
  externalId: string
  url: string
  title: string
  body: string
  authorHandle: string
  publishedAt: string
  engagementStats: EngagementStats
  scrapedAt: string
}

// Kết quả phân tích từ Workers AI
export interface AIAnalysisResult {
  viralityScore: number // 1.0 – 10.0
  contentType: ContentType
  hookAngles: string[] // 3 góc khai thác content
  scriptOutline: string | null // Chỉ gen nếu viralityScore >= 7
  suggestedTags: TagSlug[]
  reasoning: string // Lý do AI cho điểm cao/thấp
}

// Post sau khi AI xử lý xong (join posts + analyzed_posts)
export interface AnalyzedPost extends RawPost {
  viralityScore: number
  contentType: ContentType
  hookAngles: string[]
  scriptOutline: string | null
  tags: TagSlug[]
  reasoning: string
  analyzedAt: string
}

// Filters cho trending feed
export interface PostFilters {
  platforms: Platform[]
  tags: TagSlug[]
  minVirality: number
  dateRange: "today" | "3d" | "7d" | "30d"
  contentType: ContentType | null
  sortBy: "virality" | "recent" | "engagement"
}
