import { describe, it, expect } from "vitest"
import { formatDuration, formatRelativeTime, STATUS_CONFIG } from "./utils"

describe("formatDuration", () => {
  it("returns ms for values under 1 second", () => {
    expect(formatDuration(0)).toBe("0ms")
    expect(formatDuration(500)).toBe("500ms")
    expect(formatDuration(999)).toBe("999ms")
  })

  it("returns seconds with 1 decimal for values 1000ms+", () => {
    expect(formatDuration(1000)).toBe("1.0s")
    expect(formatDuration(1500)).toBe("1.5s")
    expect(formatDuration(61000)).toBe("61.0s")
  })
})

describe("formatRelativeTime", () => {
  it("returns 'just now' for less than 1 minute ago", () => {
    const thirtySecondsAgo = new Date(Date.now() - 30_000).toISOString()
    expect(formatRelativeTime(thirtySecondsAgo)).toBe("just now")
  })

  it("returns minutes ago for less than 1 hour", () => {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60_000).toISOString()
    expect(formatRelativeTime(tenMinutesAgo)).toBe("10 mins ago")
  })

  it("returns hours ago for less than 24 hours", () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 3_600_000).toISOString()
    expect(formatRelativeTime(threeHoursAgo)).toBe("3 hours ago")
  })

  it("returns days ago for 24+ hours", () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 3_600_000).toISOString()
    expect(formatRelativeTime(twoDaysAgo)).toBe("2 days ago")
  })
})

describe("STATUS_CONFIG", () => {
  it("has correct label for success", () => {
    expect(STATUS_CONFIG.success.label).toBe("Optimal")
  })

  it("has correct label for partial", () => {
    expect(STATUS_CONFIG.partial.label).toBe("Degraded")
  })

  it("has correct label for failed", () => {
    expect(STATUS_CONFIG.failed.label).toBe("Critical")
  })
})
