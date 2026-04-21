"use client"

import { NotificationsInbox } from "@/components/notifications/notifications-inbox"

export default function TherapistNotificationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Notifications</h1>
        <p className="text-muted-foreground">Review appointment updates, approvals, and support messages.</p>
      </div>
      <NotificationsInbox />
    </div>
  )
}
