"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { toTitleCaseSession } from "@/lib/api"
import { appointmentService } from "@/services"
import type { Appointment } from "@/lib/types"

function getMeetingCode(meetingLink: string) {
  if (!meetingLink) return ""
  try {
    const url = new URL(meetingLink)
    return url.pathname.replace(/^\/+/, "")
  } catch {
    return ""
  }
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadAppointments = async () => {
    setIsLoading(true)
    try {
      setAppointments(await appointmentService.list())
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load appointments.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadAppointments()
  }, [])

  const upcoming = useMemo(
    () => appointments.filter((item) => ["pending_payment", "pending", "confirmed", "accepted", "rescheduled"].includes(item.status)),
    [appointments]
  )
  const history = useMemo(
    () => appointments.filter((item) => ["completed", "cancelled", "rejected"].includes(item.status)),
    [appointments]
  )

  const handleCancel = async (appointment: Appointment) => {
    try {
      await appointmentService.cancel(appointment.id, "Cancelled from dashboard")
      toast.success("Appointment cancelled.")
      await loadAppointments()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to cancel appointment.")
    }
  }

  const canPay = (appointment: Appointment) =>
    ["pending_payment", "pending"].includes(appointment.status) &&
    ["unpaid", "pending", "failed", "cancelled", "expired"].includes(appointment.paymentStatus)

  const canJoinMeeting = (appointment: Appointment) =>
    Boolean(appointment.meetingLink) &&
    appointment.meetingStatus === "ready" &&
    ["confirmed", "accepted", "rescheduled", "completed"].includes(appointment.status)

  const handleCopyMeetingLink = async (meetingLink: string) => {
    try {
      await navigator.clipboard.writeText(meetingLink)
      toast.success("Meeting link copied.")
    } catch {
      toast.error("Unable to copy the meeting link.")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Appointments</h1>
          <p className="text-muted-foreground">Manage your upcoming and past sessions.</p>
        </div>
        <Button asChild>
          <Link href="/therapists">Book New Session</Link>
        </Button>
      </div>

      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-6 space-y-4">
          {isLoading ? (
            <p className="text-muted-foreground">Loading appointments...</p>
          ) : error ? (
            <Card><CardContent className="py-12 text-center text-destructive">{error}</CardContent></Card>
          ) : upcoming.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">No upcoming appointments.</CardContent></Card>
          ) : (
            upcoming.map((appointment) => (
              <Card key={appointment.id}>
                <CardContent className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <p className="font-semibold">{appointment.therapistName}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(appointment.scheduledStart).toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {toTitleCaseSession(appointment.sessionType)} session
                    </p>
                    {appointment.status === "pending_payment" ? (
                      <p className="text-sm text-amber-700">
                        Proceed to payment to confirm this booking.
                      </p>
                    ) : appointment.status === "confirmed" ? (
                      <p className="text-sm text-emerald-700">
                        This session is confirmed. No further therapist approval is required.
                      </p>
                    ) : null}
                    <p className="text-sm text-muted-foreground capitalize">
                      Payment: {appointment.paymentStatus}
                    </p>
                    <p className="text-sm text-muted-foreground capitalize">
                      Meeting: {appointment.meetingStatus || "not created"}
                    </p>
                    {appointment.meetingLink ? (
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p>Join link is ready for this session.</p>
                        <p className="break-all">Link: {appointment.meetingLink}</p>
                        {getMeetingCode(appointment.meetingLink) ? (
                          <p>Meeting code: {getMeetingCode(appointment.meetingLink)}</p>
                        ) : null}
                      </div>
                    ) : appointment.paymentStatus === "paid" ? (
                      <p className="text-sm text-muted-foreground">Payment is verified. Meeting link will appear once prepared.</p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm capitalize text-muted-foreground">{appointment.status.replaceAll("_", " ")}</span>
                    {canPay(appointment) ? (
                      <Button asChild>
                        <Link href={`/dashboard/appointments/payment/${appointment.id}`}>Pay with Khalti</Link>
                      </Button>
                    ) : null}
                    {canJoinMeeting(appointment) ? (
                      <Button asChild variant="outline">
                        <Link href={appointment.meetingLink} target="_blank" rel="noreferrer">
                          Join Meeting
                        </Link>
                      </Button>
                    ) : null}
                    {appointment.meetingLink ? (
                      <Button variant="outline" onClick={() => handleCopyMeetingLink(appointment.meetingLink)}>
                        Copy Link
                      </Button>
                    ) : null}
                    <Button variant="outline" onClick={() => handleCancel(appointment)}>
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-6 space-y-4">
          {isLoading ? (
            <p className="text-muted-foreground">Loading appointment history...</p>
          ) : error ? (
            <Card><CardContent className="py-12 text-center text-destructive">{error}</CardContent></Card>
          ) : history.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">No past appointments.</CardContent></Card>
          ) : (
            history.map((appointment) => (
              <Card key={appointment.id}>
                <CardContent className="p-6">
                  <p className="font-semibold">{appointment.therapistName}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(appointment.scheduledStart).toLocaleString()}
                  </p>
                  <p className="text-sm capitalize text-muted-foreground mt-1">Payment: {appointment.paymentStatus}</p>
                  <p className="text-sm capitalize text-muted-foreground mt-1">Meeting: {appointment.meetingStatus || "not created"}</p>
                  {appointment.meetingLink ? (
                    <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                      <p className="break-all">Link: {appointment.meetingLink}</p>
                      {getMeetingCode(appointment.meetingLink) ? (
                        <p>Meeting code: {getMeetingCode(appointment.meetingLink)}</p>
                      ) : null}
                    </div>
                  ) : null}
                  {canJoinMeeting(appointment) ? (
                    <div className="mt-3 flex gap-2">
                      <Button asChild variant="outline" size="sm">
                        <Link href={appointment.meetingLink} target="_blank" rel="noreferrer">
                          Join Meeting
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleCopyMeetingLink(appointment.meetingLink)}>
                        Copy Link
                      </Button>
                    </div>
                  ) : null}
                  <p className="text-sm capitalize text-muted-foreground mt-1">{appointment.status}</p>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
