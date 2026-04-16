import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import TherapistRecordsPage from "@/app/(therapist)/therapist/records/page"

const { listAppointments, listRecords, create, update } = vi.hoisted(() => ({
  listAppointments: vi.fn(),
  listRecords: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
}))

vi.mock("@/services", () => ({
  appointmentService: {
    list: listAppointments,
  },
  patientRecordService: {
    list: listRecords,
    create,
    update,
  },
}))

describe("Therapist records page", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    listAppointments.mockResolvedValue([
      {
        id: "a1",
        userId: "u1",
        userName: "Patient One",
        therapistName: "Dr Calm",
        scheduledStart: "2099-01-01T10:00:00Z",
        status: "completed",
      },
    ])
    listRecords.mockResolvedValue([
      {
        id: "r1",
        patient: "u1",
        patientName: "Patient One",
        therapist: "t1",
        therapistName: "Dr Calm",
        appointment: "a1",
        appointmentScheduledStart: "2099-01-01T10:00:00Z",
        notes: "Initial note.",
        diagnosisNotes: "",
        recommendations: "",
        sessionSummary: "",
        patientProgress: "",
        nextSteps: "",
        riskFlag: "",
        completedAt: "",
        createdAt: "2099-01-01T10:00:00Z",
        updatedAt: "2099-01-01T10:30:00Z",
      },
    ])
    create.mockResolvedValue({})
    update.mockResolvedValue({})
  })

  it("creates a patient record for an assigned patient", async () => {
    render(<TherapistRecordsPage />)

    await screen.findByRole("button", { name: /save record/i })
    fireEvent.change(screen.getByLabelText(/^patient$/i), { target: { value: "u1" } })
    await waitFor(() => expect(screen.getByRole("option", { name: /completed/i })).toBeInTheDocument())
    fireEvent.change(screen.getByLabelText(/related appointment/i), { target: { value: "a1" } })
    fireEvent.change(screen.getByLabelText(/notes \/ observations/i), { target: { value: "Progress note" } })
    fireEvent.change(screen.getByLabelText(/session summary/i), { target: { value: "Good discussion" } })
    fireEvent.click(screen.getByRole("button", { name: /save record/i }))

    await waitFor(() =>
      expect(create).toHaveBeenCalledWith(
        expect.objectContaining({
          patient: "u1",
          appointment: "a1",
          notes: "Progress note",
          sessionSummary: "Good discussion",
        })
      )
    )
  })

  it("loads an existing record into the form and updates it", async () => {
    render(<TherapistRecordsPage />)

    await screen.findByText("Initial note.")
    fireEvent.click(screen.getByRole("button", { name: /edit/i }))
    fireEvent.change(screen.getByLabelText(/notes \/ observations/i), { target: { value: "Updated note" } })
    fireEvent.click(screen.getByRole("button", { name: /update record/i }))

    await waitFor(() =>
      expect(update).toHaveBeenCalledWith(
        "r1",
        expect.objectContaining({
          patient: "u1",
          appointment: "a1",
          notes: "Updated note",
        })
      )
    )
  })
})
