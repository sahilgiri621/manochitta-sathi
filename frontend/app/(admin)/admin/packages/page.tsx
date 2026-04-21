"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { AdminPagination } from "@/components/admin/admin-pagination"
import { toast } from "sonner"
import { adminService } from "@/services"
import type { PackagePlan } from "@/lib/types"

const PAGE_SIZE = 10

type PackageFormState = {
  name: string
  slug: string
  description: string
  sessionCredits: number
  durationDays: number
  priceAmount: number
  isActive: boolean
}

const defaultForm: PackageFormState = {
  name: "",
  slug: "",
  description: "",
  sessionCredits: 4,
  durationDays: 30,
  priceAmount: 500000,
  isActive: true,
}

export default function AdminPackagesPage() {
  const [plans, setPlans] = useState<PackagePlan[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<PackageFormState>(defaultForm)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadPlans = async (nextPage = page) => {
    setIsLoading(true)
    try {
      const data = await adminService.listPackagesPage({
        search: search.trim() || undefined,
        page: nextPage,
        pageSize: PAGE_SIZE,
      })
      setPlans(data.results)
      setTotalCount(data.count)
      setError(null)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load package plans.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    setPage(1)
  }, [search])

  useEffect(() => {
    loadPlans(page).catch(() => undefined)
  }, [page, search])

  const resetForm = () => {
    setEditingId(null)
    setForm(defaultForm)
  }

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.slug.trim()) {
      toast.error("Name and slug are required.")
      return
    }
    if (form.sessionCredits <= 0 || form.durationDays <= 0 || form.priceAmount <= 0) {
      toast.error("Credits, duration, and price must be greater than zero.")
      return
    }

    setIsSubmitting(true)
    try {
      if (editingId) {
        await adminService.updatePackage(editingId, form)
        toast.success("Package updated.")
      } else {
        await adminService.createPackage(form)
        toast.success("Package created.")
      }
      resetForm()
      await loadPlans(page)
    } catch (submitError) {
      toast.error(submitError instanceof Error ? submitError.message : "Unable to save package.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (plan: PackagePlan) => {
    setEditingId(plan.id)
    setForm({
      name: plan.name,
      slug: plan.slug,
      description: plan.description,
      sessionCredits: plan.sessionCredits,
      durationDays: plan.durationDays,
      priceAmount: plan.priceAmount,
      isActive: plan.isActive,
    })
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this package plan?")) return
    try {
      await adminService.deletePackage(id)
      toast.success("Package deleted.")
      if (editingId === id) resetForm()
      await loadPlans(page)
    } catch (deleteError) {
      toast.error(deleteError instanceof Error ? deleteError.message : "Unable to delete package.")
    }
  }

  const handleToggleActive = async (plan: PackagePlan) => {
    try {
      await adminService.updatePackage(plan.id, { isActive: !plan.isActive })
      toast.success(plan.isActive ? "Package deactivated." : "Package activated.")
      await loadPlans(page)
    } catch (toggleError) {
      toast.error(toggleError instanceof Error ? toggleError.message : "Unable to update package status.")
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Packages</h1>
        <p className="text-muted-foreground">Manage platform-wide subscription plans shown in Services.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{editingId ? "Edit Package" : "New Package"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="package-name">Name</Label>
            <Input id="package-name" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
          </div>
          <div>
            <Label htmlFor="package-slug">Slug</Label>
            <Input id="package-slug" value={form.slug} onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))} />
          </div>
          <div>
            <Label htmlFor="package-description">Description</Label>
            <Textarea id="package-description" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <Label htmlFor="package-credits">Session Credits</Label>
              <Input id="package-credits" type="number" min="1" value={form.sessionCredits} onChange={(event) => setForm((current) => ({ ...current, sessionCredits: Number(event.target.value) || 0 }))} />
            </div>
            <div>
              <Label htmlFor="package-duration">Duration Days</Label>
              <Input id="package-duration" type="number" min="1" value={form.durationDays} onChange={(event) => setForm((current) => ({ ...current, durationDays: Number(event.target.value) || 0 }))} />
            </div>
            <div>
              <Label htmlFor="package-price">Price Amount</Label>
              <Input id="package-price" type="number" min="1" value={form.priceAmount} onChange={(event) => setForm((current) => ({ ...current, priceAmount: Number(event.target.value) || 0 }))} />
            </div>
          </div>
          <div>
            <Label htmlFor="package-active">Status</Label>
            <select
              id="package-active"
              className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={form.isActive ? "true" : "false"}
              onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.value === "true" }))}
            >
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : editingId ? "Update Package" : "Create Package"}
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
          <CardTitle>Existing Packages</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search packages by name, slug, or description" />
          {isLoading ? (
            <p className="text-muted-foreground">Loading packages...</p>
          ) : error ? (
            <p className="text-destructive">{error}</p>
          ) : plans.length === 0 ? (
            <p className="text-muted-foreground">No packages found.</p>
          ) : (
            <>
            {plans.map((plan) => (
              <div key={plan.id} className="rounded-lg border border-border p-4 flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium">{plan.name}</p>
                  <p className="text-sm text-muted-foreground">{plan.slug}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {plan.sessionCredits} credits | {plan.durationDays} days | NPR {(plan.priceAmount / 100).toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">{plan.description || "No description"}</p>
                  <p className="text-xs text-muted-foreground mt-2">{plan.isActive ? "Active" : "Inactive"}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => handleEdit(plan)}>Edit</Button>
                  <Button variant="outline" onClick={() => handleToggleActive(plan)}>
                    {plan.isActive ? "Deactivate" : "Activate"}
                  </Button>
                  <Button variant="destructive" onClick={() => handleDelete(plan.id)}>Delete</Button>
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
