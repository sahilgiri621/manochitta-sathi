"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { appointmentService, feedbackService } from "@/services"
import type { Appointment, Feedback } from "@/lib/types"

export default function FeedbackPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [feedbackEntries, setFeedbackEntries] = useState<Feedback[]>([])
  const [selectedAppointment, setSelectedAppointment] = useState("")
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [appointmentData, feedbackData] = await Promise.all([
        appointmentService.list(),
        feedbackService.list(),
      ])
      setAppointments(appointmentData)
      setFeedbackEntries(feedbackData)
      setError(null)
      const completedWithoutFeedback = appointmentData.find(
        (appointment) =>
          appointment.status === "completed" &&
          !feedbackData.some((entry) => entry.appointment === appointment.id)
      )
      setSelectedAppointment((current) => current || completedWithoutFeedback?.id || "")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load feedback data.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData().catch(() => undefined)
  }, [])

  const pendingAppointments = useMemo(
    () =>
      appointments.filter(
        (appointment) =>
          appointment.status === "completed" &&
          !feedbackEntries.some((entry) => entry.appointment === appointment.id)
      ),
    [appointments, feedbackEntries]
  )

  const handleSubmit = async () => {
    if (!selectedAppointment) {
      toast.error("Select a completed appointment first.")
      return
    }

    setIsSubmitting(true)
    try {
      await feedbackService.submit(selectedAppointment, Number(rating), comment.trim())
      toast.success("Feedback submitted.")
      setComment("")
      setRating(5)
      await loadData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to submit feedback.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Feedback</h1>
        <p className="text-muted-foreground">Rate completed sessions and review your submitted feedback.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Leave Feedback</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? <p className="text-muted-foreground">Loading feedback form...</p> : null}
          {error ? <p className="text-destructive">{error}</p> : null}
          {!isLoading && pendingAppointments.length === 0 ? (
            <p className="text-muted-foreground">No completed appointments are awaiting feedback.</p>
          ) : (
            <>
              <div>
                <Label htmlFor="feedback-appointment">Completed appointment</Label>
                <select
                  id="feedback-appointment"
                  className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={selectedAppointment}
                  onChange={(event) => setSelectedAppointment(event.target.value)}
                >
                  <option value="">Select an appointment</option>
                  {pendingAppointments.map((appointment) => (
                    <option key={appointment.id} value={appointment.id}>
                      {appointment.therapistName} | {new Date(appointment.scheduledStart).toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Rating</Label>
                <div className="mt-2 flex gap-2">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <Button
                      key={value}
                      type="button"
                      variant={rating === value ? "default" : "outline"}
                      aria-label={`${value} ${value === 1 ? "star" : "stars"}`}
                      onClick={() => setRating(value)}
                    >
                      {value} {value === 1 ? "Star" : "Stars"}
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <Label htmlFor="feedback-comment">Comment</Label>
                <Textarea id="feedback-comment" value={comment} onChange={(event) => setComment(event.target.value)} />
              </div>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit Feedback"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Feedback History</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {feedbackEntries.length === 0 ? (
            <p className="text-muted-foreground">No feedback submitted yet.</p>
          ) : (
            feedbackEntries.map((entry) => {
              const appointment = appointments.find((item) => item.id === entry.appointment)
              return (
                <div key={entry.id} className="rounded-lg border border-border p-4">
                  <p className="font-medium">{appointment?.therapistName || "Therapist"}</p>
                  <p className="text-sm text-muted-foreground">Rating: {entry.rating}/5</p>
                  {entry.comment ? <p className="mt-2 text-sm">{entry.comment}</p> : null}
                </div>
              )
            })
          )}
        </CardContent>
      </Card>
    </div>
  )
}
