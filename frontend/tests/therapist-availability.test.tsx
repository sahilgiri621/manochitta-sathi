import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import TherapistAvailabilityPage from "@/app/(therapist)/therapist/availability/page"

const { listAvailability, createAvailability, updateAvailability, deleteAvailability } = vi.hoisted(() => ({
  listAvailability: vi.fn(),
  createAvailability: vi.fn(),
  updateAvailability: vi.fn(),
  deleteAvailability: vi.fn(),
}))

vi.mock("@/services", () => ({
  therapistService: {
    listAvailability,
    createAvailability,
    updateAvailability,
    deleteAvailability,
  },
}))

describe("Therapist availability management", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    listAvailability.mockResolvedValue([
      {
        id: "slot-1",
        therapistId: "therapist-1",
        startTime: "2099-01-01T10:00:00Z",
        endTime: "2099-01-01T11:00:00Z",
        isAvailable: true,
      },
    ])
    createAvailability.mockResolvedValue({})
    updateAvailability.mockResolvedValue({})
    deleteAvailability.mockResolvedValue({})
  })

  it("creates a new slot using the therapist service", async () => {
    render(<TherapistAvailabilityPage />)

    await screen.findByText(/current slots/i)
    expect(
      screen.getByText(/by creating this slot, you agree that any successfully paid booking for it will be confirmed automatically/i)
    ).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText(/date/i), { target: { value: "2099-01-02" } })
    fireEvent.change(screen.getByLabelText(/start time/i), { target: { value: "09:00" } })
    fireEvent.click(screen.getByRole("button", { name: /add slot/i }))

    await waitFor(() => {
      expect(createAvailability).toHaveBeenCalledTimes(1)
      const [startIso, endIso] = createAvailability.mock.calls[0]
      expect(startIso).toMatch(/^2099-01-02T/)
      expect(endIso).toMatch(/^2099-01-02T/)
      expect(new Date(endIso).getTime() - new Date(startIso).getTime()).toBe(60 * 60 * 1000)
    })
  })

  it("loads existing slots and allows entering edit mode", async () => {
    render(<TherapistAvailabilityPage />)

    await screen.findByText(/showing 1-1 of 1 slots/i)
    fireEvent.click(screen.getByRole("button", { name: /edit/i }))

    expect(screen.getByRole("button", { name: /update slot/i })).toBeInTheDocument()
  })

  it("paginates slot cards at 20 per page", async () => {
    listAvailability.mockResolvedValue(
      Array.from({ length: 21 }, (_, index) => ({
        id: `slot-${index + 1}`,
        therapistId: "therapist-1",
        startTime: `2099-01-${String((index % 9) + 1).padStart(2, "0")}T10:00:00Z`,
        endTime: `2099-01-${String((index % 9) + 1).padStart(2, "0")}T11:00:00Z`,
        isAvailable: true,
      }))
    )

    render(<TherapistAvailabilityPage />)

    await screen.findByText(/showing 1-20 of 21 slots/i)
    fireEvent.click(screen.getByRole("button", { name: /next/i }))

    expect(await screen.findByText(/showing 21-21 of 21 slots/i)).toBeInTheDocument()
  })
})
