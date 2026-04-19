import { nanoid } from "nanoid"

import type { NewPost } from "@viral-scout/database"
import type { RawScrapedItem, CloudflareEnv } from "@viral-scout/types"

import { drizzle, postExistsByExternalId, insertPost } from "@viral-scout/database"

import * as schema from "@viral-scout/database"

// Chuyển RawScrapedItem → NewPost (Drizzle insert type)
export const normalizePost = (item: RawScrapedItem, sourceId: string): NewPost => ({
  id: nanoid(),
  sourceId,
  platform: item.platform,
  externalId: item.externalId,
  url: item.url,
  title: item.title.trim(),
  body: item.body.trim(),
  authorHandle: item.authorHandle,
  publishedAt: item.publishedAt,
  likesCount: item.engagementStats.likes,
  commentsCount: item.engagementStats.comments,
  sharesCount: item.engagementStats.shares,
  viewsCount: item.engagementStats.views,
  totalEngagement: item.engagementStats.totalEngagement,
  scrapedAt: new Date().toISOString()
})

// Dedup + insert: trả về postId nếu insert thành công, null nếu đã tồn tại
export const deduplicateAndInsert = async (
  env: CloudflareEnv,
  item: RawScrapedItem,
  sourceId: string
): Promise<string | null> => {
  const db = drizzle(env.DB, { schema })

  const exists = await postExistsByExternalId(db, item.platform, item.externalId)

  if (exists) return null

  const newPost = normalizePost(item, sourceId)
  const inserted = await insertPost(db, newPost)

  return inserted?.id ?? null
}
