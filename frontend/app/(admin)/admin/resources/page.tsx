"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { AdminPagination } from "@/components/admin/admin-pagination"
import { toast } from "sonner"
import { resourceService } from "@/services"
import type { Resource, ResourceCategory } from "@/lib/types"

const PAGE_SIZE = 10

export default function AdminResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [categories, setCategories] = useState<ResourceCategory[]>([])
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({
    title: "",
    category: "",
    summary: "",
    content: "",
    format: "article",
    published: true,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [categoryError, setCategoryError] = useState<string | null>(null)

  const loadData = async (nextPage = page) => {
    setIsLoading(true)
    try {
      const resourceData = await resourceService.listAdminPage({
        search: search.trim() || undefined,
        page: nextPage,
        pageSize: PAGE_SIZE,
      })
      setResources(resourceData.results)
      setTotalCount(resourceData.count)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load resources.")
    } finally {
      setIsLoading(false)
    }
  }

  const loadCategories = async () => {
    try {
      const categoryData = await resourceService.listCategories()
      setCategories(categoryData)
      setCategoryError(null)
    } catch (err) {
      setCategoryError(err instanceof Error ? err.message : "Unable to load categories.")
    }
  }

  useEffect(() => {
    loadCategories().catch(() => undefined)
  }, [])

  useEffect(() => {
    setPage(1)
  }, [search])

  useEffect(() => {
    loadData(page).catch(() => undefined)
  }, [page, search])

  const resetForm = () => {
    setEditingId(null)
    setForm({
      title: "",
      category: "",
      summary: "",
      content: "",
      format: "article",
      published: true,
    })
  }

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      toast.error("Title is required.")
      return
    }
    if (!form.category) {
      toast.error("Select a category before publishing this resource.")
      return
    }
    if (!form.content.trim()) {
      toast.error("Content is required.")
      return
    }

    setIsSubmitting(true)
    try {
      if (editingId) {
        await resourceService.updateResource(editingId, form)
        toast.success("Resource updated.")
      } else {
        await resourceService.createResource(form)
        toast.success("Resource created.")
      }
      resetForm()
      await loadData(page)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to save resource.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (resource: Resource) => {
    setEditingId(resource.id)
    setForm({
      title: resource.title,
      category: resource.categoryId || "",
      summary: resource.summary || "",
      content: resource.content,
      format: resource.format || "article",
      published: Boolean(resource.published),
    })
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this resource? This action cannot be undone.")) {
      return
    }
    try {
      await resourceService.deleteResource(id)
      toast.success("Resource deleted.")
      if (editingId === id) resetForm()
      await loadData(page)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to delete resource.")
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Resources</h1>
        <p className="text-muted-foreground">Create, edit, publish, and remove mental health resources.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{editingId ? "Edit Resource" : "New Resource"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {categoryError ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              {categoryError}
            </div>
          ) : null}
          {categories.length === 0 ? (
            <div className="rounded-lg border border-border bg-muted/40 p-4">
              <p className="text-sm font-medium">No categories available</p>
              <p className="text-sm text-muted-foreground mt-1">
                Create at least one category before publishing a resource.
              </p>
              <Button asChild variant="outline" size="sm" className="mt-3">
                <Link href="/admin/categories">Manage Categories</Link>
              </Button>
            </div>
          ) : null}
          <div>
            <Label htmlFor="resource-title">Title</Label>
            <Input
              id="resource-title"
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="resource-category">Category</Label>
            <select
              id="resource-category"
              className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={form.category}
              onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
              disabled={categories.length === 0}
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="resource-summary">Summary</Label>
            <Textarea
              id="resource-summary"
              value={form.summary}
              onChange={(event) => setForm((current) => ({ ...current, summary: event.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="resource-content">Content</Label>
            <Textarea
              id="resource-content"
              value={form.content}
              onChange={(event) => setForm((current) => ({ ...current, content: event.target.value }))}
              className="min-h-40"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="resource-format">Format</Label>
              <select
                id="resource-format"
                className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.format}
                onChange={(event) => setForm((current) => ({ ...current, format: event.target.value }))}
              >
                <option value="article">Article</option>
                <option value="video">Video</option>
                <option value="audio">Audio</option>
                <option value="guide">Guide</option>
              </select>
            </div>
            <div>
              <Label htmlFor="resource-published">Published</Label>
              <select
                id="resource-published"
                className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.published ? "true" : "false"}
                onChange={(event) => setForm((current) => ({ ...current, published: event.target.value === "true" }))}
              >
                <option value="true">Published</option>
                <option value="false">Draft</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSubmit} disabled={isSubmitting || categories.length === 0}>
              {isSubmitting ? "Saving..." : editingId ? "Update Resource" : "Create Resource"}
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
          <CardTitle>Existing Resources</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search resources by title, summary, or category"
          />
          {isLoading ? <p className="text-muted-foreground">Loading resources...</p> : null}
          {error ? <p className="text-destructive">{error}</p> : null}
          {!isLoading && !error && resources.length === 0 ? (
            <p className="text-muted-foreground">No resources found.</p>
          ) : (
            <>
            {resources.map((resource) => (
              <div key={resource.id} className="rounded-lg border border-border p-4 flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium">{resource.title}</p>
                  <p className="text-sm text-muted-foreground">{resource.category || "Uncategorized"} | {resource.format || "article"}</p>
                  <p className="text-sm text-muted-foreground mt-1">{resource.summary || "No summary"}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => handleEdit(resource)}>
                    Edit
                  </Button>
                  <Button variant="destructive" onClick={() => handleDelete(resource.id)}>
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
