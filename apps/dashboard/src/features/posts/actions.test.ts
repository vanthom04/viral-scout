import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { createTestDb } from "../../../tests/helpers/db"

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers())
}))
vi.mock("next/cache", () => ({
  revalidateTag: vi.fn()
}))
vi.mock("@/lib/auth", () => ({
  getAuth: vi.fn()
}))
vi.mock("@/lib/db", () => ({
  getDb: vi.fn()
}))

import { savePostAction } from "./actions"
import { getAuth } from "@/lib/auth"
import { getDb } from "@/lib/db"
import { posts, savedIdeas } from "@viral-scout/database"
import { eq } from "drizzle-orm"

const TEST_POST_ID = "post_act_001"
const TEST_USER_ID = "user_act_001"

describe("savePostAction", () => {
  let db: Awaited<ReturnType<typeof createTestDb>>["db"]
  let cleanup: () => void

  beforeEach(async () => {
    vi.clearAllMocks()
    const testDb = await createTestDb()
    db = testDb.db
    cleanup = testDb.cleanup

    vi.mocked(getDb).mockResolvedValue(db as never)
    vi.mocked(getAuth).mockResolvedValue({
      api: {
        getSession: vi.fn().mockResolvedValue({ user: { id: TEST_USER_ID } })
      }
    } as never)

    await db.insert(posts).values({
      id: TEST_POST_ID,
      sourceId: "src_reddit_pf",
      platform: "reddit",
      externalId: "ext_act_001",
      url: "https://reddit.com/r/test",
      title: "Test post for save action",
      body: "",
      authorHandle: "testuser",
      publishedAt: new Date().toISOString(),
      totalEngagement: 100
    })
  })

  afterEach(() => {
    cleanup()
  })

  it("returns Unauthorized when no session", async () => {
    vi.mocked(getAuth).mockResolvedValue({
      api: { getSession: vi.fn().mockResolvedValue(null) }
    } as never)

    const result = await savePostAction(TEST_POST_ID)
    expect(result).toEqual({ success: false, error: "Unauthorized" })
  })

  it("returns success with id when valid", async () => {
    const result = await savePostAction(TEST_POST_ID)
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.id).toBeTruthy()
  })

  it("inserts row into saved_ideas with correct user and post", async () => {
    await savePostAction(TEST_POST_ID)
    const rows = await db.select().from(savedIdeas).where(eq(savedIdeas.postId, TEST_POST_ID))
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({ userId: TEST_USER_ID, status: "draft" })
  })

  it("saves optional notes", async () => {
    await savePostAction(TEST_POST_ID, "Ghi chú của tôi")
    const rows = await db.select().from(savedIdeas).where(eq(savedIdeas.postId, TEST_POST_ID))
    expect(rows[0]).toMatchObject({ notes: "Ghi chú của tôi" })
  })

  it("notes is null when not provided", async () => {
    await savePostAction(TEST_POST_ID)
    const rows = await db.select().from(savedIdeas).where(eq(savedIdeas.postId, TEST_POST_ID))
    expect(rows[0]).toMatchObject({ notes: null })
  })
})
