import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import TherapistAppointmentsPage from "@/app/(therapist)/therapist/appointments/page"

const { listAppointments, completeAppointment } = vi.hoisted(() => ({
  listAppointments: vi.fn(),
  completeAppointment: vi.fn(),
}))

vi.mock("@/services", () => ({
  appointmentService: {
    list: listAppointments,
    complete: completeAppointment,
  },
}))

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

describe("Therapist appointments page", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    listAppointments.mockResolvedValue([
      {
        id: "a1",
        userId: "u1",
        userName: "Patient One",
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
    completeAppointment.mockResolvedValue({})
  })

  it("shows the join meeting action for ready sessions", async () => {
    render(<TherapistAppointmentsPage />)

    await screen.findByText("Patient One")
    const joinLink = screen.getByRole("link", { name: /join meeting/i })
    expect(joinLink).toHaveAttribute("href", "https://meet.google.com/test-link")
  })

  it("requires the completion form payload before saving completion", async () => {
    render(<TherapistAppointmentsPage />)

    await screen.findByText("Patient One")
    fireEvent.click(screen.getByRole("button", { name: /^complete$/i }))
    fireEvent.change(screen.getByLabelText(/session notes/i), { target: { value: "Patient participated well." } })
    fireEvent.change(screen.getByLabelText(/session summary/i), { target: { value: "Discussed coping strategies." } })
    fireEvent.change(screen.getByLabelText(/patient progress \/ condition/i), { target: { value: "Showing improvement." } })
    fireEvent.change(screen.getByLabelText(/recommendations \/ follow-up/i), { target: { value: "Continue journaling." } })
    fireEvent.change(screen.getByLabelText(/next steps/i), { target: { value: "Schedule follow-up next week." } })
    fireEvent.click(screen.getByRole("button", { name: /save and complete/i }))

    await waitFor(() =>
      expect(completeAppointment).toHaveBeenCalledWith(
        "a1",
        expect.objectContaining({
          notes: "Patient participated well.",
          sessionSummary: "Discussed coping strategies.",
          patientProgress: "Showing improvement.",
          recommendations: "Continue journaling.",
          nextSteps: "Schedule follow-up next week.",
        })
      )
    )
  })
})
