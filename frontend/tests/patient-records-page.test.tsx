import { render, screen } from "@testing-library/react"
import PatientRecordsPage from "@/app/(dashboard)/dashboard/records/page"

const { list } = vi.hoisted(() => ({
  list: vi.fn(),
}))

vi.mock("@/services", () => ({
  patientRecordService: {
    list,
  },
}))

describe("Patient records page", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("shows the logged-in user's records", async () => {
    list.mockResolvedValue([
      {
        id: "r1",
        patient: "u1",
        patientName: "Patient One",
        therapist: "t1",
        therapistName: "Dr Calm",
        appointment: "a1",
        appointmentScheduledStart: "2099-01-01T10:00:00Z",
        notes: "Discussed sleep patterns.",
        diagnosisNotes: "Mild anxiety symptoms.",
        recommendations: "Continue breathing practice.",
        sessionSummary: "Patient was engaged.",
        patientProgress: "Improving gradually.",
        nextSteps: "Check in next week.",
        riskFlag: "",
        completedAt: "2099-01-01T10:50:00Z",
        createdAt: "2099-01-01T10:00:00Z",
        updatedAt: "2099-01-01T10:30:00Z",
      },
    ])

    render(<PatientRecordsPage />)

    expect(await screen.findByText("Dr Calm")).toBeInTheDocument()
    expect(screen.getByText("Discussed sleep patterns.")).toBeInTheDocument()
    expect(screen.getByText("Continue breathing practice.")).toBeInTheDocument()
    expect(screen.getByText("Improving gradually.")).toBeInTheDocument()
  })
})
