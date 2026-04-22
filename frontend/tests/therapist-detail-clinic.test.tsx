import { render, screen } from "@testing-library/react"
import TherapistDetailPage from "@/app/therapists/[id]/page"

const { getPublicById, listAvailability, listFeedback } = vi.hoisted(() => ({
  getPublicById: vi.fn(),
  listAvailability: vi.fn(),
  listFeedback: vi.fn(),
}))

vi.mock("react", async () => {
  const actual = await vi.importActual<typeof import("react")>("react")
  return {
    ...actual,
    use: () => ({ id: "therapist-1" }),
  }
})

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

vi.mock("@/components/navbar", () => ({ Navbar: () => <div /> }))
vi.mock("@/components/footer", () => ({ Footer: () => <div /> }))
vi.mock("@/components/providers/auth-provider", () => ({
  useAuth: () => ({ user: null }),
}))
vi.mock("@/components/maps/clinic-display-map", () => ({
  ClinicDisplayMap: ({ latitude, longitude }: { latitude: number; longitude: number }) => (
    <div data-testid="clinic-display-map">
      {latitude},{longitude}
    </div>
  ),
}))
vi.mock("@/services", () => ({
  therapistService: {
    getPublicById,
    listAvailability,
  },
  feedbackService: {
    list: listFeedback,
  },
  appointmentService: {
    create: vi.fn(),
  },
}))

describe("Therapist detail clinic section", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getPublicById.mockResolvedValue({
      id: "therapist-1",
      userId: "u1",
      user: { name: "Dr Calm" },
      title: "Psychologist",
      specializations: ["Stress"],
      qualifications: ["MPhil Clinical Psychology"],
      experience: 7,
      languages: ["English", "Nepali"],
      sessionTypes: ["video"],
      pricePerSession: 2500,
      rating: 0,
      reviewCount: 0,
      isApproved: true,
      approvalStatus: "approved",
      licenseNumber: "LIC-220",
      clinic: {
        id: "clinic-1",
        clinicName: "Calm Space Clinic",
        clinicAddress: "Putalisadak, Kathmandu",
        latitude: 27.7123,
        longitude: 85.3189,
        phone: "9800001234",
        openingHours: "Sun-Fri, 9 AM - 5 PM",
        notes: "Second floor.",
        createdAt: "2099-01-01T10:00:00Z",
        updatedAt: "2099-01-01T10:00:00Z",
      },
    })
    listAvailability.mockResolvedValue([])
    listFeedback.mockResolvedValue([])
  })

  it("shows clinic details and the clinic map", async () => {
    render(<TherapistDetailPage params={Promise.resolve({ id: "therapist-1" })} />)

    expect(await screen.findByText("Calm Space Clinic")).toBeInTheDocument()
    expect(screen.getByText("Putalisadak, Kathmandu")).toBeInTheDocument()
    expect(screen.getByText(/personal clinic: available/i)).toBeInTheDocument()
    expect(screen.getByTestId("clinic-display-map")).toBeInTheDocument()
  })
})
