import type { DrizzleD1Database } from "drizzle-orm/d1"
import { eq } from "drizzle-orm"

import { sources, tags, postTags } from "../schema"
import type * as schema from "../schema"

type DB = DrizzleD1Database<typeof schema>

// ─── Sources ──────────────────────────────────────────────────────────────────

export const getActiveSources = async (db: DB) =>
  db.select().from(sources).where(eq(sources.isActive, true))

export const getAllSources = async (db: DB) => db.select().from(sources)

export const toggleSourceActive = async (db: DB, sourceId: string, isActive: boolean) =>
  db.update(sources).set({ isActive }).where(eq(sources.id, sourceId))

// ─── Tags ─────────────────────────────────────────────────────────────────────

export const getAllTags = async (db: DB) => db.select().from(tags)

// Lấy tags của 1 post (join qua post_tags)
export const getTagsForPost = async (db: DB, postId: string) =>
  db
    .select({ tag: tags })
    .from(postTags)
    .innerJoin(tags, eq(postTags.tagId, tags.id))
    .where(eq(postTags.postId, postId))

// Insert post-tag relations
export const insertPostTags = async (db: DB, postId: string, tagIds: string[]) => {
  if (tagIds.length === 0) return
  return db.insert(postTags).values(tagIds.map((tagId) => ({ postId, tagId })))
}
