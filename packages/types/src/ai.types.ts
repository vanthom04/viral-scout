import type { ContentType, TagSlug, AIAnalysisResult } from "./post.types"

// Input gửi vào AI analyzer
export interface AIAnalyzeInput {
  title: string
  body: string
  platform: string
  engagementStats: {
    likes: number
    comments: number
    shares: number
    views: number
    totalEngagement: number
  }
}

// Raw JSON Workers AI trả về (trước khi parse/validate)
export interface AIAnalyzeRawOutput {
  virality_score: number
  content_type: ContentType
  hook_angles: string[]
  script_outline: string | null
  suggested_tags: TagSlug[]
  reasoning: string
}

// Kết quả gen idea từ Idea Generator page
export interface GeneratedIdea {
  hook: string // Câu mở đầu thu hút
  outline: string[] // Các phần chính của video/bài
  caption: string // Caption cho social media
  cta: string // Call to action
  thumbnailIdea: string // Gợi ý thumbnail
  hashtags: string[]
}

// Type guard để validate raw AI output
export const isValidAIOutput = (value: unknown): value is AIAnalyzeRawOutput => {
  if (typeof value !== "object" || value === null) return false
  const v = value as Record<string, unknown>
  return (
    typeof v.virality_score === "number" &&
    v.virality_score >= 1 &&
    v.virality_score <= 10 &&
    typeof v.content_type === "string" &&
    Array.isArray(v.hook_angles) &&
    Array.isArray(v.suggested_tags)
  )
}

// Convert raw AI output → AIAnalysisResult
export const toAnalysisResult = (raw: AIAnalyzeRawOutput): AIAnalysisResult => ({
  viralityScore: Math.round(raw.virality_score * 10) / 10,
  contentType: raw.content_type,
  hookAngles: raw.hook_angles.slice(0, 3),
  scriptOutline: raw.virality_score >= 7 ? raw.script_outline : null,
  suggestedTags: raw.suggested_tags,
  reasoning: raw.reasoning
})
