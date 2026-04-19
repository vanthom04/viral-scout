import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { createTestDb } from "../../../tests/helpers/db"

vi.mock("next/cache", () => ({
  cacheLife: vi.fn(),
  cacheTag: vi.fn()
}))
vi.mock("@/lib/db", () => ({
  getDb: vi.fn()
}))

import { fetchAnalyticsData } from "./queries"
import { getDb } from "@/lib/db"
import { posts, analyzedPosts } from "@viral-scout/database"

describe("fetchAnalyticsData", () => {
  let db: Awaited<ReturnType<typeof createTestDb>>["db"]
  let cleanup: () => void

  beforeEach(async () => {
    vi.clearAllMocks()
    const testDb = await createTestDb()
    db = testDb.db
    cleanup = testDb.cleanup
    vi.mocked(getDb).mockResolvedValue(db as never)
  })

  afterEach(() => {
    cleanup()
  })

  it("returns three array fields", async () => {
    const result = await fetchAnalyticsData()
    expect(Array.isArray(result.platformStats)).toBe(true)
    expect(Array.isArray(result.topTags)).toBe(true)
    expect(Array.isArray(result.viralityDistribution)).toBe(true)
  })

  it("topTags includes seed tags with required fields", async () => {
    const result = await fetchAnalyticsData()
    expect(result.topTags.length).toBeGreaterThan(0)
    const tag = result.topTags[0]
    expect(tag).toHaveProperty("slug")
    expect(tag).toHaveProperty("labelVi")
    expect(tag).toHaveProperty("postCount")
    expect(tag).toHaveProperty("avgVirality")
  })

  it("viralityDistribution is empty when no analyzed posts exist", async () => {
    const result = await fetchAnalyticsData()
    expect(result.viralityDistribution).toHaveLength(0)
  })

  it("viralityDistribution buckets posts by rounded score", async () => {
    await db.insert(posts).values({
      id: "post_aq_01",
      sourceId: "src_reddit_pf",
      platform: "reddit",
      externalId: "ext_aq_01",
      url: "https://reddit.com/r/test",
      title: "Analytics query test",
      body: "",
      authorHandle: "user",
      publishedAt: new Date().toISOString(),
      totalEngagement: 200
    })
    await db.insert(analyzedPosts).values({
      id: "ap_aq_01",
      postId: "post_aq_01",
      viralityScore: 8.3,
      contentType: "story",
      hookAngles: "[]",
      reasoning: "test reason"
    })

    const result = await fetchAnalyticsData()
    const bucket8 = result.viralityDistribution.find((d) => Number(d.bucket) === 8)
    expect(bucket8).toBeDefined()
    expect(Number(bucket8?.postCount)).toBeGreaterThanOrEqual(1)
  })
})
