import { api } from "@/lib/api"
import type { Notification } from "@/lib/types"

export const notificationService = {
  list(filters?: { date?: string }): Promise<Notification[]> {
    return api.getNotifications(filters)
  },
  markRead(id: string): Promise<Notification> {
    return api.markNotificationRead(id)
  },
}
