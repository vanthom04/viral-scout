import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { PostCard } from "./post-card"

vi.mock("../actions", () => ({
  savePostAction: vi.fn()
}))
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() }
}))

import { savePostAction } from "../actions"
import { toast } from "sonner"

const mockPost = {
  postId: "post_123",
  platform: "reddit",
  url: "https://reddit.com/r/test",
  title: "Cách x3 thu nhập trong 6 tháng",
  body: "Tôi đã làm được điều này bằng cách...",
  authorHandle: "testuser",
  publishedAt: new Date(Date.now() - 3_600_000).toISOString(),
  totalEngagement: 1500,
  likesCount: 1200,
  commentsCount: 250,
  sharesCount: 50,
  viralityScore: 8.7,
  contentType: "story",
  hookAngles: JSON.stringify(["Từ 0 đến 100 triệu", "Bí quyết ít ai biết"]),
  analyzedAt: new Date().toISOString()
}

describe("PostCard", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders title, platform badge, and author", () => {
    render(<PostCard post={mockPost} />)
    expect(screen.getByText(mockPost.title)).toBeInTheDocument()
    expect(screen.getByText("Reddit")).toBeInTheDocument()
    expect(screen.getByText(/@testuser/)).toBeInTheDocument()
  })

  it("renders up to 2 hook angles", () => {
    render(<PostCard post={mockPost} />)
    expect(screen.getByText("Từ 0 đến 100 triệu")).toBeInTheDocument()
    expect(screen.getByText("Bí quyết ít ai biết")).toBeInTheDocument()
  })

  it("does not crash with invalid hookAngles JSON", () => {
    const post = { ...mockPost, hookAngles: "invalid json" }
    expect(() => render(<PostCard post={post} />)).not.toThrow()
  })

  it("calls onGenerateIdea with postId when Generate Ideas is clicked", async () => {
    const onGenerateIdea = vi.fn()
    render(<PostCard post={mockPost} onGenerateIdea={onGenerateIdea} />)
    await userEvent.click(screen.getByRole("button", { name: /generate ideas/i }))
    expect(onGenerateIdea).toHaveBeenCalledWith("post_123", "Cách x3 thu nhập trong 6 tháng")
  })

  it("calls savePostAction and shows success toast when bookmark is clicked", async () => {
    vi.mocked(savePostAction).mockResolvedValue({ success: true, data: { id: "saved_1" } })
    render(<PostCard post={mockPost} />)
    await userEvent.click(screen.getByRole("button", { name: /lưu bài viết/i }))
    await waitFor(() => {
      expect(savePostAction).toHaveBeenCalledWith("post_123")
      expect(toast.success).toHaveBeenCalledWith("Đã lưu bài viết")
    })
  })

  it("shows error toast when savePostAction fails", async () => {
    vi.mocked(savePostAction).mockResolvedValue({ success: false, error: "Unauthorized" })
    render(<PostCard post={mockPost} />)
    await userEvent.click(screen.getByRole("button", { name: /lưu bài viết/i }))
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Unauthorized")
    })
  })

  it("disables bookmark button after successful save", async () => {
    vi.mocked(savePostAction).mockResolvedValue({ success: true, data: { id: "saved_1" } })
    render(<PostCard post={mockPost} />)
    const btn = screen.getByRole("button", { name: /lưu bài viết/i })
    await userEvent.click(btn)
    await waitFor(() => expect(btn).toBeDisabled())
  })
})
