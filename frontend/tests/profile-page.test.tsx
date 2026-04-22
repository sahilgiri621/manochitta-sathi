import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import ProfilePage from "@/app/(dashboard)/dashboard/profile/page"

const { getMyProfile, updateMyProfile } = vi.hoisted(() => ({
  getMyProfile: vi.fn(),
  updateMyProfile: vi.fn(),
}))

vi.mock("@/components/providers/auth-provider", () => ({
  useAuth: () => ({
    user: {
      id: "user-1",
      email: "patient@example.com",
      phone: "9800000000",
      name: "Patient User",
      role: "user",
      isVerified: true,
    },
  }),
}))

vi.mock("@/services", () => ({
  profileService: {
    getMyProfile,
    updateMyProfile,
  },
}))

const profile = {
  id: "profile-1",
  age: 28,
  gender: "",
  wellbeingGoals: "",
  bio: "",
  address: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
  createdAt: "",
  updatedAt: "",
}

describe("Profile page", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getMyProfile.mockResolvedValue(profile)
    updateMyProfile.mockImplementation((payload) => Promise.resolve({ ...profile, ...payload }))
  })

  it("lets the user select and save gender", async () => {
    render(<ProfilePage />)

    const genderSelect = await screen.findByLabelText(/gender/i)
    expect(genderSelect).toBeDisabled()

    fireEvent.click(screen.getByRole("button", { name: /edit profile/i }))
    fireEvent.change(genderSelect, { target: { value: "female" } })
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }))

    await waitFor(() =>
      expect(updateMyProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          gender: "female",
        }),
      ),
    )
  })
})
