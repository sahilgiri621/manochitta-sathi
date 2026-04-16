"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TicketForm } from "@/components/support/ticket-form"
import { appointmentService, supportService } from "@/services"
import type { Appointment, SupportIssueType } from "@/lib/types"
import { toast } from "sonner"

export default function NewSupportTicketPage() {
  const router = useRouter()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [subject, setSubject] = useState("")
  const [issueType, setIssueType] = useState<SupportIssueType>("technical")
  const [description, setDescription] = useState("")
  const [appointmentId, setAppointmentId] = useState("")
  const [paymentReference, setPaymentReference] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    appointmentService
      .list()
      .then((data) => setAppointments(data))
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load appointments."))
  }, [])

  const handleSubmit = async () => {
    if (!subject.trim() || !description.trim()) {
      toast.error("Subject and description are required.")
      return
    }
    setIsSubmitting(true)
    try {
      const ticket = await supportService.create({
        subject: subject.trim(),
        issueType,
        description: description.trim(),
        appointment: appointmentId || undefined,
        paymentReference: paymentReference.trim() || undefined,
      })
      toast.success("Support ticket created.")
      router.push(`/support/${ticket.id}`)
    } catch (submitError) {
      toast.error(submitError instanceof Error ? submitError.message : "Unable to create support ticket.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-10 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">New Support Ticket</h1>
            <p className="text-muted-foreground mt-2">Share the issue and we will respond inside the ticket.</p>
          </div>
          <Button asChild variant="outline">
            <Link href="/support">Back to Tickets</Link>
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Tell us what happened</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <TicketForm
              subject={subject}
              issueType={issueType}
              description={description}
              appointmentId={appointmentId}
              paymentReference={paymentReference}
              appointments={appointments}
              isSubmitting={isSubmitting}
              onChange={(field, value) => {
                if (field === "subject") setSubject(value)
                if (field === "issueType") setIssueType(value as SupportIssueType)
                if (field === "description") setDescription(value)
                if (field === "appointmentId") setAppointmentId(value)
                if (field === "paymentReference") setPaymentReference(value)
              }}
              onSubmit={handleSubmit}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

