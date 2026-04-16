"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import type { SupportTicket, SupportTicketStatus, UserRole } from "@/lib/types"

function badgeVariant(status: SupportTicketStatus): "default" | "secondary" | "outline" {
  if (status === "resolved") return "secondary"
  if (status === "in_progress") return "default"
  return "outline"
}

type TicketChatProps = {
  ticket: SupportTicket | null
  viewerRole: UserRole
  isSending?: boolean
  isUpdatingStatus?: boolean
  onSendMessage: (message: string) => void | Promise<void>
  onStatusChange?: (status: SupportTicketStatus) => void | Promise<void>
}

export function TicketChat({
  ticket,
  viewerRole,
  isSending,
  isUpdatingStatus,
  onSendMessage,
  onStatusChange,
}: TicketChatProps) {
  const [draft, setDraft] = useState("")

  if (!ticket) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">Select a support ticket to view the conversation.</p>
        </CardContent>
      </Card>
    )
  }

  const handleSend = async () => {
    if (!draft.trim()) return
    await onSendMessage(draft.trim())
    setDraft("")
  }

  return (
    <Card className="h-full">
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>{ticket.subject}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {ticket.issueType} {ticket.appointment ? `| Appointment #${ticket.appointment}` : ""}
            </p>
          </div>
          <Badge variant={badgeVariant(ticket.status)}>{ticket.status.replace("_", " ")}</Badge>
        </div>
        {viewerRole === "admin" && onStatusChange ? (
          <div className="flex items-center gap-2">
            <select
              className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={ticket.status}
              onChange={(event) => onStatusChange(event.target.value as SupportTicketStatus)}
              disabled={isUpdatingStatus}
            >
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
            {ticket.paymentReference ? (
              <p className="text-xs text-muted-foreground">Payment ref: {ticket.paymentReference}</p>
            ) : null}
          </div>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
          {ticket.messages.map((message) => (
            <div
              key={message.id}
              className={`rounded-lg border p-3 ${
                message.isAdmin ? "border-primary/20 bg-primary/5" : "border-border bg-background"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium text-sm">{message.senderName || (message.isAdmin ? "Support" : "You")}</p>
                <p className="text-xs text-muted-foreground">{new Date(message.createdAt).toLocaleString()}</p>
              </div>
              <p className="mt-2 text-sm whitespace-pre-wrap">{message.message}</p>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={viewerRole === "admin" ? "Reply to the user..." : "Add a message..."}
          />
          <Button onClick={handleSend} disabled={isSending || !draft.trim()}>
            {isSending ? "Sending..." : "Send"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
