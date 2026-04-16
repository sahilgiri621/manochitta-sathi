"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { appointmentService } from "@/services"
import type { Appointment, AppointmentStatus } from "@/lib/types"

const statusOptions: Array<AppointmentStatus | "all"> = [
  "all",
  "pending",
  "confirmed",
  "accepted",
  "rejected",
  "cancelled",
  "completed",
  "rescheduled",
]

export default function AdminAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | "all">("all")
  const [selectedDate, setSelectedDate] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
      appointments.filter((appointment) => {
        const matchesSearch = [appointment.userName, appointment.therapistName, appointment.notes]
          .join(" ")
          .toLowerCase()
          .includes(search.toLowerCase())
        const matchesStatus = statusFilter === "all" || appointment.status === statusFilter
        return matchesSearch && matchesStatus
      }),
    [appointments, search, statusFilter]
  )

  const handleCancel = async (appointment: Appointment) => {
    const reason = window.prompt("Enter a cancellation reason for the audit trail:", "Cancelled by admin")
    if (reason === null) return
    try {
      await appointmentService.cancel(appointment.id, reason)
      toast.success("Appointment cancelled.")
      await loadAppointments()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to cancel appointment.")
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Appointments</h1>
        <p className="text-muted-foreground">Oversee appointment activity and intervene when sessions need to be cancelled.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Appointment Oversight</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_220px_200px_auto] md:items-end">
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by user, therapist, or notes" />
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as AppointmentStatus | "all")}
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status === "all" ? "All statuses" : status}
                </option>
              ))}
            </select>
            <div className="space-y-2">
              <Label htmlFor="appointments-date">Filter by Date</Label>
              <Input id="appointments-date" type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} />
            </div>
            <Button variant="outline" onClick={() => setSelectedDate("")} disabled={!selectedDate}>
              Reset
            </Button>
          </div>

          {isLoading ? (
            <p className="text-muted-foreground">Loading appointments...</p>
          ) : error ? (
            <p className="text-destructive">{error}</p>
          ) : filteredAppointments.length === 0 ? (
            <p className="text-muted-foreground">
              {selectedDate ? "No appointments were scheduled for the selected day." : "No appointments match the current search."}
            </p>
          ) : (
            <div className="space-y-3">
              {filteredAppointments.map((appointment) => (
                <div key={appointment.id} className="rounded-lg border border-border p-4 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div>
                    <p className="font-medium">{appointment.userName} with {appointment.therapistName}</p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {appointment.status} • {new Date(appointment.scheduledStart).toLocaleString()}
                    </p>
                    {appointment.notes ? <p className="text-sm mt-2">{appointment.notes}</p> : null}
                    {appointment.cancellationReason ? (
                      <p className="text-sm mt-2 text-muted-foreground">Cancellation reason: {appointment.cancellationReason}</p>
                    ) : null}
                  </div>
                  <div className="flex gap-2">
                    {["pending", "confirmed", "accepted", "rescheduled"].includes(appointment.status) ? (
                      <Button variant="destructive" onClick={() => handleCancel(appointment)}>
                        Cancel
                      </Button>
                    ) : null}
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
