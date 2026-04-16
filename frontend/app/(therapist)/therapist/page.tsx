"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/providers/auth-provider"
import { appointmentService, therapistService } from "@/services"
import type { Appointment, Therapist } from "@/lib/types"

export default function TherapistDashboardPage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<Therapist | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([therapistService.getMyProfile(), appointmentService.list()])
      .then(([profileData, appointmentData]) => {
        setProfile(profileData)
        setAppointments(appointmentData)
        setError(null)
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Unable to load therapist dashboard.")
      })
  }, [])

  const upcomingCount = useMemo(
    () => appointments.filter((appointment) => ["confirmed", "accepted", "rescheduled"].includes(appointment.status)).length,
    [appointments]
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Welcome back, {user?.name}</h1>
          <p className="text-muted-foreground">
            {profile ? `${profile.title} | ${profile.approvalStatus}` : "Loading therapist profile..."}
          </p>
        </div>
        <Button asChild>
          <Link href="/therapist/availability">Manage Availability</Link>
        </Button>
      </div>

      {profile?.approvalStatus === "pending" && (
        <Card className="border-amber-300 bg-amber-50">
          <CardContent className="p-5">
            <p className="font-medium text-amber-900">Application pending review</p>
            <p className="text-sm text-amber-800 mt-1">
              Your therapist profile has been created and is waiting for admin approval. You can keep updating your
              professional details while it is pending.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="p-6"><p className="text-sm text-muted-foreground">Upcoming sessions</p><p className="text-3xl font-bold mt-2">{upcomingCount}</p></CardContent></Card>
        <Card><CardContent className="p-6"><p className="text-sm text-muted-foreground">Languages</p><p className="text-3xl font-bold mt-2">{profile?.languages.length || 0}</p></CardContent></Card>
        <Card><CardContent className="p-6"><p className="text-sm text-muted-foreground">Fee</p><p className="text-3xl font-bold mt-2">NPR {profile?.pricePerSession?.toLocaleString() || "0"}</p></CardContent></Card>
      </div>

      {error ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Recent Appointments</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {appointments.slice(0, 5).map((appointment) => (
            <div key={appointment.id} className="rounded-lg border border-border p-4">
              <p className="font-medium">{appointment.userName}</p>
              <p className="text-sm text-muted-foreground">{new Date(appointment.scheduledStart).toLocaleString()}</p>
              <p className="text-sm text-muted-foreground capitalize">{appointment.status.replaceAll("_", " ")}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
