"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { appointmentService, therapistService } from "@/services"
import type { Appointment, Therapist } from "@/lib/types"

export default function TherapistEarningsPage() {
  const [profile, setProfile] = useState<Therapist | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([therapistService.getMyProfile(), appointmentService.list()])
      .then(([profileData, appointmentData]) => {
        setProfile(profileData)
        setAppointments(appointmentData)
        setError(null)
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Unable to load earnings.")
      })
      .finally(() => setIsLoading(false))
  }, [])

  const completedAppointments = useMemo(
    () => appointments.filter((appointment) => appointment.status === "completed"),
    [appointments]
  )

  const nextTierText = profile?.nextTierMinSessions
    ? `Next tier at ${profile.nextTierMinSessions} sessions`
    : "Top tier reached"

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Earnings</h1>
        <p className="text-muted-foreground">Track completed-session earnings and your current commission tier.</p>
      </div>

      {isLoading ? <p className="text-muted-foreground">Loading earnings...</p> : null}
      {error ? <p className="text-destructive">{error}</p> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Current tier</p>
            <p className="mt-2 text-3xl font-bold">{profile?.commissionTier || "Starter"}</p>
            <p className="mt-2 text-xs text-muted-foreground">{nextTierText}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Commission rate</p>
            <p className="mt-2 text-3xl font-bold">{(((profile?.commissionRate || 0) * 100)).toFixed(0)}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Completed sessions</p>
            <p className="mt-2 text-3xl font-bold">{profile?.completedSessions || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Total earnings</p>
            <p className="mt-2 text-3xl font-bold">NPR {profile?.totalEarnings?.toLocaleString() || "0"}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Earnings per Completed Session</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {completedAppointments.length === 0 ? (
            <p className="text-muted-foreground">No completed-session earnings have been recorded yet.</p>
          ) : (
            completedAppointments.map((appointment) => (
              <div key={appointment.id} className="rounded-lg border border-border p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="font-medium">{appointment.userName}</p>
                    <p className="text-sm text-muted-foreground">{new Date(appointment.scheduledStart).toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Tier used: {appointment.tierUsed || "Not locked"}</p>
                  </div>
                  <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2 md:text-right">
                    <span>Session price: NPR {(appointment.sessionPrice || 0).toLocaleString()}</span>
                    <span>Commission: {(((appointment.commissionRateUsed || 0) * 100)).toFixed(0)}%</span>
                    <span>Platform fee: NPR {(appointment.platformCommission || 0).toLocaleString()}</span>
                    <span className="font-medium text-foreground">Your earning: NPR {(appointment.therapistEarning || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
