import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import AdminRevenuePage from "@/app/(admin)/admin/revenue/page"

const { getRevenueReport } = vi.hoisted(() => ({
  getRevenueReport: vi.fn(),
}))

vi.mock("@/services", () => ({
  adminService: {
    getRevenueReport,
  },
}))

describe("Admin revenue page", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getRevenueReport.mockResolvedValue({
      count: 1,
      next: null,
      previous: null,
      summary: {
        completedSessions: 1,
        grossRevenue: 2000,
        therapistRevenue: 1800,
        platformRevenue: 200,
      },
      therapistTotals: [
        {
          therapistId: "t1",
          therapistName: "Dr Calm",
          therapistEmail: "drcalm@example.com",
          completedSessions: 1,
          grossRevenue: 2000,
          therapistRevenue: 1800,
          platformRevenue: 200,
        },
      ],
      results: [
        {
          id: "a1",
          therapistId: "t1",
          therapistName: "Dr Calm",
          therapistEmail: "drcalm@example.com",
          userName: "Patient One",
          sessionType: "video",
          scheduledStart: "2026-04-20T10:00:00Z",
          paymentVerifiedAt: "2026-04-20T09:00:00Z",
          sessionPrice: 2000,
          therapistEarning: 1800,
          platformCommission: 200,
          commissionRateUsed: 0.1,
          tierUsed: "Starter",
          paymentProvider: "khalti",
          paymentTransactionId: "txn-1",
        },
      ],
    })
  })

  it("loads filtered revenue data and shows summary totals", async () => {
    render(<AdminRevenuePage />)

    expect((await screen.findAllByText("Dr Calm")).length).toBeGreaterThan(0)
    expect(screen.getByText("NPR 2,000")).toBeInTheDocument()
    expect(screen.getByText("NPR 1,800")).toBeInTheDocument()
    expect(screen.getByText("NPR 200")).toBeInTheDocument()
    expect(screen.getByText(/completed sessions: 1/i)).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText(/therapist name/i), {
      target: { value: "Calm" },
    })
    fireEvent.change(screen.getByLabelText(/^from$/i), {
      target: { value: "2026-04-01" },
    })
    fireEvent.change(screen.getByLabelText(/^to$/i), {
      target: { value: "2026-04-20" },
    })

    await waitFor(() =>
      expect(getRevenueReport).toHaveBeenLastCalledWith({
        search: "Calm",
        dateFrom: "2026-04-01",
        dateTo: "2026-04-20",
        page: 1,
        pageSize: 10,
      }),
    )
  })
})
