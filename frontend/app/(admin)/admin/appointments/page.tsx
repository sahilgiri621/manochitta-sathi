"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ConfirmActionDialog } from "@/components/admin/confirm-action-dialog"
import { toast } from "sonner"
import { appointmentService } from "@/services"
import type { Appointment } from "@/lib/types"

const bookedStatuses = ["pending_payment", "pending", "confirmed", "accepted", "rescheduled"]
const canceledStatuses = ["cancelled", "rejected"]

type AppointmentGroup = "booked" | "completed" | "missed" | "canceled"

export default function AdminAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [search, setSearch] = useState("")
  const [selectedDate, setSelectedDate] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pendingCancel, setPendingCancel] = useState<Appointment | null>(null)

  const loadAppointments = async (date = selectedDate) => {
    setIsLoading(true)
    try {
      setAppointments(await appointmentService.list({ date: date || undefined }))
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load appointments.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadAppointments().catch(() => undefined)
  }, [selectedDate])

  const filteredAppointments = useMemo(
    () =>
      appointments.filter((appointment) =>
        [appointment.userName, appointment.therapistName, appointment.notes, appointment.status]
          .join(" ")
          .toLowerCase()
          .includes(search.toLowerCase())
      ),
    [appointments, search]
  )

  const groupedAppointments = useMemo(
    () => ({
      booked: filteredAppointments.filter((appointment) => bookedStatuses.includes(appointment.status)),
      completed: filteredAppointments.filter((appointment) => appointment.status === "completed"),
      missed: filteredAppointments.filter((appointment) => appointment.status === "missed"),
      canceled: filteredAppointments.filter((appointment) => canceledStatuses.includes(appointment.status)),
    }),
    [filteredAppointments]
  )

  const confirmCancel = async () => {
    if (!pendingCancel) return
    setIsUpdating(true)
    try {
      await appointmentService.cancel(pendingCancel.id, "Cancelled by admin")
      toast.success("Appointment cancelled.")
      setPendingCancel(null)
      await loadAppointments()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to cancel appointment.")
    } finally {
      setIsUpdating(false)
    }
  }

  const renderStatus = (appointment: Appointment) => (
    <span className="inline-flex rounded-md border border-border px-2 py-1 text-xs font-medium capitalize text-muted-foreground">
      {appointment.status.replaceAll("_", " ")}
    </span>
  )

  const renderAppointmentCard = (appointment: Appointment) => (
    <div key={appointment.id} className="rounded-lg border border-border p-4 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium">{appointment.userName} with {appointment.therapistName}</p>
          {renderStatus(appointment)}
        </div>
        <p className="text-sm text-muted-foreground">{new Date(appointment.scheduledStart).toLocaleString()}</p>
        <p className="text-sm text-muted-foreground capitalize">Payment: {appointment.paymentStatus}</p>
        {appointment.notes ? <p className="text-sm">{appointment.notes}</p> : null}
        {appointment.cancellationReason ? (
          <p className="text-sm text-muted-foreground">Cancellation reason: {appointment.cancellationReason}</p>
        ) : null}
      </div>
      <div className="flex gap-2">
        {bookedStatuses.includes(appointment.status) ? (
          <Button variant="destructive" onClick={() => setPendingCancel(appointment)}>
            Cancel
          </Button>
        ) : null}
      </div>
    </div>
  )

  const renderAppointmentList = (group: AppointmentGroup, emptyMessage: string) => {
    if (isLoading) return <p className="text-muted-foreground">Loading appointments...</p>
    if (error) return <p className="text-destructive">{error}</p>
    const items = groupedAppointments[group]
    if (items.length === 0) return <p className="text-muted-foreground">{emptyMessage}</p>
    return <div className="space-y-3">{items.map(renderAppointmentCard)}</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Appointments</h1>
        <p className="text-muted-foreground">Manage appointment activity by booking status.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_200px_auto] md:items-end">
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by user, therapist, notes, or status" />
            <div className="space-y-2">
              <Label htmlFor="appointments-date">Filter by Date</Label>
              <Input id="appointments-date" type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} />
            </div>
            <Button variant="outline" onClick={() => setSelectedDate("")} disabled={!selectedDate}>
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="booked">
        <TabsList>
          <TabsTrigger value="booked">Booked</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="missed">Missed</TabsTrigger>
          <TabsTrigger value="canceled">Canceled</TabsTrigger>
        </TabsList>
        <TabsContent value="booked" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Booked Appointments</CardTitle>
            </CardHeader>
            <CardContent>
              {renderAppointmentList(
                "booked",
                selectedDate ? "No booked appointments were scheduled on the selected day." : "No booked appointments found."
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="completed" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Completed Appointments</CardTitle>
            </CardHeader>
            <CardContent>
              {renderAppointmentList(
                "completed",
                selectedDate ? "No completed appointments were scheduled on the selected day." : "No completed appointments found."
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="missed" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Missed Appointments</CardTitle>
            </CardHeader>
            <CardContent>
              {renderAppointmentList(
                "missed",
                selectedDate ? "No missed appointments were scheduled on the selected day." : "No missed appointments found."
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="canceled" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Canceled Appointments</CardTitle>
            </CardHeader>
            <CardContent>
              {renderAppointmentList(
                "canceled",
                selectedDate ? "No canceled appointments were scheduled on the selected day." : "No canceled appointments found."
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ConfirmActionDialog
        open={Boolean(pendingCancel)}
        onOpenChange={(open) => {
          if (!open && !isUpdating) setPendingCancel(null)
        }}
        title="Are you sure?"
        description={
          pendingCancel
            ? `Confirm cancellation for ${pendingCancel.userName} with ${pendingCancel.therapistName}.`
            : "Confirm appointment cancellation."
        }
        confirmLabel="Confirm"
        cancelLabel="Cancel"
        destructive
        isWorking={isUpdating}
        onConfirm={confirmCancel}
      />
    </div>
  )
}
