import { render, waitFor } from "@testing-library/react"
import { AuthProvider } from "@/components/providers/auth-provider"

const replace = vi.fn()
const getTokens = vi.fn()
const onUnauthorized = vi.fn(() => () => undefined)

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  usePathname: () => "/admin",
}))

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api")
  return {
    ...actual,
    api: {
      getTokens,
      setTokens: vi.fn(),
      onUnauthorized,
    },
  }
})

vi.mock("@/services/auth-service", () => ({
  authService: {
    getCurrentUser: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  },
}))

describe("AuthProvider guards", () => {
  beforeEach(() => {
    replace.mockReset()
    getTokens.mockReset()
    onUnauthorized.mockClear()
  })

  it("redirects unauthenticated protected routes to login", async () => {
    getTokens.mockReturnValue(null)
    render(
      <AuthProvider>
        <div>Protected</div>
      </AuthProvider>
    )

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/login?next=%2Fadmin"))
  })
})
