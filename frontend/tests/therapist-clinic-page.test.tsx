import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import TherapistClinicPage from "@/app/(therapist)/therapist/clinic/page"

const { getMyClinic, saveMyClinic } = vi.hoisted(() => ({
  getMyClinic: vi.fn(),
  saveMyClinic: vi.fn(),
}))

vi.mock("@/components/maps/clinic-location-picker", () => ({
  ClinicLocationPicker: ({
    onChange,
  }: {
    onChange: (value: { latitude: number; longitude: number }) => void
  }) => (
    <button onClick={() => onChange({ latitude: 27.7123, longitude: 85.3189 })} type="button">
      Pick location
    </button>
  ),
}))

vi.mock("@/services", () => ({
  therapistService: {
    getMyClinic,
    saveMyClinic,
  },
}))

describe("Therapist clinic page", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getMyClinic.mockResolvedValue(null)
    saveMyClinic.mockResolvedValue({
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
    })
  })

  it("saves clinic details with map-selected coordinates", async () => {
    render(<TherapistClinicPage />)

    await screen.findByRole("button", { name: /save clinic/i })
    fireEvent.change(screen.getByLabelText(/clinic name/i), { target: { value: "Calm Space Clinic" } })
    fireEvent.change(screen.getByLabelText(/clinic address/i), { target: { value: "Putalisadak, Kathmandu" } })
    fireEvent.change(screen.getByLabelText(/^phone$/i), { target: { value: "9800001234" } })
    fireEvent.change(screen.getByLabelText(/opening hours/i), { target: { value: "Sun-Fri, 9 AM - 5 PM" } })
    fireEvent.click(screen.getByRole("button", { name: /pick location/i }))
    fireEvent.click(screen.getByRole("button", { name: /save clinic/i }))

    await waitFor(() =>
      expect(saveMyClinic).toHaveBeenCalledWith(
        expect.objectContaining({
          clinicName: "Calm Space Clinic",
          clinicAddress: "Putalisadak, Kathmandu",
          latitude: 27.7123,
          longitude: 85.3189,
          phone: "9800001234",
          openingHours: "Sun-Fri, 9 AM - 5 PM",
        })
      )
    )
  })
})
