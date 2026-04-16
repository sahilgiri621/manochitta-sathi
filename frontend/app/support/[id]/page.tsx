"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { TicketChat } from "@/components/support/ticket-chat"
import { supportService } from "@/services"
import type { SupportTicket } from "@/lib/types"
import { toast } from "sonner"

export default function SupportTicketDetailPage() {
  const params = useParams<{ id: string }>()
  const ticketId = String(params.id || "")
  const [ticket, setTicket] = useState<SupportTicket | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadTicket = async () => {
    setIsLoading(true)
    try {
      const data = await supportService.get(ticketId)
      setTicket(data)
      setError(null)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load support ticket.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!ticketId) return
    loadTicket().catch(() => undefined)
  }, [ticketId])

  const handleSend = async (message: string) => {
    setIsSending(true)
    try {
      await supportService.sendMessage(ticketId, message)
      await loadTicket()
    } catch (sendError) {
      toast.error(sendError instanceof Error ? sendError.message : "Unable to send support message.")
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-10 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Support Ticket</h1>
            <p className="text-muted-foreground mt-2">Continue the conversation with support.</p>
          </div>
          <Button asChild variant="outline">
            <Link href="/support">Back to Tickets</Link>
          </Button>
        </div>
        {isLoading ? <p className="text-muted-foreground">Loading ticket...</p> : null}
        {error ? <p className="text-destructive">{error}</p> : null}
        {!isLoading && !error ? <TicketChat ticket={ticket} viewerRole="user" onSendMessage={handleSend} isSending={isSending} /> : null}
      </div>
    </div>
  )
}

