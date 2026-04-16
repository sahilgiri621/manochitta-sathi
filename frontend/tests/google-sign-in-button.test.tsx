import { render, screen, waitFor } from "@testing-library/react"
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button"

const push = vi.fn()
const googleLogin = vi.fn()
const initialize = vi.fn()
const renderButton = vi.fn()
const cancel = vi.fn()

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}))

vi.mock("@/components/providers/auth-provider", () => ({
  useAuth: () => ({ googleLogin }),
}))

describe("GoogleSignInButton", () => {
  beforeEach(() => {
    push.mockReset()
    googleLogin.mockReset()
    initialize.mockReset()
    renderButton.mockReset()
    cancel.mockReset()
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = "google-client-id"
    window.google = {
      accounts: {
        id: {
          initialize,
          renderButton,
          cancel,
        },
      },
    }
  })

  it("logs in with Google and redirects to the role dashboard", async () => {
    let callback: ((response: { credential?: string }) => void) | undefined
    initialize.mockImplementation((options: Record<string, unknown>) => {
      callback = options.callback as (response: { credential?: string }) => void
    })
    googleLogin.mockResolvedValue({ role: "user" })

    render(<GoogleSignInButton mode="login" />)

    await waitFor(() => expect(renderButton).toHaveBeenCalled())
    callback?.({ credential: "google-token" })

    await waitFor(() => expect(googleLogin).toHaveBeenCalledWith("google-token"))
    await waitFor(() => expect(push).toHaveBeenCalledWith("/dashboard"))
  })

  it("shows a configuration message when the client ID is missing", () => {
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = ""

    render(<GoogleSignInButton mode="login" />)

    expect(screen.getByText(/Google sign-in is unavailable/i)).toBeInTheDocument()
  })
})
