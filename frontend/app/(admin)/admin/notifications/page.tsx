"use client"

import { NotificationsInbox } from "@/components/notifications/notifications-inbox"

export default function AdminNotificationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Notifications</h1>
        <p className="text-muted-foreground">Review platform alerts, support updates, and admin notices.</p>
      </div>
      <NotificationsInbox />
    </div>
  )
}
