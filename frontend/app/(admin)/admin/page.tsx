"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { adminService, appointmentService, feedbackService, resourceService, therapistService } from "@/services"
import type { AdminAction, Appointment, Feedback, PackagePlan, Resource, SupportTicket, Therapist, User } from "@/lib/types"

export default function AdminDashboardPage() {
  const [users, setUsers] = useState<User[]>([])
  const [therapists, setTherapists] = useState<Therapist[]>([])
  const [actions, setActions] = useState<AdminAction[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [feedbackEntries, setFeedbackEntries] = useState<Feedback[]>([])
  const [packages, setPackages] = useState<PackagePlan[]>([])
  const [resources, setResources] = useState<Resource[]>([])
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errors, setErrors] = useState<string[]>([])

  useEffect(() => {
    Promise.allSettled([
      adminService.listUsers(),
      therapistService.listForAdmin(),
      adminService.listActions(),
      appointmentService.list(),
      feedbackService.list(),
      adminService.listPackages(),
      adminService.listSupportTickets(),
      resourceService.listAdmin(),
    ])
      .then((results) => {
        const [userResult, therapistResult, actionResult, appointmentResult, feedbackResult, packageResult, supportResult, resourceResult] = results

        setUsers(userResult.status === "fulfilled" ? userResult.value : [])
        setTherapists(therapistResult.status === "fulfilled" ? therapistResult.value : [])
        setActions(actionResult.status === "fulfilled" ? actionResult.value : [])
        setAppointments(appointmentResult.status === "fulfilled" ? appointmentResult.value : [])
        setFeedbackEntries(feedbackResult.status === "fulfilled" ? feedbackResult.value : [])
        setPackages(packageResult.status === "fulfilled" ? packageResult.value : [])
        setSupportTickets(supportResult.status === "fulfilled" ? supportResult.value : [])
        setResources(resourceResult.status === "fulfilled" ? resourceResult.value : [])

        const nextErrors = results
          .map((result, index) => {
            if (result.status === "fulfilled") return null
            const source = ["users", "therapists", "audit logs", "appointments", "feedback", "packages", "support", "resources"][index]
            const message = result.reason instanceof Error ? result.reason.message : "Unknown error"
            return `${source}: ${message}`
          })
          .filter(Boolean) as string[]

        setErrors(nextErrors)
      })
      .finally(() => setIsLoading(false))
  }, [])

  const pendingTherapists = therapists.filter((therapist) => therapist.approvalStatus === "pending")
  const activeUsers = users.filter((user) => user.isActive !== false)
  const publishedResources = resources.filter((resource) => resource.published)
  const upcomingAppointments = appointments.filter((appointment) =>
    ["pending", "confirmed", "accepted", "rescheduled"].includes(appointment.status)
  )
  const activePackages = packages.filter((pkg) => pkg.isActive)
  const openSupportTickets = supportTickets.filter((ticket) => ticket.status !== "resolved")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Live summary of operations, approvals, content, and audit activity.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/audit-logs">View Audit Logs</Link>
          </Button>
          <Button asChild>
            <Link href="/admin/therapists">Review Therapists</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4">
        <Card><CardContent className="p-6"><p className="text-sm text-muted-foreground">Active users</p><p className="text-3xl font-bold mt-2">{activeUsers.length}</p><p className="text-xs text-muted-foreground mt-2">{users.length} total users</p></CardContent></Card>
        <Card><CardContent className="p-6"><p className="text-sm text-muted-foreground">Pending therapists</p><p className="text-3xl font-bold mt-2">{pendingTherapists.length}</p><p className="text-xs text-muted-foreground mt-2">{therapists.length} therapist profiles</p></CardContent></Card>
        <Card><CardContent className="p-6"><p className="text-sm text-muted-foreground">Upcoming appointments</p><p className="text-3xl font-bold mt-2">{upcomingAppointments.length}</p><p className="text-xs text-muted-foreground mt-2">{appointments.length} total appointments</p></CardContent></Card>
        <Card><CardContent className="p-6"><p className="text-sm text-muted-foreground">Active packages</p><p className="text-3xl font-bold mt-2">{activePackages.length}</p><p className="text-xs text-muted-foreground mt-2">{packages.length} total package plans</p></CardContent></Card>
        <Card><CardContent className="p-6"><p className="text-sm text-muted-foreground">Open support tickets</p><p className="text-3xl font-bold mt-2">{openSupportTickets.length}</p><p className="text-xs text-muted-foreground mt-2">{supportTickets.length} total tickets</p></CardContent></Card>
        <Card><CardContent className="p-6"><p className="text-sm text-muted-foreground">Published resources</p><p className="text-3xl font-bold mt-2">{publishedResources.length}</p><p className="text-xs text-muted-foreground mt-2">{resources.length} total resources</p></CardContent></Card>
      </div>

      {isLoading ? <p className="text-muted-foreground">Loading admin data...</p> : null}
      {errors.length > 0 ? (
        <div className="space-y-1">
          {errors.map((error) => (
            <p key={error} className="text-destructive">{error}</p>
          ))}
        </div>
      ) : null}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Pending Therapist Applications</CardTitle>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/therapists">Open Queue</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingTherapists.length === 0 ? (
              <p className="text-muted-foreground">No therapist applications are waiting for review.</p>
            ) : (
              pendingTherapists.slice(0, 5).map((therapist) => (
                <div key={therapist.id} className="rounded-lg border border-border p-4">
                  <p className="font-medium">{therapist.user.name}</p>
                  <p className="text-sm text-muted-foreground">{therapist.title || "Therapist applicant"}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {therapist.qualifications.join(", ") || "No qualifications supplied"}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Feedback</CardTitle>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/feedback">View Feedback</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {feedbackEntries.length === 0 ? (
              <p className="text-muted-foreground">No feedback has been submitted yet.</p>
            ) : (
              feedbackEntries.slice(0, 5).map((entry) => (
                <div key={entry.id} className="rounded-lg border border-border p-4">
                  <p className="font-medium">{entry.therapistName || "Therapist"}</p>
                  <p className="text-sm text-muted-foreground">Rating {entry.rating}/5</p>
                  <p className="text-sm mt-2">{entry.comment || "No comment left."}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Package Plans</CardTitle>
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/packages">Manage Packages</Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {packages.length === 0 ? (
            <p className="text-muted-foreground">No package plans have been created yet.</p>
          ) : (
            packages.slice(0, 5).map((pkg) => (
              <div key={pkg.id} className="rounded-lg border border-border p-4">
                <p className="font-medium">{pkg.name}</p>
                <p className="text-sm text-muted-foreground">
                  {pkg.sessionCredits} credits | {pkg.durationDays} days | NPR {(pkg.priceAmount / 100).toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground mt-2">{pkg.isActive ? "Active" : "Inactive"}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Support Tickets</CardTitle>
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/support">Open Support Queue</Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {supportTickets.length === 0 ? (
            <p className="text-muted-foreground">No support tickets have been submitted yet.</p>
          ) : (
            supportTickets.slice(0, 5).map((ticket) => (
              <div key={ticket.id} className="rounded-lg border border-border p-4">
                <p className="font-medium">{ticket.subject}</p>
                <p className="text-sm text-muted-foreground">
                  {ticket.userName} | {ticket.issueType} | {ticket.status.replace("_", " ")}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {new Date(ticket.updatedAt).toLocaleString()}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Audit Activity</CardTitle>
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/audit-logs">All activity</Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {actions.length === 0 ? (
            <p className="text-muted-foreground">No admin actions logged yet.</p>
          ) : (
            actions.slice(0, 8).map((action) => (
              <div key={action.id} className="rounded-lg border border-border p-4">
                <p className="font-medium">{action.action}</p>
                <p className="text-sm text-muted-foreground">
                  {action.adminName || "Admin"} | {action.targetType} #{action.targetId}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {new Date(action.createdAt).toLocaleString()}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
