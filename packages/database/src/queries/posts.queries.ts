import type { DrizzleD1Database } from "drizzle-orm/d1"
import { eq, desc, gte, and, inArray, sql } from "drizzle-orm"

import type * as schema from "../schema"
import { posts, analyzedPosts } from "../schema"

type DB = DrizzleD1Database<typeof schema>

export interface GetViralPostsOptions {
  platforms?: string[]
  tagIds?: string[]
  minVirality?: number
  dateFrom?: string // ISO string
  limit?: number
  offset?: number
}

// Lấy danh sách bài đã analyze, sort theo virality
export const getViralPosts = async (db: DB, opts: GetViralPostsOptions = {}) => {
  const { platforms, minVirality = 5, dateFrom, limit = 20, offset = 0 } = opts

  const conditions = [gte(analyzedPosts.viralityScore, minVirality)]

  if (platforms && platforms.length > 0) {
    conditions.push(inArray(posts.platform, platforms as schema.Post["platform"][]))
  }

  if (dateFrom) {
    conditions.push(gte(posts.publishedAt, dateFrom))
  }

  return db
    .select({
      // posts
      postId: posts.id,
      platform: posts.platform,
      url: posts.url,
      title: posts.title,
      body: posts.body,
      authorHandle: posts.authorHandle,
      publishedAt: posts.publishedAt,
      totalEngagement: posts.totalEngagement,
      likesCount: posts.likesCount,
      commentsCount: posts.commentsCount,
      sharesCount: posts.sharesCount,
      viewsCount: posts.viewsCount,
      // analyzed_posts
      viralityScore: analyzedPosts.viralityScore,
      contentType: analyzedPosts.contentType,
      hookAngles: analyzedPosts.hookAngles,
      scriptOutline: analyzedPosts.scriptOutline,
      reasoning: analyzedPosts.reasoning,
      analyzedAt: analyzedPosts.analyzedAt
    })
    .from(analyzedPosts)
    .innerJoin(posts, eq(analyzedPosts.postId, posts.id))
    .where(and(...conditions))
    .orderBy(desc(analyzedPosts.viralityScore), desc(posts.publishedAt))
    .limit(limit)
    .offset(offset)
}

// Lấy 1 post theo ID (cho idea generator)
export const getPostById = async (db: DB, postId: string) =>
  db
    .select()
    .from(posts)
    .innerJoin(analyzedPosts, eq(analyzedPosts.postId, posts.id))
    .where(eq(posts.id, postId))
    .get()

// Dedup check — kiểm tra post đã tồn tại chưa
export const postExistsByExternalId = async (
  db: DB,
  platform: string,
  externalId: string
): Promise<boolean> => {
  const result = await db
    .select({ id: posts.id })
    .from(posts)
    .where(
      and(eq(posts.platform, platform as schema.Post["platform"]), eq(posts.externalId, externalId))
    )
    .get()

  return result !== undefined
}

// Insert post mới
export const insertPost = async (db: DB, data: schema.NewPost) =>
  db.insert(posts).values(data).returning({ id: posts.id }).get()

// Insert analyzed post
export const upsertAnalyzedPost = async (db: DB, data: schema.NewAnalyzedPost) =>
  db
    .insert(analyzedPosts)
    .values(data)
    .onConflictDoUpdate({
      target: analyzedPosts.postId,
      set: {
        viralityScore: data.viralityScore,
        contentType: data.contentType,
        hookAngles: data.hookAngles,
        scriptOutline: data.scriptOutline,
        reasoning: data.reasoning,
        analyzedAt: sql`(datetime('now'))`
      }
    })

// Analytics: thống kê theo ngày
export const getViralityStats = async (db: DB) =>
  db
    .select({
      platform: posts.platform,
      avgScore: sql<number>`avg(${analyzedPosts.viralityScore})`,
      totalPosts: sql<number>`count(*)`,
      hotPosts: sql<number>`count(case when ${analyzedPosts.viralityScore} >= 8 then 1 end)`
    })
    .from(analyzedPosts)
    .innerJoin(posts, eq(analyzedPosts.postId, posts.id))
    .groupBy(posts.platform)
