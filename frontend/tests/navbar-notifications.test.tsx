import { render, screen, waitFor } from "@testing-library/react"
import { Navbar } from "@/components/navbar"

const { listPage, markRead } = vi.hoisted(() => ({
  listPage: vi.fn(),
  markRead: vi.fn(),
}))

let authUser: { role: "user"; name: string; email: string } | null = null

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock("@/components/providers/auth-provider", () => ({
  useAuth: () => ({
    user: authUser,
    logout: vi.fn(),
  }),
}))

vi.mock("@/services", () => ({
  notificationService: {
    listPage,
    markRead,
  },
}))

describe("Navbar notifications", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authUser = null
    listPage.mockResolvedValue({ count: 0, next: null, previous: null, results: [] })
    markRead.mockResolvedValue({})
  })

  it("does not show the notification bell for guests", () => {
    render(<Navbar />)

    expect(screen.queryByLabelText(/notifications/i)).not.toBeInTheDocument()
  })

  it("shows unread notification count for logged-in users", async () => {
    authUser = { role: "user", name: "Test User", email: "user@example.com" }
    listPage.mockResolvedValue({
      count: 1,
      next: null,
      previous: null,
      results: [
        {
          id: "notification-1",
          title: "Appointment update",
          message: "Your appointment was accepted.",
          type: "appointment",
          isRead: false,
          metadata: { appointment_id: "appointment-1" },
          createdAt: "2026-04-20T10:00:00Z",
        },
      ],
    })

    render(<Navbar />)

    const trigger = await screen.findByLabelText(/notifications/i)
    expect(screen.getByText("1")).toBeInTheDocument()
    expect(trigger).toBeInTheDocument()
    await waitFor(() =>
      expect(listPage).toHaveBeenCalledWith({ isRead: false, page: 1, pageSize: 5 }),
    )
  })
})
