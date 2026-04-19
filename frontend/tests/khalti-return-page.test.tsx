import { render, screen } from "@testing-library/react"
import PublicKhaltiPaymentResultPage from "@/app/payment/result/khalti/page"

const { verifyKhaltiPayment } = vi.hoisted(() => ({
  verifyKhaltiPayment: vi.fn(),
}))

let returnedPidx = "pidx-1"

vi.mock("next/navigation", () => ({
  useSearchParams: () => ({
    get: (key: string) => {
      if (key === "appointment") return "a1"
      if (key === "pidx") return returnedPidx
      return null
    },
  }),
}))

vi.mock("@/services", () => ({
  paymentService: {
    verifyKhaltiPayment,
  },
}))

describe("Khalti return page", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    returnedPidx = "pidx-1"
    verifyKhaltiPayment.mockResolvedValue({
      appointment: null,
      appointmentId: "a1",
      paymentStatus: "paid",
      bookingStatus: "confirmed",
      lookup: { status: "Completed" },
    })
  })

  it("shows verified success after backend lookup", async () => {
    render(<PublicKhaltiPaymentResultPage />)

    expect(await screen.findByText(/payment successful/i)).toBeInTheDocument()
    expect(screen.queryByText("Therapist")).not.toBeInTheDocument()
    expect(verifyKhaltiPayment).toHaveBeenCalledWith({ appointment: "a1", pidx: "pidx-1" }, { auth: false })
  })

  it("uses authenticated verification when Khalti returns no pidx", async () => {
    returnedPidx = ""

    render(<PublicKhaltiPaymentResultPage />)

    expect(await screen.findByText(/payment successful/i)).toBeInTheDocument()
    expect(verifyKhaltiPayment).toHaveBeenCalledWith({ appointment: "a1", pidx: undefined }, { auth: true })
  })

  it("can still render appointment summary when an authenticated verify response includes it", async () => {
    verifyKhaltiPayment.mockResolvedValue({
      appointment: {
        id: "a1",
        userId: "u1",
        userName: "User One",
        therapistId: "t1",
        therapistName: "Dr Calm",
        availabilitySlotId: "slot-1",
        sessionType: "video",
        scheduledStart: "2099-01-01T10:00:00Z",
        scheduledEnd: "2099-01-01T10:50:00Z",
        status: "confirmed",
        paymentStatus: "paid",
        paymentProvider: "khalti",
        paidAmount: 150000,
        khaltiPidx: "pidx-1",
        paymentTransactionId: "txn-1",
        paymentInitiatedAt: "2099-01-01T09:00:00Z",
        paymentVerifiedAt: "2099-01-01T09:05:00Z",
        meetingProvider: "",
        meetingLink: "",
        externalCalendarEventId: "",
        meetingStatus: "",
        meetingCreatedAt: "",
        notes: "",
        cancellationReason: "",
        therapistResponseNote: "",
        rescheduledFrom: null,
        events: [],
        createdAt: "2099-01-01T09:00:00Z",
        updatedAt: "2099-01-01T09:05:00Z",
      },
      appointmentId: "a1",
      paymentStatus: "paid",
      bookingStatus: "confirmed",
      lookup: { status: "Completed" },
    })
    render(<PublicKhaltiPaymentResultPage />)

    expect(await screen.findByText(/payment successful/i)).toBeInTheDocument()
    expect(screen.getByText("Therapist")).toBeInTheDocument()
    expect(screen.getByText("Payment status")).toBeInTheDocument()
    expect(screen.getByText("paid")).toBeInTheDocument()
  })
})
