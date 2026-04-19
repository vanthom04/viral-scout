import { getDb } from "@/lib/db"
import type { GetViralPostsOptions } from "@viral-scout/database"
import { getPostById, getViralPosts } from "@viral-scout/database"

export const fetchViralPosts = async (opts?: GetViralPostsOptions) => {
  const db = await getDb()
  return getViralPosts(db, opts)
}

export const fetchPostById = async (postId: string) => {
  const db = await getDb()
  return getPostById(db, postId)
}
