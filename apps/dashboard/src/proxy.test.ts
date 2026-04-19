import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

vi.mock("@/lib/auth")

import { getAuth } from "@/lib/auth"
import { proxy } from "./proxy"

const req = (pathname: string) =>
  new NextRequest(new URL(`http://localhost${pathname}`))

const mockSession = (user: { id: string } | null) =>
  vi.mocked(getAuth).mockResolvedValue({
    api: { getSession: vi.fn().mockResolvedValue(user ? { user } : null) }
  } as never)

describe("proxy", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("redirects unauthenticated user from /trending to /login with callbackUrl", async () => {
    mockSession(null)
    const res = await proxy(req("/trending"))
    expect(res.status).toBe(307)
    expect(res.headers.get("location")).toContain("/login")
    expect(res.headers.get("location")).toContain("callbackUrl=%2Ftrending")
  })

  it("allows authenticated user to access /trending", async () => {
    mockSession({ id: "user_1" })
    const res = await proxy(req("/trending"))
    expect(res.status).toBe(200)
  })

  it.each(["/trending", "/analytics", "/monitor", "/idea-generator"])(
    "guards protected route %s",
    async (route) => {
      mockSession(null)
      const res = await proxy(req(route))
      expect(res.status).toBe(307)
    }
  )

  it.each(["/login", "/", "/api/auth/session"])(
    "passes through unprotected route %s",
    async (route) => {
      const res = await proxy(req(route))
      expect(res.status).toBe(200)
      expect(getAuth).not.toHaveBeenCalled()
    }
  )

  it("includes callbackUrl param when redirecting", async () => {
    mockSession(null)
    const res = await proxy(req("/analytics"))
    const location = res.headers.get("location") ?? ""
    expect(location).toContain("callbackUrl=%2Fanalytics")
  })
})
