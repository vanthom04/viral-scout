import { sql, desc, gte, eq } from "drizzle-orm"
import { cacheLife, cacheTag } from "next/cache"

import { getDb } from "@/lib/db"
import { analyzedPosts, posts, tags, postTags, getViralityStats } from "@viral-scout/database"

export const fetchAnalyticsData = async () => {
  "use cache"
  cacheLife("minutes")
  cacheTag("posts")

  const db = await getDb()

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3_600_000).toISOString()

  const [platformStats, topTags, viralityDistribution] = await Promise.all([
    // Statistics by platform
    getViralityStats(db),

    // Top tags by post count
    db
      .select({
        slug: tags.slug,
        labelVi: tags.labelVi,
        postCount: sql<number>`count(${postTags.postId})`,
        avgVirality: sql<number>`avg(${analyzedPosts.viralityScore})`
      })
      .from(tags)
      .leftJoin(postTags, eq(postTags.tagId, tags.id))
      .leftJoin(analyzedPosts, eq(analyzedPosts.postId, postTags.postId))
      .groupBy(tags.id)
      .orderBy(desc(sql`count(${postTags.postId})`))
      .limit(8),

    // Virality score distribution (bucket by 1 point)
    db
      .select({
        bucket: sql<number>`round(${analyzedPosts.viralityScore})`,
        postCount: sql<number>`count(*)`
      })
      .from(analyzedPosts)
      .innerJoin(posts, eq(posts.id, analyzedPosts.postId))
      .where(gte(posts.publishedAt, sevenDaysAgo))
      .groupBy(sql`round(${analyzedPosts.viralityScore})`)
      .orderBy(sql`round(${analyzedPosts.viralityScore})`)
  ])

  return { platformStats, topTags, viralityDistribution }
}
