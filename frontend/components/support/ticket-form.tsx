"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { Appointment, SupportIssueType } from "@/lib/types"

type TicketFormProps = {
  subject: string
  issueType: SupportIssueType
  description: string
  appointmentId: string
  paymentReference: string
  appointments: Appointment[]
  isSubmitting?: boolean
  onChange: (field: "subject" | "issueType" | "description" | "appointmentId" | "paymentReference", value: string) => void
  onSubmit: () => void
}

export function TicketForm({
  subject,
  issueType,
  description,
  appointmentId,
  paymentReference,
  appointments,
  isSubmitting,
  onChange,
  onSubmit,
}: TicketFormProps) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="support-subject">Subject</Label>
        <Input id="support-subject" value={subject} onChange={(event) => onChange("subject", event.target.value)} />
      </div>
      <div>
        <Label htmlFor="support-issue-type">Issue Type</Label>
        <select
          id="support-issue-type"
          className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={issueType}
          onChange={(event) => onChange("issueType", event.target.value)}
        >
          <option value="payment">Payment</option>
          <option value="refund">Refund</option>
          <option value="appointment">Appointment</option>
          <option value="technical">Technical</option>
        </select>
      </div>
      <div>
        <Label htmlFor="support-appointment">Related Appointment</Label>
        <select
          id="support-appointment"
          className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={appointmentId}
          onChange={(event) => onChange("appointmentId", event.target.value)}
        >
          <option value="">No specific appointment</option>
          {appointments.map((appointment) => (
            <option key={appointment.id} value={appointment.id}>
              {appointment.therapistName} | {new Date(appointment.scheduledStart).toLocaleString()}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="support-payment-reference">Payment Reference</Label>
        <Input
          id="support-payment-reference"
          value={paymentReference}
          onChange={(event) => onChange("paymentReference", event.target.value)}
          placeholder="Khalti pidx or transaction ID"
        />
      </div>
      <div>
        <Label htmlFor="support-description">Description</Label>
        <Textarea
          id="support-description"
          value={description}
          onChange={(event) => onChange("description", event.target.value)}
          className="min-h-32"
        />
      </div>
      <Button onClick={onSubmit} disabled={isSubmitting}>
        {isSubmitting ? "Submitting..." : "Create Ticket"}
      </Button>
    </div>
  )
}

