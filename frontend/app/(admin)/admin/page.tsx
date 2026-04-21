"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts"
import {
  Activity,
  CalendarCheck,
  CircleDollarSign,
  ClipboardCheck,
  LifeBuoy,
  Star,
  UserCheck,
  UserCog,
  Users,
} from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { appointmentService, feedbackService, resourceService, therapistService, adminService } from "@/services"
import type { Appointment, Feedback, PackagePlan, Resource, SupportTicket, Therapist, User } from "@/lib/types"

const BOOKED_STATUSES = ["pending_payment", "pending", "confirmed", "accepted", "rescheduled"]
const CANCELED_STATUSES = ["cancelled", "rejected"]
const CHART_COLORS = {
  booked: "#2563eb",
  completed: "#059669",
  missed: "#d97706",
  canceled: "#dc2626",
  approved: "#0f766e",
  unapproved: "#f59e0b",
  revenue: "#0891b2",
  rating: "#f59e0b",
}

const appointmentStatusConfig = {
  booked: { label: "Booked", color: CHART_COLORS.booked },
  completed: { label: "Completed", color: CHART_COLORS.completed },
  missed: { label: "Missed", color: CHART_COLORS.missed },
  canceled: { label: "Canceled", color: CHART_COLORS.canceled },
} satisfies ChartConfig

const approvalConfig = {
  approved: { label: "Approved / active", color: CHART_COLORS.approved },
  unapproved: { label: "Unapproved / inactive", color: CHART_COLORS.unapproved },
} satisfies ChartConfig

const trendConfig = {
  booked: { label: "Booked", color: CHART_COLORS.booked },
  completed: { label: "Completed", color: CHART_COLORS.completed },
  missed: { label: "Missed", color: CHART_COLORS.missed },
  canceled: { label: "Canceled", color: CHART_COLORS.canceled },
} satisfies ChartConfig

const revenueConfig = {
  revenue: { label: "Revenue", color: CHART_COLORS.revenue },
} satisfies ChartConfig

const ratingConfig = {
  count: { label: "Reviews", color: CHART_COLORS.rating },
} satisfies ChartConfig

function formatCurrency(value: number) {
  return `NPR ${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
}

function formatDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function getDateKey(value: string | undefined) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return formatDateKey(date)
}

function getLastDays(days: number) {
  return Array.from({ length: days }, (_, index) => {
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    date.setDate(date.getDate() - (days - index - 1))
    const key = formatDateKey(date)
    return {
      key,
      label: date.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    }
  })
}

function getAppointmentBucket(appointment: Appointment) {
  if (appointment.status === "completed") return "completed"
  if (appointment.status === "missed") return "missed"
  if (CANCELED_STATUSES.includes(appointment.status)) return "canceled"
  return "booked"
}

export default function AdminDashboardPage() {
  const [users, setUsers] = useState<User[]>([])
  const [therapists, setTherapists] = useState<Therapist[]>([])
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
      appointmentService.list({ allPages: true }),
      feedbackService.list(),
      adminService.listPackages(),
      adminService.listSupportTickets(),
      resourceService.listAdmin(),
    ])
      .then((results) => {
        const [userResult, therapistResult, appointmentResult, feedbackResult, packageResult, supportResult, resourceResult] = results

        setUsers(userResult.status === "fulfilled" ? userResult.value : [])
        setTherapists(therapistResult.status === "fulfilled" ? therapistResult.value : [])
        setAppointments(appointmentResult.status === "fulfilled" ? appointmentResult.value : [])
        setFeedbackEntries(feedbackResult.status === "fulfilled" ? feedbackResult.value : [])
        setPackages(packageResult.status === "fulfilled" ? packageResult.value : [])
        setSupportTickets(supportResult.status === "fulfilled" ? supportResult.value : [])
        setResources(resourceResult.status === "fulfilled" ? resourceResult.value : [])

        const nextErrors = results
          .map((result, index) => {
            if (result.status === "fulfilled") return null
            const source = ["users", "therapists", "appointments", "feedback", "packages", "support", "resources"][index]
            const message = result.reason instanceof Error ? result.reason.message : "Unknown error"
            return `${source}: ${message}`
          })
          .filter(Boolean) as string[]

        setErrors(nextErrors)
      })
      .finally(() => setIsLoading(false))
  }, [])

  const analytics = useMemo(() => {
    const approvedTherapists = therapists.filter((therapist) => therapist.approvalStatus === "approved" || therapist.isApproved)
    const unapprovedTherapists = therapists.filter((therapist) => therapist.approvalStatus !== "approved" && !therapist.isApproved)
    const pendingTherapists = therapists.filter((therapist) => therapist.approvalStatus === "pending")
    const activeUsers = users.filter((user) => user.isActive !== false)
    const inactiveUsers = users.filter((user) => user.isActive === false)
    const bookedAppointments = appointments.filter((appointment) => BOOKED_STATUSES.includes(appointment.status))
    const completedAppointments = appointments.filter((appointment) => appointment.status === "completed")
    const missedAppointments = appointments.filter((appointment) => appointment.status === "missed")
    const canceledAppointments = appointments.filter((appointment) => CANCELED_STATUSES.includes(appointment.status))
    const activePackages = packages.filter((pkg) => pkg.isActive)
    const publishedResources = resources.filter((resource) => resource.published)
    const openSupportTickets = supportTickets.filter((ticket) => ticket.status !== "resolved")
    const paidAppointments = appointments.filter((appointment) => appointment.paymentStatus === "paid")
    const totalRevenue = paidAppointments.reduce((sum, appointment) => sum + (appointment.paidAmount || 0), 0) / 100
    const averageRating =
      feedbackEntries.length > 0
        ? feedbackEntries.reduce((sum, entry) => sum + entry.rating, 0) / feedbackEntries.length
        : 0

    const statusData = [
      { bucket: "booked", name: "Booked", value: bookedAppointments.length, fill: "var(--color-booked)" },
      { bucket: "completed", name: "Completed", value: completedAppointments.length, fill: "var(--color-completed)" },
      { bucket: "missed", name: "Missed", value: missedAppointments.length, fill: "var(--color-missed)" },
      { bucket: "canceled", name: "Canceled", value: canceledAppointments.length, fill: "var(--color-canceled)" },
    ]

    const approvalData = [
      { category: "Therapists", approved: approvedTherapists.length, unapproved: unapprovedTherapists.length },
      { category: "Users", approved: activeUsers.length, unapproved: inactiveUsers.length },
    ]

    const days = getLastDays(10)
    const appointmentTrend = days.map((day) => {
      const items = appointments.filter((appointment) => getDateKey(appointment.scheduledStart) === day.key)
      return {
        date: day.label,
        booked: items.filter((appointment) => getAppointmentBucket(appointment) === "booked").length,
        completed: items.filter((appointment) => getAppointmentBucket(appointment) === "completed").length,
        missed: items.filter((appointment) => getAppointmentBucket(appointment) === "missed").length,
        canceled: items.filter((appointment) => getAppointmentBucket(appointment) === "canceled").length,
      }
    })

    const revenueTrend = days.map((day) => ({
      date: day.label,
      revenue:
        appointments
          .filter((appointment) => appointment.paymentStatus === "paid" && getDateKey(appointment.paymentVerifiedAt || appointment.scheduledStart) === day.key)
          .reduce((sum, appointment) => sum + (appointment.paidAmount || 0), 0) / 100,
    }))

    const ratingData = [1, 2, 3, 4, 5].map((rating) => ({
      rating: `${rating} star`,
      count: feedbackEntries.filter((entry) => entry.rating === rating).length,
    }))

    return {
      approvedTherapists,
      unapprovedTherapists,
      pendingTherapists,
      activeUsers,
      inactiveUsers,
      bookedAppointments,
      completedAppointments,
      missedAppointments,
      canceledAppointments,
      activePackages,
      publishedResources,
      openSupportTickets,
      totalRevenue,
      averageRating,
      statusData,
      approvalData,
      appointmentTrend,
      revenueTrend,
      ratingData,
    }
  }, [appointments, feedbackEntries, packages, resources, supportTickets, therapists, users])

  const statCards = [
    {
      label: "Total users",
      value: users.length.toLocaleString(),
      detail: `${analytics.activeUsers.length} active, ${analytics.inactiveUsers.length} inactive`,
      icon: Users,
    },
    {
      label: "Total therapists",
      value: therapists.length.toLocaleString(),
      detail: `${analytics.approvedTherapists.length} approved, ${analytics.unapprovedTherapists.length} unapproved`,
      icon: UserCog,
    },
    {
      label: "Booked sessions",
      value: analytics.bookedAppointments.length.toLocaleString(),
      detail: `${appointments.length} total appointments`,
      icon: CalendarCheck,
    },
    {
      label: "Completed sessions",
      value: analytics.completedAppointments.length.toLocaleString(),
      detail: `${analytics.missedAppointments.length} missed, ${analytics.canceledAppointments.length} canceled`,
      icon: ClipboardCheck,
    },
    {
      label: "Revenue",
      value: formatCurrency(analytics.totalRevenue),
      detail: "Verified appointment payments",
      icon: CircleDollarSign,
    },
    {
      label: "Therapist rating",
      value: analytics.averageRating ? analytics.averageRating.toFixed(1) : "0.0",
      detail: `${feedbackEntries.length} submitted reviews`,
      icon: Star,
    },
  ]

  return (
    <div className="space-y-3 text-[13px]">
      <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
        <div>
          <h1 className="text-xl font-bold">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">Live operations, approvals, appointments, payments, and feedback.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/appointments">Manage Appointments</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/admin/therapists">Review Therapists</Link>
          </Button>
        </div>
      </div>

      {isLoading ? <p className="text-muted-foreground">Loading admin data...</p> : null}
      {errors.length > 0 ? (
        <div className="space-y-1 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          {errors.map((error) => (
            <p key={error} className="text-sm text-destructive">{error}</p>
          ))}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {statCards.map((stat) => (
          <Card key={stat.label} className="gap-1.5 border-border/80 py-2.5">
            <CardContent className="p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="mt-1 text-lg font-bold tracking-tight">{stat.value}</p>
                </div>
                <div className="rounded-lg bg-primary/10 p-1.5 text-primary">
                  <stat.icon className="h-3.5 w-3.5" />
                </div>
              </div>
              <p className="mt-1.5 text-[11px] text-muted-foreground">{stat.detail}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-2 xl:grid-cols-5">
        <Card className="gap-1.5 py-2.5 xl:col-span-2">
          <CardHeader className="px-3">
            <CardTitle className="text-base">Appointments by Status</CardTitle>
          </CardHeader>
          <CardContent className="px-3">
            {appointments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No appointments found.</p>
            ) : (
              <ChartContainer config={appointmentStatusConfig} className="mx-auto h-[150px] max-w-[220px]">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent hideLabel nameKey="bucket" />} />
                  <Pie data={analytics.statusData} dataKey="value" nameKey="bucket" innerRadius={26} outerRadius={44} paddingAngle={2}>
                    {analytics.statusData.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartLegend content={<ChartLegendContent nameKey="bucket" />} />
                </PieChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card className="gap-1.5 py-2.5 xl:col-span-3">
          <CardHeader className="px-3">
            <CardTitle className="text-base">Appointments Over Time</CardTitle>
          </CardHeader>
          <CardContent className="px-3">
            <ChartContainer config={trendConfig} className="h-[150px] w-full">
              <AreaChart data={analytics.appointmentTrend} margin={{ left: 0, right: 12, top: 8 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} />
                <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
                <Area dataKey="booked" type="monotone" fill="var(--color-booked)" fillOpacity={0.14} stroke="var(--color-booked)" strokeWidth={2} />
                <Area dataKey="completed" type="monotone" fill="var(--color-completed)" fillOpacity={0.14} stroke="var(--color-completed)" strokeWidth={2} />
                <Area dataKey="missed" type="monotone" fill="var(--color-missed)" fillOpacity={0.14} stroke="var(--color-missed)" strokeWidth={2} />
                <Area dataKey="canceled" type="monotone" fill="var(--color-canceled)" fillOpacity={0.12} stroke="var(--color-canceled)" strokeWidth={2} />
                <ChartLegend content={<ChartLegendContent />} />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-2 xl:grid-cols-3">
        <Card className="gap-1.5 py-2.5">
          <CardHeader className="px-3">
            <CardTitle className="text-base">Approval Overview</CardTitle>
          </CardHeader>
          <CardContent className="px-3">
            <ChartContainer config={approvalConfig} className="h-[140px] w-full">
              <BarChart data={analytics.approvalData} margin={{ left: 0, right: 12, top: 8 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="category" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="approved" fill="var(--color-approved)" radius={4} />
                <Bar dataKey="unapproved" fill="var(--color-unapproved)" radius={4} />
                <ChartLegend content={<ChartLegendContent />} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="gap-1.5 py-2.5">
          <CardHeader className="px-3">
            <CardTitle className="text-base">Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent className="px-3">
            <ChartContainer config={revenueConfig} className="h-[140px] w-full">
              <AreaChart data={analytics.revenueTrend} margin={{ left: 0, right: 12, top: 8 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis tickLine={false} axisLine={false} width={48} tickFormatter={(value) => `${Number(value) / 1000}k`} />
                <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
                <Area dataKey="revenue" type="monotone" fill="var(--color-revenue)" fillOpacity={0.18} stroke="var(--color-revenue)" strokeWidth={2} />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="gap-1.5 py-2.5">
          <CardHeader className="px-3">
            <CardTitle className="text-base">Therapist Ratings</CardTitle>
          </CardHeader>
          <CardContent className="px-3">
            <ChartContainer config={ratingConfig} className="h-[140px] w-full">
              <BarChart data={analytics.ratingData} margin={{ left: 0, right: 12, top: 8 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="rating" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="var(--color-count)" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
        <Card className="gap-1.5 py-2.5">
          <CardHeader className="flex flex-row items-center justify-between px-3">
            <CardTitle className="text-base">Pending Therapist Applications</CardTitle>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/therapists">Open Queue</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2 px-3">
            {analytics.pendingTherapists.length === 0 ? (
              <p className="text-muted-foreground">No therapist applications are waiting for review.</p>
            ) : (
              analytics.pendingTherapists.slice(0, 3).map((therapist) => (
                <div key={therapist.id} className="rounded-lg border border-border p-2.5">
                  <p className="font-medium">{therapist.user.name}</p>
                  <p className="text-sm text-muted-foreground">{therapist.title || "Therapist applicant"}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {therapist.qualifications.join(", ") || "No qualifications supplied"}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="gap-1.5 py-2.5">
          <CardHeader className="flex flex-row items-center justify-between px-3">
            <CardTitle className="text-base">Recent Feedback</CardTitle>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/feedback">View Feedback</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2 px-3">
            {feedbackEntries.length === 0 ? (
              <p className="text-muted-foreground">No feedback has been submitted yet.</p>
            ) : (
              feedbackEntries.slice(0, 3).map((entry) => (
                <div key={entry.id} className="rounded-lg border border-border p-2.5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">{entry.therapistName || "Therapist"}</p>
                    <span className="rounded-md bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800">
                      {entry.rating}/5
                    </span>
                  </div>
                  <p className="mt-1 text-sm">{entry.comment || "No comment left."}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-2 xl:grid-cols-3">
        <Card className="gap-1.5 py-2.5">
          <CardHeader className="flex flex-row items-center justify-between px-3">
            <CardTitle className="text-base">Package Plans</CardTitle>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/packages">Manage</Link>
            </Button>
          </CardHeader>
          <CardContent className="px-3">
            <div className="flex items-center justify-between rounded-lg border border-border p-2.5">
              <div>
                <p className="text-xs text-muted-foreground">Active plans</p>
                <p className="text-lg font-bold">{analytics.activePackages.length}</p>
              </div>
              <Activity className="h-5 w-5 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="gap-1.5 py-2.5">
          <CardHeader className="flex flex-row items-center justify-between px-3">
            <CardTitle className="text-base">Support Tickets</CardTitle>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/support">Open Queue</Link>
            </Button>
          </CardHeader>
          <CardContent className="px-3">
            <div className="flex items-center justify-between rounded-lg border border-border p-2.5">
              <div>
                <p className="text-xs text-muted-foreground">Open tickets</p>
                <p className="text-lg font-bold">{analytics.openSupportTickets.length}</p>
              </div>
              <LifeBuoy className="h-5 w-5 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="gap-1.5 py-2.5">
          <CardHeader className="flex flex-row items-center justify-between px-3">
            <CardTitle className="text-base">Resources</CardTitle>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/resources">Manage</Link>
            </Button>
          </CardHeader>
          <CardContent className="px-3">
            <div className="flex items-center justify-between rounded-lg border border-border p-2.5">
              <div>
                <p className="text-xs text-muted-foreground">Published resources</p>
                <p className="text-lg font-bold">{analytics.publishedResources.length}</p>
              </div>
              <UserCheck className="h-5 w-5 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
