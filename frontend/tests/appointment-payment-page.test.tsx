import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import AppointmentPaymentPage from "@/app/(dashboard)/dashboard/appointments/payment/[appointmentId]/page"

const { getAppointmentById, getTherapistById, initiateKhaltiPayment } = vi.hoisted(() => ({
  getAppointmentById: vi.fn(),
  getTherapistById: vi.fn(),
  initiateKhaltiPayment: vi.fn(),
}))

vi.mock("react", async () => {
  const actual = await vi.importActual<typeof import("react")>("react")
  return {
    ...actual,
    use: () => ({ appointmentId: "appointment-1" }),
  }
})

vi.mock("@/services", () => ({
  appointmentService: {
    getById: getAppointmentById,
  },
  therapistService: {
    getPublicById: getTherapistById,
  },
  paymentService: {
    initiateKhaltiPayment,
  },
}))
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

describe("Appointment payment page", () => {
  const assign = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { assign },
    })

    getAppointmentById.mockResolvedValue({
      id: "appointment-1",
      userId: "user-1",
      userName: "Patient",
      therapistId: "therapist-1",
      therapistName: "Dr Test",
      availabilitySlotId: "slot-1",
      sessionType: "video",
      scheduledStart: "2099-01-01T10:00:00Z",
      scheduledEnd: "2099-01-01T10:50:00Z",
      status: "pending_payment",
      paymentStatus: "unpaid",
      paymentProvider: "",
      paidAmount: 0,
      khaltiPidx: "",
      paymentTransactionId: "",
      paymentInitiatedAt: "",
      paymentVerifiedAt: "",
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
      updatedAt: "2099-01-01T09:00:00Z",
    })
    getTherapistById.mockResolvedValue({
      id: "therapist-1",
      userId: "user-therapist",
      user: { id: "user-therapist", role: "therapist", name: "Dr Test", email: "dr@test.com", isVerified: true },
      title: "Psychologist",
      bio: "",
      specializations: ["Stress"],
      qualifications: [],
      experience: 5,
      languages: ["English"],
      sessionTypes: ["video"],
      pricePerSession: 2500,
      rating: 0,
      reviewCount: 0,
      isApproved: true,
      approvalStatus: "approved",
      clinic: null,
    })
    initiateKhaltiPayment.mockResolvedValue({
      appointment: "appointment-1",
      pidx: "pidx-1",
      paymentUrl: "https://test-pay.khalti.com",
      amount: 250000,
    })
  })

  it("loads the booking summary and redirects to Khalti on confirm", async () => {
    render(<AppointmentPaymentPage params={Promise.resolve({ appointmentId: "appointment-1" })} />)

    await screen.findByText("Complete Your Payment")
    expect(await screen.findByText("Dr Test")).toBeInTheDocument()
    expect(screen.getByText("NPR 2,500")).toBeInTheDocument()
    expect(screen.getByText("Pay with Khalti")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: /confirm booking and pay/i }))

    await waitFor(() => expect(initiateKhaltiPayment).toHaveBeenCalledWith("appointment-1"))
    await waitFor(() => expect(assign).toHaveBeenCalledWith("https://test-pay.khalti.com"))
  })

  it("shows a clear error when the backend does not return a payment url", async () => {
    initiateKhaltiPayment.mockResolvedValue({
      appointment: "appointment-1",
      pidx: "pidx-1",
      paymentUrl: "",
      amount: 250000,
    })

    render(<AppointmentPaymentPage params={Promise.resolve({ appointmentId: "appointment-1" })} />)

    await screen.findByText("Complete Your Payment")
    fireEvent.click(screen.getByRole("button", { name: /confirm booking and pay/i }))

    expect(await screen.findByText("Payment initiation failed: backend did not return a Khalti payment URL.")).toBeInTheDocument()
    expect(assign).not.toHaveBeenCalled()
  })
})
