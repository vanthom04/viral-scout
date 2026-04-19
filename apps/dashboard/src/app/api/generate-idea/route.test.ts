import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext: vi.fn()
}))

import { POST } from "./route"
import { getCloudflareContext } from "@opennextjs/cloudflare"

const validBody = {
  title: "Cách x3 thu nhập trong 6 tháng",
  body: "Tôi đã làm điều này bằng cách tập trung vào kỹ năng cao giá trị.",
  platform: "reddit",
  contentType: "story",
  hookAngles: ["Từ 0 đến 100 triệu", "Bí quyết ít ai biết"]
}

describe("POST /api/generate-idea", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getCloudflareContext).mockResolvedValue({
      env: {
        AI: {
          run: vi.fn().mockResolvedValue(new ReadableStream())
        }
      }
    } as never)
  })

  it("returns 400 for invalid JSON body", async () => {
    const req = new Request("http://localhost/api/generate-idea", {
      method: "POST",
      body: "not valid json"
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it("returns 422 when title is empty string", async () => {
    const req = new Request("http://localhost/api/generate-idea", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...validBody, title: "" })
    })
    const res = await POST(req)
    expect(res.status).toBe(422)
  })

  it("returns 422 when required fields are missing", async () => {
    const req = new Request("http://localhost/api/generate-idea", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Only title" })
    })
    const res = await POST(req)
    expect(res.status).toBe(422)
  })

  it("returns 200 SSE stream for valid request", async () => {
    const req = new Request("http://localhost/api/generate-idea", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validBody)
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    expect(res.headers.get("Content-Type")).toBe("text/event-stream")
  })

  it("calls AI.run with correct model and messages", async () => {
    const mockRun = vi.fn().mockResolvedValue(new ReadableStream())
    vi.mocked(getCloudflareContext).mockResolvedValue({
      env: { AI: { run: mockRun } }
    } as never)

    const req = new Request("http://localhost/api/generate-idea", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validBody)
    })
    await POST(req)

    expect(mockRun).toHaveBeenCalledWith(
      "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
      expect.objectContaining({
        stream: true,
        messages: expect.arrayContaining([
          expect.objectContaining({ role: "system" }),
          expect.objectContaining({ role: "user" })
        ])
      })
    )
  })

  it("returns 503 when AI throws", async () => {
    vi.mocked(getCloudflareContext).mockResolvedValue({
      env: {
        AI: { run: vi.fn().mockRejectedValue(new Error("AI service down")) }
      }
    } as never)

    const req = new Request("http://localhost/api/generate-idea", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validBody)
    })
    const res = await POST(req)
    expect(res.status).toBe(503)
  })
})
