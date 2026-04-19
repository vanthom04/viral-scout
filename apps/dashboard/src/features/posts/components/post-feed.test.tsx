import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { PostFeed } from "./post-feed"

vi.mock("next/navigation", () => ({
  useRouter: vi.fn().mockReturnValue({ push: vi.fn() })
}))
vi.mock("../actions", () => ({
  savePostAction: vi.fn().mockResolvedValue({ success: true, data: { id: "x" } })
}))
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() }
}))

import { useRouter } from "next/navigation"

type PostItem = Parameters<typeof PostFeed>[0]["initialPosts"][0]

const makePost = (overrides: Partial<PostItem> = {}): PostItem => ({
  postId: `post_${Math.random().toString(36).slice(2)}`,
  platform: "reddit",
  url: "https://reddit.com",
  title: "Test post",
  body: "Test body",
  authorHandle: "user",
  publishedAt: new Date().toISOString(),
  totalEngagement: 100,
  likesCount: 80,
  commentsCount: 15,
  sharesCount: 5,
  viralityScore: 7.0,
  contentType: "story",
  hookAngles: "[]",
  analyzedAt: new Date().toISOString(),
  ...overrides
})

describe("PostFeed", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders all posts from initialPosts", () => {
    const posts = [
      makePost({ title: "Post A" }),
      makePost({ title: "Post B" }),
      makePost({ title: "Post C" })
    ]
    render(<PostFeed initialPosts={posts} />)
    expect(screen.getByText("Post A")).toBeInTheDocument()
    expect(screen.getByText("Post B")).toBeInTheDocument()
    expect(screen.getByText("Post C")).toBeInTheDocument()
  })

  it("shows empty state when no posts passed", () => {
    render(<PostFeed initialPosts={[]} />)
    expect(screen.getByText(/no posts found/i)).toBeInTheDocument()
  })

  it("filters by platform when platform toggle is selected", async () => {
    const posts = [
      makePost({ title: "Reddit post", platform: "reddit" }),
      makePost({ title: "YouTube post", platform: "youtube" })
    ]
    render(<PostFeed initialPosts={posts} />)
    await userEvent.click(screen.getByRole("button", { name: /reddit/i }))
    expect(screen.getByText("Reddit post")).toBeInTheDocument()
    expect(screen.queryByText("YouTube post")).not.toBeInTheDocument()
  })

  it("shows empty state and clear button when filters match nothing", async () => {
    const posts = [makePost({ platform: "reddit" })]
    render(<PostFeed initialPosts={posts} />)
    await userEvent.click(screen.getByRole("button", { name: /youtube/i }))
    expect(screen.getByText(/no posts found/i)).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: /clear filters/i }))
    expect(screen.queryByText(/no posts found/i)).not.toBeInTheDocument()
  })

  it("navigates to /idea-generator when Generate Ideas is clicked", async () => {
    const mockPush = vi.fn()
    vi.mocked(useRouter).mockReturnValue({ push: mockPush } as never)
    const post = makePost({ postId: "post_abc" })
    render(<PostFeed initialPosts={[post]} />)
    await userEvent.click(screen.getByRole("button", { name: /generate ideas/i }))
    expect(mockPush).toHaveBeenCalledWith("/idea-generator?postId=post_abc")
  })
})
