import { api } from "@/lib/api"
import type { Resource, ResourceCategory } from "@/lib/types"

export const resourceService = {
  list(params?: { category?: string; search?: string }): Promise<Resource[]> {
    return api.getResources(params)
  },
  listAdmin(params?: { category?: string; search?: string }): Promise<Resource[]> {
    return api.listResources(params, { auth: true })
  },
  getById(id: string): Promise<Resource> {
    return api.getResource(id)
  },
  getOwnedById(id: string): Promise<Resource> {
    return api.getResource(id, { auth: true })
  },
  listCategories(): Promise<ResourceCategory[]> {
    return api.getCategories()
  },
  createCategory(payload: { name: string; description?: string }): Promise<ResourceCategory> {
    return api.createCategory(payload)
  },
  updateCategory(id: string, payload: { name: string; description?: string }): Promise<ResourceCategory> {
    return api.updateCategory(id, payload)
  },
  deleteCategory(id: string): Promise<void> {
    return api.deleteCategory(id)
  },
  createResource(payload: {
    title: string
    category: string
    summary?: string
    content: string
    format: string
    published: boolean
  }): Promise<Resource> {
    return api.createResource(payload)
  },
  updateResource(
    id: string,
    payload: {
      title: string
      category: string
      summary?: string
      content: string
      format: string
      published: boolean
    }
  ): Promise<Resource> {
    return api.updateResource(id, payload)
  },
  deleteResource(id: string): Promise<void> {
    return api.deleteResource(id)
  },
}
