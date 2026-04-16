import { render, screen } from "@testing-library/react"
import AppointmentsPage from "@/app/(dashboard)/dashboard/appointments/page"

const { listAppointments, cancelAppointment } = vi.hoisted(() => ({
  listAppointments: vi.fn(),
  cancelAppointment: vi.fn(),
}))

vi.mock("@/services", () => ({
  appointmentService: {
    list: listAppointments,
    cancel: cancelAppointment,
  },
}))

describe("Appointments payment flow", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    listAppointments.mockResolvedValue([
      {
        id: "a1",
        userId: "u1",
        userName: "User One",
        therapistId: "t1",
        therapistName: "Dr Calm",
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
      },
    ])
  })

  it("links unpaid appointments to the dedicated payment page", async () => {
    render(<AppointmentsPage />)

    await screen.findByText("Dr Calm")
    const payLink = screen.getByRole("link", { name: /pay with khalti/i })
    expect(payLink).toHaveAttribute("href", "/dashboard/appointments/payment/a1")
  })

  it("shows join meeting when a confirmed appointment has a ready meet link", async () => {
    listAppointments.mockResolvedValue([
      {
        id: "a2",
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
        paidAmount: 250000,
        khaltiPidx: "pidx-1",
        paymentTransactionId: "txn-1",
        paymentInitiatedAt: "2099-01-01T09:00:00Z",
        paymentVerifiedAt: "2099-01-01T09:05:00Z",
        meetingProvider: "google_meet",
        meetingLink: "https://meet.google.com/test-link",
        externalCalendarEventId: "calendar-event-1",
        meetingStatus: "ready",
        meetingCreatedAt: "2099-01-01T09:05:30Z",
        notes: "",
        cancellationReason: "",
        therapistResponseNote: "",
        rescheduledFrom: null,
        events: [],
        createdAt: "2099-01-01T09:00:00Z",
        updatedAt: "2099-01-01T09:05:30Z",
      },
    ])

    render(<AppointmentsPage />)

    await screen.findByText("Dr Calm")
    const joinLink = screen.getByRole("link", { name: /join meeting/i })
    expect(joinLink).toHaveAttribute("href", "https://meet.google.com/test-link")
  })
})
