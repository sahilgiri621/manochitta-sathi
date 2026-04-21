import { api } from "@/lib/api"
import type { Notification, PaginatedResponse } from "@/lib/types"

export const notificationService = {
  list(filters?: { date?: string; isRead?: boolean; page?: number; pageSize?: number }): Promise<Notification[]> {
    return api.getNotifications(filters)
  },
  listPage(filters?: { date?: string; isRead?: boolean; page?: number; pageSize?: number }): Promise<PaginatedResponse<Notification>> {
    return api.getNotificationsPage(filters)
  },
  markRead(id: string): Promise<Notification> {
    return api.markNotificationRead(id)
  },
}
