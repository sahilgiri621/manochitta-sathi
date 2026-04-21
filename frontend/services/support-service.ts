import { api } from "@/lib/api"
import type { PaginatedResponse, SupportIssueType, SupportTicket, SupportTicketMessage, SupportTicketStatus } from "@/lib/types"

export const supportService = {
  list(filters?: { status?: string; issueType?: string; page?: number; pageSize?: number; search?: string }): Promise<SupportTicket[]> {
    return api.getSupportTickets(filters)
  },
  listPage(filters?: { status?: string; issueType?: string; page?: number; pageSize?: number; search?: string }): Promise<PaginatedResponse<SupportTicket>> {
    return api.getSupportTicketsPage(filters)
  },
  get(id: string): Promise<SupportTicket> {
    return api.getSupportTicket(id)
  },
  create(payload: {
    subject: string
    issueType: SupportIssueType
    description: string
    appointment?: string
    paymentReference?: string
  }): Promise<SupportTicket> {
    return api.createSupportTicket(payload)
  },
  listMessages(ticketId: string): Promise<SupportTicketMessage[]> {
    return api.getSupportMessages(ticketId)
  },
  sendMessage(ticketId: string, message: string): Promise<SupportTicketMessage> {
    return api.sendSupportMessage(ticketId, message)
  },
  updateStatus(id: string, status: SupportTicketStatus): Promise<SupportTicket> {
    return api.updateSupportTicketStatus(id, status)
  },
}
