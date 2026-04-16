"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { therapistService } from "@/services"
import type { Therapist } from "@/lib/types"

export default function AdminTherapistsPage() {
  const [therapists, setTherapists] = useState<Therapist[]>([])
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("all")
  const [selectedDate, setSelectedDate] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadTherapists = async (date = selectedDate) => {
    setIsLoading(true)
    try {
      setTherapists(await therapistService.listForAdmin({ date: date || undefined }))
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load therapists.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadTherapists()
  }, [selectedDate])

  const filtered = useMemo(
    () =>
      therapists.filter((therapist) =>
        (statusFilter === "all" || therapist.approvalStatus === statusFilter) &&
        [therapist.user.name, therapist.title, therapist.approvalStatus]
          .join(" ")
          .toLowerCase()
          .includes(search.toLowerCase())
      ),
    [search, statusFilter, therapists]
  )

  const handleReview = async (therapist: Therapist, approvalStatus: "approved" | "rejected") => {
    try {
      await therapistService.approve(therapist.id, approvalStatus)
      toast.success(`Therapist ${approvalStatus}.`)
      await loadTherapists()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update therapist.")
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Therapists</h1>
        <p className="text-muted-foreground">Review therapist profiles and approval status.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Therapist Profiles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_220px_200px_auto] md:items-end">
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search therapists" />
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as "all" | "pending" | "approved" | "rejected")}
            >
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <div className="space-y-2">
              <Label htmlFor="therapists-date">Filter by Date</Label>
              <Input id="therapists-date" type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} />
            </div>
            <Button variant="outline" onClick={() => setSelectedDate("")} disabled={!selectedDate}>
              Reset
            </Button>
          </div>
          {isLoading ? (
            <p className="text-muted-foreground">Loading therapists...</p>
          ) : error ? (
            <p className="text-destructive">{error}</p>
          ) : filtered.length === 0 ? (
            <p className="text-muted-foreground">
              {selectedDate ? "No therapist applications were created on the selected day." : "No therapist profiles match the current filters."}
            </p>
          ) : (
            <div className="space-y-3">
              {filtered.map((therapist) => (
                <div key={therapist.id} className="rounded-lg border border-border p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <Link href={`/admin/therapists/${therapist.id}`} className="font-medium hover:text-primary">
                      {therapist.user.name}
                    </Link>
                    <p className="text-sm text-muted-foreground">{therapist.title}</p>
                    <p className="text-sm text-muted-foreground">{therapist.qualifications.join(", ") || "No qualifications supplied"}</p>
                    <p className="text-sm text-muted-foreground capitalize">{therapist.approvalStatus}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" asChild>
                      <Link href={`/admin/therapists/${therapist.id}`}>View</Link>
                    </Button>
                    <Button variant="outline" onClick={() => handleReview(therapist, "rejected")}>
                      Reject
                    </Button>
                    <Button onClick={() => handleReview(therapist, "approved")}>Approve</Button>
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
