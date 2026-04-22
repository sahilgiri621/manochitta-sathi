import { fireEvent, render, screen } from "@testing-library/react"
import TherapistClientsPage from "@/app/(therapist)/therapist/clients/page"

const { listAssignedPatients } = vi.hoisted(() => ({
  listAssignedPatients: vi.fn(),
}))

vi.mock("@/services", () => ({
  profileService: {
    listAssignedPatients,
  },
}))

describe("Therapist clients page", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    listAssignedPatients.mockResolvedValue([
      {
        id: "u1",
        name: "Patient One",
        email: "patient-one@example.com",
        phone: "9800000001",
        age: 31,
        gender: "female",
        wellbeingGoals: "Manage anxiety",
        bio: "Prefers evening sessions.",
        address: "Kathmandu",
        emergencyContactName: "Family Contact",
        emergencyContactPhone: "9800000002",
        appointmentCount: 2,
        lastAppointmentAt: "2099-01-01T10:00:00Z",
      },
      {
        id: "u2",
        name: "Patient Two",
        email: "patient-two@example.com",
        phone: "",
        age: null,
        gender: "",
        wellbeingGoals: "",
        bio: "",
        address: "",
        emergencyContactName: "",
        emergencyContactPhone: "",
        appointmentCount: 1,
        lastAppointmentAt: "2099-01-02T10:00:00Z",
      },
    ])
  })

  it("shows assigned patient profile details", async () => {
    render(<TherapistClientsPage />)

    expect(await screen.findAllByText("Patient One")).toHaveLength(2)
    expect(screen.getByText("patient-one@example.com")).toBeInTheDocument()
    expect(screen.getByText("9800000001")).toBeInTheDocument()
    expect(screen.getByText("Female")).toBeInTheDocument()
    expect(screen.getByText("Manage anxiety")).toBeInTheDocument()
    expect(screen.getByText("Family Contact")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: /patient two/i }))

    expect(screen.getByText("patient-two@example.com")).toBeInTheDocument()
  })
})
