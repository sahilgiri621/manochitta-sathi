import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import TherapistResourcesPage from "@/app/(therapist)/therapist/resources/page"

const listAdmin = vi.fn()
const listCategories = vi.fn()
const createResource = vi.fn()
const updateResource = vi.fn()
const deleteResource = vi.fn()
const getOwnedById = vi.fn()

vi.mock("@/services", () => ({
  resourceService: {
    listAdmin,
    listCategories,
    createResource,
    updateResource,
    deleteResource,
    getOwnedById,
  },
}))

describe("Therapist resources page", () => {
  beforeEach(() => {
    listAdmin.mockResolvedValue([])
    listCategories.mockResolvedValue([
      { id: "1", name: "Self Help", slug: "self-help", description: "Self help content" },
    ])
    createResource.mockResolvedValue({})
    updateResource.mockResolvedValue({})
    deleteResource.mockResolvedValue({})
    getOwnedById.mockResolvedValue({
      id: "resource-1",
      title: "My Guide",
      categoryId: "1",
      category: "Self Help",
      summary: "Short summary",
      content: "Full content",
      format: "article",
      published: true,
    })
  })

  it("lets a therapist create a resource with category selection", async () => {
    render(<TherapistResourcesPage />)

    await screen.findByText(/publish new resource/i)
    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: "Coping Skills" } })
    fireEvent.change(screen.getByLabelText(/category/i), { target: { value: "1" } })
    fireEvent.change(screen.getByLabelText(/content/i), { target: { value: "Helpful coping skill content" } })
    fireEvent.click(screen.getByRole("button", { name: /publish resource/i }))

    await waitFor(() =>
      expect(createResource).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Coping Skills",
          category: "1",
          content: "Helpful coping skill content",
        })
      )
    )
  })
})
