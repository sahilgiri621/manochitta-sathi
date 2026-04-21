"use client"

import { NotificationsInbox } from "@/components/notifications/notifications-inbox"

export default function NotificationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
        <p className="text-muted-foreground">Review reminders, appointment updates, and system alerts.</p>
      </div>
      <NotificationsInbox />
    </div>
  )
}
