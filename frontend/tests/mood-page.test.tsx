import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import MoodTrackerPage from "@/app/(dashboard)/dashboard/mood/page"

const { create, list } = vi.hoisted(() => ({
  create: vi.fn(),
  list: vi.fn(),
}))

vi.mock("@/services", () => ({
  moodService: {
    create,
    list,
  },
}))

describe("Mood tracker", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    list.mockResolvedValue([])
    create.mockResolvedValue({})
  })

  it("submits a mood entry", async () => {
    render(<MoodTrackerPage />)
    await screen.findByText(/weekly wellbeing score/i)

    fireEvent.click(screen.getByRole("button", { name: /happy/i }))
    const spinbuttons = screen.getAllByRole("spinbutton")
    fireEvent.change(spinbuttons[0], { target: { value: "2" } })
    fireEvent.change(spinbuttons[1], { target: { value: "4" } })
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Feeling better" } })
    fireEvent.click(screen.getByRole("button", { name: /save entry/i }))

    await waitFor(() =>
      expect(create).toHaveBeenCalledWith(
        expect.objectContaining({
          mood: "happy",
          stressLevel: 2,
          energyLevel: 4,
          notes: "Feeling better",
        })
      )
    )
  })
})
