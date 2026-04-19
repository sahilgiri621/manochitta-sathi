"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { supportService } from "@/services"
import { TicketList } from "@/components/support/ticket-list"
import { CrisisSupportBanner } from "@/components/crisis-support-banner"
import type { SupportTicket } from "@/lib/types"

export default function SupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supportService
      .list()
      .then((data) => {
        setTickets(data)
        setError(null)
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Unable to load support tickets.")
      })
      .finally(() => setIsLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold">Support</h1>
            <p className="text-muted-foreground mt-2">Track your help requests and continue the conversation with support.</p>
          </div>
          <Button asChild>
            <Link href="/support/new">New Ticket</Link>
          </Button>
        </div>
        {isLoading ? <p className="text-muted-foreground">Loading tickets...</p> : null}
        {error ? <p className="text-destructive mb-4">{error}</p> : null}
        {!isLoading && !error ? (
          <TicketList tickets={tickets} emptyText="You have not raised any support tickets yet." hrefForTicket={(id) => `/support/${id}`} />
        ) : null}
      </div>

      <CrisisSupportBanner />
    </div>
  )
}
