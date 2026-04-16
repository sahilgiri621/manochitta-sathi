import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import AdminTherapistsPage from "@/app/(admin)/admin/therapists/page"

const { approve, listForAdmin } = vi.hoisted(() => ({
  approve: vi.fn(),
  listForAdmin: vi.fn(),
}))

vi.mock("@/services", () => ({
  therapistService: {
    approve,
    listForAdmin,
  },
}))

describe("Admin therapist review", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    listForAdmin.mockResolvedValue([
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
        rating: 0,
        reviewCount: 0,
        isApproved: false,
      },
    ])
    approve.mockResolvedValue({})
  })

  it("approves a therapist application", async () => {
    render(<AdminTherapistsPage />)
    await screen.findByText("Dr Pending")
    fireEvent.change(screen.getByLabelText(/filter by date/i), { target: { value: "2026-03-22" } })
    await waitFor(() => expect(listForAdmin).toHaveBeenLastCalledWith({ date: "2026-03-22" }))
    fireEvent.click(screen.getByRole("button", { name: /approve/i }))
    await waitFor(() => expect(approve).toHaveBeenCalledWith("t1", "approved"))
  })
})
