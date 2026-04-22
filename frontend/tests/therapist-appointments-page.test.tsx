import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import TherapistAppointmentsPage from "@/app/(therapist)/therapist/appointments/page"

const { listAppointments, completeAppointment, confirmAttendance } = vi.hoisted(() => ({
  listAppointments: vi.fn(),
  completeAppointment: vi.fn(),
  confirmAttendance: vi.fn(),
}))

vi.mock("@/services", () => ({
  appointmentService: {
    list: listAppointments,
    complete: completeAppointment,
    confirmAttendance,
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
        requiresAttendanceConfirmation: false,
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
    listAppointments.mockResolvedValueOnce([
      {
        id: "a1",
        userId: "u1",
        userName: "Patient One",
        therapistId: "t1",
        therapistName: "Dr Calm",
        availabilitySlotId: "slot-1",
        sessionType: "video",
        scheduledStart: "2020-01-01T10:00:00Z",
        scheduledEnd: "2020-01-01T10:50:00Z",
        status: "confirmed",
        paymentStatus: "paid",
        paymentProvider: "khalti",
        paidAmount: 250000,
        khaltiPidx: "pidx-1",
        paymentTransactionId: "txn-1",
        paymentInitiatedAt: "2020-01-01T09:00:00Z",
        paymentVerifiedAt: "2020-01-01T09:05:00Z",
        meetingProvider: "google_meet",
        meetingLink: "https://meet.google.com/test-link",
        externalCalendarEventId: "calendar-event-1",
        meetingStatus: "ready",
        meetingCreatedAt: "2020-01-01T09:05:30Z",
        notes: "",
        cancellationReason: "",
        therapistResponseNote: "",
        rescheduledFrom: null,
        requiresAttendanceConfirmation: true,
        events: [],
        createdAt: "2020-01-01T09:00:00Z",
        updatedAt: "2020-01-01T09:05:30Z",
      },
    ])
    render(<TherapistAppointmentsPage />)

    fireEvent.click(await screen.findByRole("tab", { name: /follow up/i }))
    await screen.findByText("Patient One")
    fireEvent.click(screen.getByRole("button", { name: /complete session record/i }))
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

  it("requires a therapist reason before marking a follow-up appointment as missed", async () => {
    listAppointments.mockResolvedValueOnce([
      {
        id: "a1",
        userId: "u1",
        userName: "Patient One",
        therapistId: "t1",
        therapistName: "Dr Calm",
        availabilitySlotId: "slot-1",
        sessionType: "video",
        scheduledStart: "2020-01-01T10:00:00Z",
        scheduledEnd: "2020-01-01T10:50:00Z",
        status: "confirmed",
        paymentStatus: "paid",
        paymentProvider: "khalti",
        paidAmount: 250000,
        khaltiPidx: "pidx-1",
        paymentTransactionId: "txn-1",
        paymentInitiatedAt: "2020-01-01T09:00:00Z",
        paymentVerifiedAt: "2020-01-01T09:05:00Z",
        meetingProvider: "google_meet",
        meetingLink: "https://meet.google.com/test-link",
        externalCalendarEventId: "calendar-event-1",
        meetingStatus: "ready",
        meetingCreatedAt: "2020-01-01T09:05:30Z",
        notes: "",
        cancellationReason: "",
        therapistResponseNote: "",
        rescheduledFrom: null,
        requiresAttendanceConfirmation: true,
        events: [],
        createdAt: "2020-01-01T09:00:00Z",
        updatedAt: "2020-01-01T09:05:30Z",
      },
    ])
    confirmAttendance.mockResolvedValue({})

    render(<TherapistAppointmentsPage />)

    fireEvent.click(await screen.findByRole("tab", { name: /follow up/i }))
    await screen.findByText("Patient One")
    fireEvent.click(screen.getByRole("button", { name: /mark missed/i }))
    expect(screen.getByText(/why was this session missed/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /mark session missed/i })).toBeDisabled()

    fireEvent.change(screen.getByLabelText(/therapist reason/i), {
      target: { value: "I was unavailable and could not join the call." },
    })
    fireEvent.click(screen.getByRole("button", { name: /mark session missed/i }))

    await waitFor(() =>
      expect(confirmAttendance).toHaveBeenCalledWith(
        "a1",
        false,
        "I was unavailable and could not join the call.",
      ),
    )
  })
})
