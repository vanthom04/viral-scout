import { sqliteTable, text, integer, real, index } from "drizzle-orm/sqlite-core"
import { sql } from "drizzle-orm"

// ─── sources ─────────────────────────────────────────────────────────────────
// Cấu hình từng nguồn cào dữ liệu (1 subreddit, 1 YT channel, ...)
export const sources = sqliteTable("sources", {
  id: text("id").primaryKey(),
  platform: text("platform", {
    enum: ["reddit", "youtube", "facebook", "tiktok", "twitter", "linkedin"]
  }).notNull(),
  name: text("name").notNull(),
  targetId: text("target_id").notNull(), // subreddit slug, channel ID...
  cronSchedule: text("cron_schedule").notNull(), // "0 */2 * * *"
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`)
})

// ─── posts ────────────────────────────────────────────────────────────────────
// Bài post raw đã cào về — chưa qua AI
export const posts = sqliteTable(
  "posts",
  {
    id: text("id").primaryKey(),
    sourceId: text("source_id")
      .notNull()
      .references(() => sources.id),
    platform: text("platform", {
      enum: ["reddit", "youtube", "facebook", "tiktok", "twitter", "linkedin"]
    }).notNull(),
    externalId: text("external_id").notNull(), // ID gốc trên platform
    url: text("url").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull().default(""),
    authorHandle: text("author_handle").notNull(),
    publishedAt: text("published_at").notNull(),
    // Engagement — lưu dạng JSON string
    likesCount: integer("likes_count").notNull().default(0),
    commentsCount: integer("comments_count").notNull().default(0),
    sharesCount: integer("shares_count").notNull().default(0),
    viewsCount: integer("views_count").notNull().default(0),
    totalEngagement: integer("total_engagement").notNull().default(0),
    scrapedAt: text("scraped_at")
      .notNull()
      .default(sql`(datetime('now'))`)
  },
  (t) => ({
    // Unique per platform để dedup
    platformExternalIdx: index("posts_platform_external_idx").on(t.platform, t.externalId),
    sourceIdx: index("posts_source_idx").on(t.sourceId),
    publishedIdx: index("posts_published_idx").on(t.publishedAt),
    engagementIdx: index("posts_engagement_idx").on(t.totalEngagement)
  })
)

// ─── analyzed_posts ───────────────────────────────────────────────────────────
// Kết quả Workers AI cho từng post
export const analyzedPosts = sqliteTable(
  "analyzed_posts",
  {
    id: text("id").primaryKey(),
    postId: text("post_id")
      .notNull()
      .references(() => posts.id)
      .unique(),
    viralityScore: real("virality_score").notNull(), // 1.0 – 10.0
    contentType: text("content_type", {
      enum: ["story", "list", "proof", "rant", "how-to", "question", "news"]
    }).notNull(),
    // JSON arrays — D1 không support array column native
    hookAngles: text("hook_angles").notNull(), // JSON.stringify(string[])
    scriptOutline: text("script_outline"), // null nếu viralityScore < 7
    reasoning: text("reasoning").notNull(),
    analyzedAt: text("analyzed_at")
      .notNull()
      .default(sql`(datetime('now'))`)
  },
  (t) => ({
    viralityIdx: index("analyzed_virality_idx").on(t.viralityScore),
    typeIdx: index("analyzed_type_idx").on(t.contentType)
  })
)

// ─── tags ─────────────────────────────────────────────────────────────────────
// Taxonomy cố định — seed 1 lần
export const tags = sqliteTable("tags", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  labelVi: text("label_vi").notNull(), // "Thu nhập thụ động"
  category: text("category", {
    enum: ["income", "brand", "content", "viral", "money"]
  }).notNull()
})

// ─── post_tags ────────────────────────────────────────────────────────────────
// Junction table — many-to-many posts ↔ tags
export const postTags = sqliteTable(
  "post_tags",
  {
    postId: text("post_id")
      .notNull()
      .references(() => posts.id),
    tagId: text("tag_id")
      .notNull()
      .references(() => tags.id)
  },
  (t) => ({
    postTagIdx: index("post_tags_post_idx").on(t.postId),
    tagPostIdx: index("post_tags_tag_idx").on(t.tagId)
  })
)

// ─── saved_ideas ──────────────────────────────────────────────────────────────
// Bài post user lưu lại để làm content
export const savedIdeas = sqliteTable(
  "saved_ideas",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    postId: text("post_id")
      .notNull()
      .references(() => posts.id),
    notes: text("notes"),
    status: text("status", {
      enum: ["draft", "in-progress", "published"]
    })
      .notNull()
      .default("draft"),
    savedAt: text("saved_at")
      .notNull()
      .default(sql`(datetime('now'))`)
  },
  (t) => ({
    userIdx: index("saved_ideas_user_idx").on(t.userId)
  })
)

// ─── cron_logs ────────────────────────────────────────────────────────────────
// Health monitor cho mỗi lần cron chạy
export const cronLogs = sqliteTable(
  "cron_logs",
  {
    id: text("id").primaryKey(),
    sourceId: text("source_id")
      .notNull()
      .references(() => sources.id),
    runAt: text("run_at")
      .notNull()
      .default(sql`(datetime('now'))`),
    status: text("status", {
      enum: ["success", "partial", "failed"]
    }).notNull(),
    postsScraped: integer("posts_scraped").notNull().default(0),
    postsAnalyzed: integer("posts_analyzed").notNull().default(0),
    postsSkipped: integer("posts_skipped").notNull().default(0), // dedup
    durationMs: integer("duration_ms").notNull().default(0),
    errorMessage: text("error_message")
  },
  (t) => ({
    sourceRunIdx: index("cron_logs_source_idx").on(t.sourceId, t.runAt)
  })
)

// ─── Type exports ─────────────────────────────────────────────────────────────
export type Source = typeof sources.$inferSelect
export type NewSource = typeof sources.$inferInsert
export type Post = typeof posts.$inferSelect
export type NewPost = typeof posts.$inferInsert
export type AnalyzedPost = typeof analyzedPosts.$inferSelect
export type NewAnalyzedPost = typeof analyzedPosts.$inferInsert
export type Tag = typeof tags.$inferSelect
export type PostTag = typeof postTags.$inferSelect
export type SavedIdea = typeof savedIdeas.$inferSelect
export type NewSavedIdea = typeof savedIdeas.$inferInsert
export type CronLog = typeof cronLogs.$inferSelect
export type NewCronLog = typeof cronLogs.$inferInsert
