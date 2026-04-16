import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import LoginPage from "@/app/(auth)/login/page"

const push = vi.fn()
const login = vi.fn()

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => ({ get: () => null }),
}))

vi.mock("@/components/providers/auth-provider", () => ({
  useAuth: () => ({ login }),
}))

describe("LoginPage", () => {
  beforeEach(() => {
    push.mockReset()
    login.mockReset()
  })

  it("logs in and redirects to the role dashboard", async () => {
    login.mockResolvedValue({ role: "user" })
    render(<LoginPage />)

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "user@example.com" } })
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: "Password123" } })
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }))

    await waitFor(() => expect(login).toHaveBeenCalledWith({ email: "user@example.com", password: "Password123" }))
    expect(push).toHaveBeenCalledWith("/dashboard")
  })
})
