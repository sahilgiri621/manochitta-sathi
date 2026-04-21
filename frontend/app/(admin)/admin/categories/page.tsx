"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { AdminPagination } from "@/components/admin/admin-pagination"
import { toast } from "sonner"
import { resourceService } from "@/services"
import type { ResourceCategory } from "@/lib/types"

const PAGE_SIZE = 10

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<ResourceCategory[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadCategories = async (nextPage = page) => {
    setIsLoading(true)
    try {
      const data = await resourceService.listCategoriesPage({
        search: search.trim() || undefined,
        page: nextPage,
        pageSize: PAGE_SIZE,
      })
      setCategories(data.results)
      setTotalCount(data.count)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load categories.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    setPage(1)
  }, [search])

  useEffect(() => {
    loadCategories(page).catch(() => undefined)
  }, [page, search])

  const resetForm = () => {
    setName("")
    setDescription("")
    setEditingId(null)
  }

  const handleSubmit = async () => {
    try {
      if (editingId) {
        await resourceService.updateCategory(editingId, { name, description })
        toast.success("Category updated.")
      } else {
        await resourceService.createCategory({ name, description })
        toast.success("Category created.")
      }
      resetForm()
      await loadCategories(page)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to save category.")
    }
  }

  const handleEdit = (category: ResourceCategory) => {
    setEditingId(category.id)
    setName(category.name)
    setDescription(category.description)
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this category? Existing resources may be affected.")) {
      return
    }
    try {
      await resourceService.deleteCategory(id)
      toast.success("Category deleted.")
      if (editingId === id) resetForm()
      await loadCategories(page)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to delete category.")
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Categories</h1>
        <p className="text-muted-foreground">Manage resource categories used across the platform.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{editingId ? "Edit Category" : "New Category"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Name</Label>
            <Input value={name} onChange={(event) => setName(event.target.value)} />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={description} onChange={(event) => setDescription(event.target.value)} />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSubmit} disabled={!name.trim()}>
              {editingId ? "Update Category" : "Create Category"}
            </Button>
            {editingId ? (
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing Categories</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search categories" />
          {isLoading ? <p className="text-muted-foreground">Loading categories...</p> : null}
          {error ? <p className="text-destructive">{error}</p> : null}
          {!isLoading && !error && categories.length === 0 ? (
            <p className="text-muted-foreground">No categories found.</p>
          ) : (
            <>
            {categories.map((category) => (
              <div key={category.id} className="rounded-lg border border-border p-4 flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium">{category.name}</p>
                  <p className="text-sm text-muted-foreground">{category.description || "No description"}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => handleEdit(category)}>
                    Edit
                  </Button>
                  <Button variant="destructive" onClick={() => handleDelete(category.id)}>
                    Delete
                  </Button>
                </div>
              </div>
            ))}
            <AdminPagination
              page={page}
              pageSize={PAGE_SIZE}
              totalCount={totalCount}
              isLoading={isLoading}
              onPageChange={setPage}
            />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
