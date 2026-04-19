import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { LoginForm } from "./login-form"

vi.mock("next/navigation", () => ({
  useRouter: vi.fn().mockReturnValue({ push: vi.fn(), refresh: vi.fn() }),
  useSearchParams: vi.fn().mockReturnValue({ get: vi.fn().mockReturnValue(null) })
}))
vi.mock("@/lib/auth-client", () => ({
  signIn: { email: vi.fn().mockResolvedValue({ error: null }) }
}))

import { signIn } from "@/lib/auth-client"
import { useRouter } from "next/navigation"

describe("LoginForm", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("shows email validation error for invalid format", async () => {
    render(<LoginForm />)
    await userEvent.type(screen.getByLabelText(/email/i), "not-an-email")
    await userEvent.type(screen.getByLabelText(/password/i), "password123")
    await userEvent.click(screen.getByRole("button", { name: /login/i }))
    await waitFor(() => {
      expect(screen.getByText(/invalid email/i)).toBeInTheDocument()
    })
    expect(signIn.email).not.toHaveBeenCalled()
  })

  it("shows password validation error for password shorter than 8 characters", async () => {
    render(<LoginForm />)
    await userEvent.type(screen.getByLabelText(/email/i), "user@example.com")
    await userEvent.type(screen.getByLabelText(/password/i), "short")
    await userEvent.click(screen.getByRole("button", { name: /login/i }))
    await waitFor(() => {
      expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument()
    })
    expect(signIn.email).not.toHaveBeenCalled()
  })

  it("calls signIn.email with correct credentials on valid submit", async () => {
    render(<LoginForm />)
    await userEvent.type(screen.getByLabelText(/email/i), "user@example.com")
    await userEvent.type(screen.getByLabelText(/password/i), "password123")
    await userEvent.click(screen.getByRole("button", { name: /login/i }))
    await waitFor(() => {
      expect(signIn.email).toHaveBeenCalledWith({
        email: "user@example.com",
        password: "password123"
      })
    })
  })

  it("redirects to /trending after successful login", async () => {
    const mockPush = vi.fn()
    vi.mocked(useRouter).mockReturnValue({ push: mockPush, refresh: vi.fn() } as never)
    render(<LoginForm />)
    await userEvent.type(screen.getByLabelText(/email/i), "user@example.com")
    await userEvent.type(screen.getByLabelText(/password/i), "password123")
    await userEvent.click(screen.getByRole("button", { name: /login/i }))
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/trending")
    })
  })

  it("shows server error message when signIn returns error", async () => {
    vi.mocked(signIn.email).mockResolvedValue({ error: { message: "Invalid" } } as never)
    render(<LoginForm />)
    await userEvent.type(screen.getByLabelText(/email/i), "user@example.com")
    await userEvent.type(screen.getByLabelText(/password/i), "password123")
    await userEvent.click(screen.getByRole("button", { name: /login/i }))
    await waitFor(() => {
      expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument()
    })
  })
})
