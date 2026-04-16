"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { TicketChat } from "@/components/support/ticket-chat"
import { TicketList } from "@/components/support/ticket-list"
import { adminService } from "@/services"
import type { SupportTicket, SupportTicketStatus } from "@/lib/types"
import { toast } from "sonner"

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [selectedId, setSelectedId] = useState("")
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadTickets = async (status?: string) => {
    setIsLoading(true)
    try {
      const data = await adminService.listSupportTickets({ status })
      setTickets(data)
      setSelectedId((current) => current || data[0]?.id || "")
      setError(null)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load support tickets.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadTickets(statusFilter || undefined).catch(() => undefined)
  }, [statusFilter])

  const filteredTickets = useMemo(
    () =>
      tickets.filter((ticket) =>
        [ticket.subject, ticket.userName, ticket.latestMessage, ticket.issueType, ticket.status]
          .join(" ")
          .toLowerCase()
          .includes(search.toLowerCase())
      ),
    [tickets, search]
  )

  const selectedTicket = filteredTickets.find((ticket) => ticket.id === selectedId) || tickets.find((ticket) => ticket.id === selectedId) || null

  const handleSend = async (message: string) => {
    if (!selectedTicket) return
    setIsSending(true)
    try {
      await adminService.replyToSupportTicket(selectedTicket.id, message)
      await loadTickets(statusFilter || undefined)
    } catch (sendError) {
      toast.error(sendError instanceof Error ? sendError.message : "Unable to send reply.")
    } finally {
      setIsSending(false)
    }
  }

  const handleStatusChange = async (status: SupportTicketStatus) => {
    if (!selectedTicket || status === selectedTicket.status) return
    setIsUpdatingStatus(true)
    try {
      await adminService.updateSupportTicketStatus(selectedTicket.id, status)
      await loadTickets(statusFilter || undefined)
      toast.success("Ticket status updated.")
    } catch (statusError) {
      toast.error(statusError instanceof Error ? statusError.message : "Unable to update ticket status.")
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Support Queue</h1>
        <p className="text-muted-foreground">Review tickets, reply to users, and update resolution status.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-[1fr_220px]">
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search tickets by subject, user, message, issue type, or status" />
          <select
            className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="">All statuses</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>
        </CardContent>
      </Card>

      {error ? <p className="text-destructive">{error}</p> : null}
      {isLoading ? <p className="text-muted-foreground">Loading support tickets...</p> : null}

      {!isLoading ? (
        <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
          <TicketList
            tickets={filteredTickets}
            selectedId={selectedId}
            emptyText="No support tickets match the current filters."
            onSelect={setSelectedId}
          />
          <TicketChat
            ticket={selectedTicket}
            viewerRole="admin"
            isSending={isSending}
            isUpdatingStatus={isUpdatingStatus}
            onSendMessage={handleSend}
            onStatusChange={handleStatusChange}
          />
        </div>
      ) : null}
    </div>
  )
}
