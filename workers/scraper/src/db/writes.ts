import { nanoid } from "nanoid"

import type { NewCronLog } from "@viral-scout/database"
import type { CloudflareEnv, AIAnalysisResult } from "@viral-scout/types"
import {
  drizzle,
  getAllTags,
  insertPostTags,
  insertCronLog,
  upsertAnalyzedPost
} from "@viral-scout/database"

import * as schema from "@viral-scout/database"

// Lưu kết quả AI vào analyzed_posts + post_tags
export const saveAnalysis = async (
  env: CloudflareEnv,
  postId: string,
  result: AIAnalysisResult
): Promise<void> => {
  const db = drizzle(env.DB, { schema })

  // 1. Upsert analyzed_posts
  await upsertAnalyzedPost(db, {
    id: nanoid(),
    postId,
    viralityScore: result.viralityScore,
    contentType: result.contentType,
    hookAngles: JSON.stringify(result.hookAngles),
    scriptOutline: result.scriptOutline,
    reasoning: result.reasoning,
    analyzedAt: new Date().toISOString()
  })

  // 2. Map tag slugs → tag IDs từ DB
  if (result.suggestedTags.length === 0) return

  const allTags = await getAllTags(db)
  const tagIds = result.suggestedTags
    .map((slug) => allTags.find((t) => t.slug === slug)?.id)
    .filter((id): id is string => id !== undefined)

  await insertPostTags(db, postId, tagIds)
}

// Ghi cron log sau mỗi lần scraper chạy xong
export const logCronRun = async (
  env: CloudflareEnv,
  data: Omit<NewCronLog, "id">
): Promise<void> => {
  const db = drizzle(env.DB, { schema })
  await insertCronLog(db, { id: nanoid(), ...data })
}
