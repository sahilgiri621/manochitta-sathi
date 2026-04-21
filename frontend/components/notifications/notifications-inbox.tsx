"use client"

import { useEffect, useState } from "react"
import { Bell } from "lucide-react"
import { toast } from "sonner"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { notificationService } from "@/services"
import type { Notification } from "@/lib/types"

export function NotificationsInbox() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadNotifications = async () => {
    setIsLoading(true)
    try {
      setNotifications(await notificationService.list())
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load notifications.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadNotifications().catch(() => undefined)
  }, [])

  const handleMarkRead = async (id: string) => {
    try {
      await notificationService.markRead(id)
      setNotifications((current) =>
        current.map((notification) => (notification.id === id ? { ...notification, isRead: true } : notification))
      )
    } catch (markError) {
      toast.error(markError instanceof Error ? markError.message : "Unable to update notification.")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inbox</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <p className="text-muted-foreground">Loading notifications...</p>
        ) : error ? (
          <p className="text-destructive">{error}</p>
        ) : notifications.length === 0 ? (
          <div className="py-12 text-center">
            <Bell className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No notifications yet.</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div key={notification.id} className="rounded-lg border border-border p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium">{notification.title}</p>
                  <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(notification.createdAt).toLocaleString()}
                  </p>
                </div>
                {!notification.isRead && (
                  <Button variant="outline" size="sm" onClick={() => handleMarkRead(notification.id)}>
                    Mark as read
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
