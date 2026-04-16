import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import AdminResourcesPage from "@/app/(admin)/admin/resources/page"

const listAdmin = vi.fn()
const listCategories = vi.fn()
const createResource = vi.fn()
const updateResource = vi.fn()
const deleteResource = vi.fn()

vi.mock("@/services", () => ({
  resourceService: {
    listAdmin,
    listCategories,
    createResource,
    updateResource,
    deleteResource,
  },
}))

describe("Admin resource form", () => {
  beforeEach(() => {
    listAdmin.mockResolvedValue([])
    listCategories.mockResolvedValue([
      { id: "1", name: "Self Help", slug: "self-help", description: "Self help content" },
      { id: "2", name: "Videos", slug: "videos", description: "Video content" },
    ])
    createResource.mockResolvedValue({})
    updateResource.mockResolvedValue({})
    deleteResource.mockResolvedValue({})
  })

  it("loads categories into the dropdown and submits selected category", async () => {
    render(<AdminResourcesPage />)

    await screen.findByText(/new resource/i)
    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: "Breathing Basics" } })
    fireEvent.change(screen.getByLabelText(/category/i), { target: { value: "2" } })
    fireEvent.change(screen.getByLabelText(/content/i), { target: { value: "Video breathing guide" } })
    fireEvent.click(screen.getByRole("button", { name: /create resource/i }))

    await waitFor(() =>
      expect(createResource).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Breathing Basics",
          category: "2",
          content: "Video breathing guide",
        })
      )
    )
  })

  it("shows a helpful empty-category state when no categories exist", async () => {
    listCategories.mockResolvedValue([])

    render(<AdminResourcesPage />)

    expect(await screen.findByText(/no categories available/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /create resource/i })).toBeDisabled()
  })
}
