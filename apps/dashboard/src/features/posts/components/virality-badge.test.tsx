import { describe, it, expect } from "vitest"
import { render } from "@testing-library/react"
import { ViralityBadge } from "./virality-badge"

describe("ViralityBadge", () => {
  it("shows fire emoji for score >= 8.5", () => {
    const { container } = render(<ViralityBadge score={9.0} />)
    expect(container.textContent).toContain("🔥")
  })

  it("shows fire emoji at exact boundary 8.5", () => {
    const { container } = render(<ViralityBadge score={8.5} />)
    expect(container.textContent).toContain("🔥")
  })

  it("shows lightning emoji for score >= 7 and < 8.5", () => {
    const { container } = render(<ViralityBadge score={7.5} />)
    expect(container.textContent).toContain("⚡")
  })

  it("shows lightning emoji at exact boundary 7.0", () => {
    const { container } = render(<ViralityBadge score={7.0} />)
    expect(container.textContent).toContain("⚡")
  })

  it("shows no special emoji for score < 7", () => {
    const { container } = render(<ViralityBadge score={5.0} />)
    expect(container.textContent).not.toContain("🔥")
    expect(container.textContent).not.toContain("⚡")
  })

  it("renders the numeric score", () => {
    const { container } = render(<ViralityBadge score={8.3} />)
    expect(container.textContent).toContain("8.3")
  })
})
