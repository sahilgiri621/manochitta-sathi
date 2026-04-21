"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ConfirmActionDialog } from "@/components/admin/confirm-action-dialog"
import { AdminPagination } from "@/components/admin/admin-pagination"
import { toast } from "sonner"
import { therapistService } from "@/services"
import type { Therapist, TherapistCommissionRule } from "@/lib/types"

const PAGE_SIZE = 10

type TherapistAction = {
  therapist: Therapist
  status: "approved" | "rejected"
  label: string
  destructive?: boolean
} | null

export default function AdminTherapistsPage() {
  const [therapists, setTherapists] = useState<Therapist[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [commissionRules, setCommissionRules] = useState<TherapistCommissionRule[]>([])
  const [search, setSearch] = useState("")
  const [selectedDate, setSelectedDate] = useState("")
  const [activeTab, setActiveTab] = useState<"approved" | "unapproved">("approved")
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pendingAction, setPendingAction] = useState<TherapistAction>(null)
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null)
  const [ruleForm, setRuleForm] = useState({
    tierName: "",
    minSessions: "0",
    maxSessions: "",
    commissionRate: "0.10",
    isActive: true,
  })

  const loadTherapists = async (nextPage = page) => {
    setIsLoading(true)
    try {
      const [therapistData, ruleData] = await Promise.all([
        therapistService.listForAdminPage({
          date: selectedDate || undefined,
          search: search.trim() || undefined,
          approvalStatus: activeTab === "approved" ? "approved" : "pending,rejected",
          page: nextPage,
          pageSize: PAGE_SIZE,
        }),
        therapistService.listCommissionRules(),
      ])
      setTherapists(therapistData.results)
      setTotalCount(therapistData.count)
      setCommissionRules(ruleData)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load therapists.")
    } finally {
      setIsLoading(false)
    }
  }

  const resetRuleForm = () => {
    setEditingRuleId(null)
    setRuleForm({
      tierName: "",
      minSessions: "0",
      maxSessions: "",
      commissionRate: "0.10",
      isActive: true,
    })
  }

  const startRuleEdit = (rule: TherapistCommissionRule) => {
    setEditingRuleId(rule.id)
    setRuleForm({
      tierName: rule.tierName,
      minSessions: String(rule.minSessions),
      maxSessions: rule.maxSessions === null ? "" : String(rule.maxSessions),
      commissionRate: String(rule.commissionRate),
      isActive: rule.isActive,
    })
  }

  const saveCommissionRule = async () => {
    const payload = {
      tierName: ruleForm.tierName.trim(),
      minSessions: Number(ruleForm.minSessions || 0),
      maxSessions: ruleForm.maxSessions.trim() ? Number(ruleForm.maxSessions) : null,
      commissionRate: Number(ruleForm.commissionRate || 0),
      isActive: ruleForm.isActive,
    }
    if (!payload.tierName) {
      toast.error("Tier name is required.")
      return
    }
    try {
      if (editingRuleId) {
        await therapistService.updateCommissionRule(editingRuleId, payload)
        toast.success("Commission rule updated.")
      } else {
        await therapistService.createCommissionRule(payload)
        toast.success("Commission rule created.")
      }
      resetRuleForm()
      await loadTherapists()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save commission rule.")
    }
  }

  useEffect(() => {
    setPage(1)
  }, [search, selectedDate, activeTab])

  useEffect(() => {
    loadTherapists(page).catch(() => undefined)
  }, [page, search, selectedDate, activeTab])

  const confirmAction = async () => {
    if (!pendingAction) return
    setIsUpdating(true)
    try {
      await therapistService.approve(pendingAction.therapist.id, pendingAction.status)
      toast.success(`Therapist ${pendingAction.status === "approved" ? "approved" : "removed"}.`)
      setPendingAction(null)
      await loadTherapists(page)
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
        <div className="mt-2 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2 lg:grid-cols-4">
          <span>Completed: {therapist.completedSessions}</span>
          <span>Tier: {therapist.commissionTier || "Not assigned"}</span>
          <span>Commission: {(therapist.commissionRate * 100).toFixed(0)}%</span>
          <span>Earnings: NPR {therapist.totalEarnings.toLocaleString()}</span>
        </div>
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
    return (
      <div className="space-y-3">
        {items.map((therapist) => renderTherapistRow(therapist, mode))}
        <AdminPagination
          page={page}
          pageSize={PAGE_SIZE}
          totalCount={totalCount}
          isLoading={isLoading}
          onPageChange={setPage}
        />
      </div>
    )
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

      <Card>
        <CardHeader>
          <CardTitle>Commission Rules</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-5 md:items-end">
            <div className="space-y-2">
              <Label htmlFor="tier-name">Tier Name</Label>
              <Input
                id="tier-name"
                value={ruleForm.tierName}
                onChange={(event) => setRuleForm((current) => ({ ...current, tierName: event.target.value }))}
                placeholder="Starter"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="min-sessions">Min Sessions</Label>
              <Input
                id="min-sessions"
                type="number"
                min="0"
                value={ruleForm.minSessions}
                onChange={(event) => setRuleForm((current) => ({ ...current, minSessions: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max-sessions">Max Sessions</Label>
              <Input
                id="max-sessions"
                type="number"
                min="0"
                value={ruleForm.maxSessions}
                onChange={(event) => setRuleForm((current) => ({ ...current, maxSessions: event.target.value }))}
                placeholder="No limit"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="commission-rate">Commission Rate</Label>
              <Input
                id="commission-rate"
                type="number"
                min="0"
                max="1"
                step="0.01"
                value={ruleForm.commissionRate}
                onChange={(event) => setRuleForm((current) => ({ ...current, commissionRate: event.target.value }))}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" onClick={saveCommissionRule}>
                {editingRuleId ? "Update Rule" : "Add Rule"}
              </Button>
              {editingRuleId ? (
                <Button type="button" variant="outline" onClick={resetRuleForm}>
                  Cancel
                </Button>
              ) : null}
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={ruleForm.isActive}
              onChange={(event) => setRuleForm((current) => ({ ...current, isActive: event.target.checked }))}
            />
            Active rule
          </label>

          <div className="space-y-3">
            {commissionRules.map((rule) => (
              <div key={rule.id} className="flex flex-col gap-3 rounded-lg border border-border p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-medium">{rule.tierName}</p>
                  <p className="text-sm text-muted-foreground">
                    {rule.minSessions} to {rule.maxSessions ?? "unlimited"} sessions | {(rule.commissionRate * 100).toFixed(0)}% platform commission | {rule.isActive ? "Active" : "Inactive"}
                  </p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => startRuleEdit(rule)}>
                  Edit
                </Button>
              </div>
            ))}
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
                therapists,
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
                therapists,
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
