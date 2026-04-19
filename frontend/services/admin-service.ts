import { api } from "@/lib/api"
import { packageService } from "@/services/package-service"
import { supportService } from "@/services/support-service"
import type { PackagePlan, PackagePlanInput, SupportTicket, SupportTicketMessage, SupportTicketStatus, User } from "@/lib/types"

export const adminService = {
  listUsers(filters?: { role?: string; isActive?: boolean; date?: string }): Promise<User[]> {
    return api.getAdminUsers(filters)
  },
  getUser(id: string): Promise<User> {
    return api.getAdminUser(id)
  },
  updateUser(id: string, payload: Partial<User> & { isActive?: boolean }): Promise<User> {
    return api.updateAdminUser(id, payload)
  },
  activateUser(id: string): Promise<User> {
    return api.activateAdminUser(id)
  },
  deactivateUser(id: string): Promise<User> {
    return api.deactivateAdminUser(id)
  },
  listPackages(): Promise<PackagePlan[]> {
    return packageService.listPlans({ auth: true })
  },
  createPackage(payload: PackagePlanInput): Promise<PackagePlan> {
    return packageService.createPlan(payload)
  },
  updatePackage(id: string, payload: Partial<PackagePlanInput>): Promise<PackagePlan> {
    return packageService.updatePlan(id, payload)
  },
  deletePackage(id: string): Promise<void> {
    return packageService.deletePlan(id)
  },
  listSupportTickets(filters?: { status?: string; issueType?: string }): Promise<SupportTicket[]> {
    return supportService.list(filters)
  },
  getSupportTicket(id: string): Promise<SupportTicket> {
    return supportService.get(id)
  },
  replyToSupportTicket(ticketId: string, message: string): Promise<SupportTicketMessage> {
    return supportService.sendMessage(ticketId, message)
  },
  updateSupportTicketStatus(id: string, status: SupportTicketStatus): Promise<SupportTicket> {
    return supportService.updateStatus(id, status)
  },
}
