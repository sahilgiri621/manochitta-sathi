"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { resourceService } from "@/services"
import type { Resource, ResourceCategory } from "@/lib/types"

export default function TherapistResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([])
  const [categories, setCategories] = useState<ResourceCategory[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [search, setSearch] = useState("")
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

  const loadResources = async () => {
    setIsLoading(true)
    try {
      setResources(await resourceService.listAdmin())
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load your resources.")
    } finally {
      setIsLoading(false)
    }
  }

  const loadCategories = async () => {
    try {
      setCategories(await resourceService.listCategories())
      setCategoryError(null)
    } catch (err) {
      setCategoryError(err instanceof Error ? err.message : "Unable to load categories.")
    }
  }

  useEffect(() => {
    loadResources().catch(() => undefined)
    loadCategories().catch(() => undefined)
  }, [])

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
      toast.error("Select a category first.")
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
        toast.success("Resource published.")
      }
      resetForm()
      await loadResources()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to save resource.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = async (resource: Resource) => {
    try {
      const fullResource = await resourceService.getOwnedById(resource.id)
      setEditingId(fullResource.id)
      setForm({
        title: fullResource.title,
        category: fullResource.categoryId || "",
        summary: fullResource.summary || "",
        content: fullResource.content,
        format: fullResource.format || "article",
        published: Boolean(fullResource.published),
      })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to load resource for editing.")
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this resource? This action cannot be undone.")) {
      return
    }
    try {
      await resourceService.deleteResource(id)
      if (editingId === id) resetForm()
      toast.success("Resource deleted.")
      await loadResources()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to delete resource.")
    }
  }

  const filteredResources = useMemo(
    () =>
      resources.filter((resource) =>
        [resource.title, resource.summary, resource.category]
          .join(" ")
          .toLowerCase()
          .includes(search.toLowerCase())
      ),
    [resources, search]
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Resources</h1>
          <p className="text-muted-foreground">
            Create and manage published mental wellbeing resources from your therapist portal.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/resources">View public resources</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{editingId ? "Edit Resource" : "Publish New Resource"}</CardTitle>
          <CardDescription>
            Resources you publish here become part of the platform library and remain editable by you and admins.
          </CardDescription>
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
                An admin must create at least one category before resources can be published.
              </p>
            </div>
          ) : null}

          <div>
            <Label htmlFor="therapist-resource-title">Title</Label>
            <Input
              id="therapist-resource-title"
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
            />
          </div>

          <div>
            <Label htmlFor="therapist-resource-category">Category</Label>
            <select
              id="therapist-resource-category"
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
            <Label htmlFor="therapist-resource-summary">Summary</Label>
            <Textarea
              id="therapist-resource-summary"
              value={form.summary}
              onChange={(event) => setForm((current) => ({ ...current, summary: event.target.value }))}
            />
          </div>

          <div>
            <Label htmlFor="therapist-resource-content">Content</Label>
            <Textarea
              id="therapist-resource-content"
              className="min-h-40"
              value={form.content}
              onChange={(event) => setForm((current) => ({ ...current, content: event.target.value }))}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="therapist-resource-format">Format</Label>
              <select
                id="therapist-resource-format"
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
              <Label htmlFor="therapist-resource-published">Visibility</Label>
              <select
                id="therapist-resource-published"
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
              {isSubmitting ? "Saving..." : editingId ? "Update Resource" : "Publish Resource"}
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
          <CardTitle>Your Published and Draft Resources</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search your resources"
          />
          {isLoading ? (
            <p className="text-muted-foreground">Loading your resources...</p>
          ) : error ? (
            <p className="text-destructive">{error}</p>
          ) : filteredResources.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-8 text-center">
              <p className="font-medium">No resources yet</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Publish your first article, guide, audio, or video resource from the form above.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredResources.map((resource) => (
                <div key={resource.id} className="rounded-lg border border-border p-4 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div>
                    <p className="font-medium">{resource.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {resource.category || "Uncategorized"} • {resource.format || "article"} • {resource.published ? "published" : "draft"}
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">{resource.summary || "No summary provided."}</p>
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
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
