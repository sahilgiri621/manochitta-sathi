"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Bell, Heart, ArrowRight } from "lucide-react"
import { useAuth } from "@/components/providers/auth-provider"
import { getMoodMeta } from "@/lib/mood"
import { appointmentService, moodService, notificationService } from "@/services"
import type { Appointment, MoodEntry, Notification } from "@/lib/types"

export default function DashboardPage() {
  const { user } = useAuth()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([appointmentService.list(), moodService.list(), notificationService.list()])
      .then(([appointmentData, moodData, notificationData]) => {
        setAppointments(appointmentData)
        setMoodEntries(moodData)
        setNotifications(notificationData)
        setError(null)
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load dashboard data.")
      })
      .finally(() => setIsLoading(false))
  }, [])

  const upcomingAppointments = useMemo(
    () =>
      appointments
        .filter((appointment) => ["pending_payment", "pending", "confirmed", "accepted", "rescheduled"].includes(appointment.status))
        .slice(0, 3),
    [appointments]
  )

  const averageMood = useMemo(() => {
    if (moodEntries.length === 0) return null
    return (moodEntries.reduce((sum, entry) => sum + entry.moodScore, 0) / moodEntries.length).toFixed(1)
  }, [moodEntries])

  const unreadNotifications = notifications.filter((item) => !item.isRead).length

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Welcome back, {user?.firstName || user?.name}</h1>
          <p className="text-muted-foreground">Your latest appointments, mood trends, and notifications.</p>
        </div>
        <Button asChild>
          <Link href="/therapists">
            <Calendar className="mr-2 h-4 w-4" />
            Book a Session
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Upcoming appointments</p>
            <p className="text-3xl font-bold mt-2">{upcomingAppointments.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Average mood</p>
            <p className="text-3xl font-bold mt-2">{averageMood ? `${averageMood}/5` : "-"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Unread notifications</p>
            <p className="text-3xl font-bold mt-2">{unreadNotifications}</p>
          </CardContent>
        </Card>
      </div>

      {error ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Upcoming Appointments</CardTitle>
            <Link href="/dashboard/appointments" className="text-sm text-primary inline-flex items-center">
              View all
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <p className="text-muted-foreground">Loading appointments...</p>
            ) : upcomingAppointments.length === 0 ? (
              <p className="text-muted-foreground">No upcoming appointments yet.</p>
            ) : (
              upcomingAppointments.map((appointment) => (
                <div key={appointment.id} className="rounded-lg border border-border p-4">
                  <p className="font-medium">{appointment.therapistName}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(appointment.scheduledStart).toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground capitalize">{appointment.status.replaceAll("_", " ")}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Notifications</CardTitle>
            <Link href="/dashboard/notifications" className="text-sm text-primary inline-flex items-center">
              View inbox
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <p className="text-muted-foreground">Loading notifications...</p>
            ) : notifications.length === 0 ? (
              <p className="text-muted-foreground">No notifications yet.</p>
            ) : (
              notifications.slice(0, 4).map((notification) => (
                <div key={notification.id} className="rounded-lg border border-border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{notification.title}</p>
                      <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                    </div>
                    {!notification.isRead && <Bell className="h-4 w-4 text-primary" />}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Mood Overview</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground">Loading mood history...</p>
            ) : moodEntries.length === 0 ? (
              <div className="text-center py-8">
                <Heart className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
                <p className="text-muted-foreground mb-4">No mood entries yet.</p>
                <Button asChild variant="outline">
                  <Link href="/dashboard/mood">Log today&apos;s mood</Link>
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-7 gap-3">
                {moodEntries.slice(0, 7).map((entry) => (
                  <div key={entry.id} className="rounded-lg bg-muted p-4 text-center">
                    <p className="text-sm text-muted-foreground">
                      {new Date(entry.entryDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </p>
                    <p className="mt-2 text-lg font-semibold">
                      {getMoodMeta(entry.mood)?.emoji} {entry.moodLabel}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Stress {entry.stressLevel}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
