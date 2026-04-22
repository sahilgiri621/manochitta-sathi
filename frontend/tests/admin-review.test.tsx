import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import AdminTherapistsPage from "@/app/(admin)/admin/therapists/page"

const { approve, listForAdminPage, listCommissionRules } = vi.hoisted(() => ({
  approve: vi.fn(),
  listForAdminPage: vi.fn(),
  listCommissionRules: vi.fn(),
}))

vi.mock("@/services", () => ({
  therapistService: {
    approve,
    listForAdminPage,
    listCommissionRules,
  },
}))

describe("Admin therapist review", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    listForAdminPage.mockResolvedValue({
      count: 1,
      next: null,
      previous: null,
      results: [
        {
          id: "t1",
          title: "Psychologist",
          approvalStatus: "pending",
          user: { name: "Dr Pending" },
          userId: "u1",
          specializations: [],
          qualifications: [],
          experience: 0,
          languages: [],
          sessionTypes: ["video"],
          pricePerSession: 0,
          completedSessions: 0,
          commissionRate: 0.1,
          commissionTier: "Starter",
          totalEarnings: 0,
          rating: 0,
          reviewCount: 0,
          isApproved: false,
        },
      ],
    })
    listCommissionRules.mockResolvedValue([
      {
        id: "rule-1",
        tierName: "Starter",
        minSessions: 0,
        maxSessions: 9,
        commissionRate: 0.1,
        isActive: true,
        createdAt: "",
        updatedAt: "",
      },
    ])
    approve.mockResolvedValue({})
  })

  it("approves a therapist application", async () => {
    render(<AdminTherapistsPage />)
    fireEvent.click(screen.getByRole("tab", { name: /unapproved therapists/i }))
    await screen.findByText("Dr Pending")
    fireEvent.change(screen.getByLabelText(/filter by date/i), { target: { value: "2026-03-22" } })
    await waitFor(() =>
      expect(listForAdminPage).toHaveBeenLastCalledWith(
        expect.objectContaining({ date: "2026-03-22", page: 1, pageSize: 10 }),
      ),
    )
    fireEvent.click(screen.getByRole("button", { name: /approve/i }))
    fireEvent.click(screen.getByRole("button", { name: /confirm/i }))
    await waitFor(() => expect(approve).toHaveBeenCalledWith("t1", "approved"))
  })
})
