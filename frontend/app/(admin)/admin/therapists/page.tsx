"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ConfirmActionDialog } from "@/components/admin/confirm-action-dialog"
import { toast } from "sonner"
import { therapistService } from "@/services"
import type { Therapist } from "@/lib/types"

type TherapistAction = {
  therapist: Therapist
  status: "approved" | "rejected"
  label: string
  destructive?: boolean
} | null

export default function AdminTherapistsPage() {
  const [therapists, setTherapists] = useState<Therapist[]>([])
  const [search, setSearch] = useState("")
  const [selectedDate, setSelectedDate] = useState("")
  const [activeTab, setActiveTab] = useState<"approved" | "unapproved">("approved")
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pendingAction, setPendingAction] = useState<TherapistAction>(null)

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
        [therapist.user.name, therapist.title, therapist.approvalStatus]
          .join(" ")
          .toLowerCase()
          .includes(search.toLowerCase())
      ),
    [search, therapists]
  )

  const approvedTherapists = useMemo(
    () => filtered.filter((therapist) => therapist.approvalStatus === "approved"),
    [filtered]
  )

  const unapprovedTherapists = useMemo(
    () => filtered.filter((therapist) => therapist.approvalStatus !== "approved"),
    [filtered]
  )

  const confirmAction = async () => {
    if (!pendingAction) return
    setIsUpdating(true)
    try {
      await therapistService.approve(pendingAction.therapist.id, pendingAction.status)
      toast.success(`Therapist ${pendingAction.status === "approved" ? "approved" : "removed"}.`)
      setPendingAction(null)
      await loadTherapists()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update therapist.")
    } finally {
      setIsUpdating(false)
    }
  }

  const renderTherapistRow = (therapist: Therapist, mode: "approved" | "unapproved") => (
    <div key={therapist.id} className="rounded-lg border border-border p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <Link href={`/admin/therapists/${therapist.id}`} className="font-medium hover:text-primary">
          {therapist.user.name}
        </Link>
        <p className="text-sm text-muted-foreground">{therapist.title}</p>
        <p className="text-sm text-muted-foreground">{therapist.qualifications.join(", ") || "No qualifications supplied"}</p>
        <p className="text-sm text-muted-foreground capitalize">Status: {therapist.approvalStatus}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="ghost" asChild>
          <Link href={`/admin/therapists/${therapist.id}`}>View</Link>
        </Button>
        {mode === "unapproved" ? (
          <Button
            onClick={() => setPendingAction({ therapist, status: "approved", label: "approve" })}
          >
            Approve
          </Button>
        ) : null}
        <Button
          variant="destructive"
          onClick={() => setPendingAction({ therapist, status: "rejected", label: "remove", destructive: true })}
        >
          Remove
        </Button>
      </div>
    </div>
  )

  const renderTherapistList = (items: Therapist[], emptyMessage: string, mode: "approved" | "unapproved") => {
    if (isLoading) return <p className="text-muted-foreground">Loading therapists...</p>
    if (error) return <p className="text-destructive">{error}</p>
    if (items.length === 0) return <p className="text-muted-foreground">{emptyMessage}</p>
    return <div className="space-y-3">{items.map((therapist) => renderTherapistRow(therapist, mode))}</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Therapists</h1>
        <p className="text-muted-foreground">Review therapist profiles and approval status.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_200px_auto] md:items-end">
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search therapists" />
            <div className="space-y-2">
              <Label htmlFor="therapists-date">Filter by Date</Label>
              <Input id="therapists-date" type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} />
            </div>
            <Button variant="outline" onClick={() => setSelectedDate("")} disabled={!selectedDate}>
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "approved" | "unapproved")}>
        <TabsList>
          <TabsTrigger value="approved" onClick={() => setActiveTab("approved")}>Approved Therapists</TabsTrigger>
          <TabsTrigger value="unapproved" onClick={() => setActiveTab("unapproved")}>Unapproved Therapists</TabsTrigger>
        </TabsList>
        <TabsContent value="approved" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Approved Therapists</CardTitle>
            </CardHeader>
            <CardContent>
              {renderTherapistList(
                approvedTherapists,
                selectedDate ? "No approved therapists were created on the selected day." : "No approved therapists found.",
                "approved"
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="unapproved" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Unapproved Therapists</CardTitle>
            </CardHeader>
            <CardContent>
              {renderTherapistList(
                unapprovedTherapists,
                selectedDate ? "No unapproved therapists were created on the selected day." : "No unapproved therapists found.",
                "unapproved"
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ConfirmActionDialog
        open={Boolean(pendingAction)}
        onOpenChange={(open) => {
          if (!open && !isUpdating) setPendingAction(null)
        }}
        title="Are you sure?"
        description={
          pendingAction
            ? `Confirm ${pendingAction.label} for ${pendingAction.therapist.user.name}.`
            : "Confirm this therapist status update."
        }
        confirmLabel="Confirm"
        cancelLabel="Cancel"
        destructive={pendingAction?.destructive}
        isWorking={isUpdating}
        onConfirm={confirmAction}
      />
    </div>
  )
}
