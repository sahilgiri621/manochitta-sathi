import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import TherapistDetailPage from "@/app/therapists/[id]/page"

const { createAppointment, listAvailability, getPublicById, listFeedback } = vi.hoisted(() => ({
  createAppointment: vi.fn(),
  listAvailability: vi.fn(),
  getPublicById: vi.fn(),
  listFeedback: vi.fn(),
}))
const { push } = vi.hoisted(() => ({
  push: vi.fn(),
}))

vi.mock("react", async () => {
  const actual = await vi.importActual<typeof import("react")>("react")
  return {
    ...actual,
    use: () => ({ id: "therapist-1" }),
  }
})
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}))

vi.mock("@/components/navbar", () => ({ Navbar: () => <div /> }))
vi.mock("@/components/footer", () => ({ Footer: () => <div /> }))
vi.mock("@/components/maps/clinic-display-map", () => ({
  ClinicDisplayMap: () => <div data-testid="clinic-display-map" />,
}))
vi.mock("@/components/providers/auth-provider", () => ({
  useAuth: () => ({ user: { role: "user" } }),
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
    create: createAppointment,
  },
}))

describe("Therapist booking flow", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getPublicById.mockResolvedValue({
      id: "therapist-1",
      user: { name: "Dr Test" },
      title: "Psychologist",
      specializations: ["Stress"],
      qualifications: [],
      experience: 5,
      languages: ["English"],
      sessionTypes: ["video"],
      pricePerSession: 2000,
      approvalStatus: "approved",
      isApproved: true,
      userId: "u1",
      rating: 0,
      reviewCount: 0,
      clinic: null,
    })
    listAvailability.mockResolvedValue([
      {
        id: "slot-1",
        therapistId: "therapist-1",
        startTime: "2099-01-01T10:00:00Z",
        endTime: "2099-01-01T10:50:00Z",
        isAvailable: true,
      },
    ])
    listFeedback.mockResolvedValue([])
    createAppointment.mockResolvedValue({
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
      notes: "",
      cancellationReason: "",
      therapistResponseNote: "",
      rescheduledFrom: null,
      events: [],
      createdAt: "2099-01-01T09:00:00Z",
      updatedAt: "2099-01-01T09:00:00Z",
    })
  })

  it("books an appointment using an available slot and routes to payment", async () => {
    render(<TherapistDetailPage params={Promise.resolve({ id: "therapist-1" })} />)

    await screen.findByText("Dr Test")
    const slotButton = screen.getAllByRole("button").find((button) => /am|pm/i.test(button.textContent || ""))
    expect(slotButton).toBeDefined()
    fireEvent.click(slotButton!)
    fireEvent.click(screen.getByRole("button", { name: /continue to payment/i }))

    await waitFor(() =>
      expect(createAppointment).toHaveBeenCalledWith({
        therapistId: "therapist-1",
        availabilitySlotId: "slot-1",
        sessionType: "video",
      })
    )
    await waitFor(() => expect(push).toHaveBeenCalledWith("/dashboard/appointments/payment/appointment-1"))
  })

  it("does not render past or unavailable slots as selectable", async () => {
    listAvailability.mockResolvedValue([
      {
        id: "slot-past",
        therapistId: "therapist-1",
        startTime: "2000-01-01T10:00:00Z",
        endTime: "2000-01-01T10:50:00Z",
        isAvailable: true,
      },
      {
        id: "slot-unavailable",
        therapistId: "therapist-1",
        startTime: "2099-01-01T11:00:00Z",
        endTime: "2099-01-01T11:50:00Z",
        isAvailable: false,
      },
    ])

    render(<TherapistDetailPage params={Promise.resolve({ id: "therapist-1" })} />)

    await screen.findByText("Dr Test")
    expect(screen.getByText(/no open slots available right now/i)).toBeInTheDocument()
  })

  it("tells users that verified payment confirms the slot automatically", async () => {
    render(<TherapistDetailPage params={Promise.resolve({ id: "therapist-1" })} />)

    await screen.findByText("Dr Test")
    expect(
      screen.getByText(/this published slot is already committed by the therapist/i)
    ).toBeInTheDocument()
  })
})
