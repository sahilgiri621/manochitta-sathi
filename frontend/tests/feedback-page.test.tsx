import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import FeedbackPage from "@/app/(dashboard)/dashboard/feedback/page"

const { listAppointments, listFeedback, submit } = vi.hoisted(() => ({
  listAppointments: vi.fn(),
  listFeedback: vi.fn(),
  submit: vi.fn(),
}))

vi.mock("@/services", () => ({
  appointmentService: {
    list: listAppointments,
  },
  feedbackService: {
    list: listFeedback,
    submit,
  },
}))

describe("Feedback submission", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    listAppointments.mockResolvedValue([
      {
        id: "a1",
        therapistName: "Dr Calm",
        scheduledStart: "2099-01-01T10:00:00Z",
        status: "completed",
      },
    ])
    listFeedback.mockResolvedValue([])
    submit.mockResolvedValue({})
  })

  it("submits feedback for a completed appointment", async () => {
    render(<FeedbackPage />)
    await screen.findByText(/leave feedback/i)

    fireEvent.click(screen.getByRole("button", { name: /4 stars/i }))
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Helpful" } })
    fireEvent.click(screen.getByRole("button", { name: /submit feedback/i }))

    await waitFor(() => expect(submit).toHaveBeenCalledWith("a1", 4, "Helpful", 5))
  })
})
