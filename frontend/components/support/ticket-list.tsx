"use client"

import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { SupportTicket } from "@/lib/types"

function badgeVariant(status: SupportTicket["status"]): "default" | "secondary" | "outline" {
  if (status === "resolved") return "secondary"
  if (status === "in_progress") return "default"
  return "outline"
}

function formatStatus(status: SupportTicket["status"]) {
  return status.replace("_", " ")
}

type TicketListProps = {
  tickets: SupportTicket[]
  selectedId?: string
  emptyText: string
  onSelect?: (ticketId: string) => void
  hrefForTicket?: (ticketId: string) => string
}

export function TicketList({ tickets, selectedId, emptyText, onSelect, hrefForTicket }: TicketListProps) {
  if (tickets.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">{emptyText}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {tickets.map((ticket) => {
        const content = (
          <Card className={selectedId === ticket.id ? "border-primary" : ""}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-base">{ticket.subject}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">{ticket.issueType}</p>
                </div>
                <Badge variant={badgeVariant(ticket.status)}>{formatStatus(ticket.status)}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground line-clamp-2">
                {ticket.latestMessage || ticket.description}
              </p>
              <p className="text-xs text-muted-foreground">
                Updated {new Date(ticket.latestMessageAt || ticket.updatedAt).toLocaleString()}
              </p>
            </CardContent>
          </Card>
        )

        if (hrefForTicket) {
          return (
            <Link key={ticket.id} href={hrefForTicket(ticket.id)} className="block">
              {content}
            </Link>
          )
        }

        return (
          <button key={ticket.id} type="button" className="block w-full text-left" onClick={() => onSelect?.(ticket.id)}>
            {content}
          </button>
        )
      })}
    </div>
  )
}

