"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Bell } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { notificationService } from "@/services"
import type { Notification, UserRole } from "@/lib/types"

const PREVIEW_LIMIT = 5

function getViewAllHref(role: UserRole) {
  if (role === "admin") return "/admin/notifications"
  if (role === "therapist") return "/therapist/notifications"
  return "/dashboard/notifications"
}

function getNotificationHref(notification: Notification, role: UserRole) {
  const metadata = notification.metadata || {}
  if (typeof metadata.ticket_id === "string") {
    return `/support/${metadata.ticket_id}`
  }
  if (typeof metadata.appointment_id === "string") {
    if (role === "admin") return "/admin/appointments"
    if (role === "therapist") return "/therapist/appointments"
    return "/dashboard/appointments"
  }
  if (typeof metadata.subscription_id === "string") {
    return "/dashboard/packages"
  }
  if (typeof metadata.url === "string" && metadata.url.startsWith("/")) {
    return metadata.url
  }
  return getViewAllHref(role)
}

export function NotificationBell({ role }: { role: UserRole }) {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const viewAllHref = useMemo(() => getViewAllHref(role), [role])

  const loadUnread = async () => {
    setIsLoading(true)
    try {
      const data = await notificationService.listPage({
        isRead: false,
        page: 1,
        pageSize: PREVIEW_LIMIT,
      })
      setNotifications(data.results)
      setUnreadCount(data.count)
      setError(null)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load notifications.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadUnread().catch(() => undefined)
  }, [])

  const openNotification = async (notification: Notification) => {
    const href = getNotificationHref(notification, role)
    setNotifications((current) => current.filter((item) => item.id !== notification.id))
    setUnreadCount((current) => Math.max(0, current - 1))
    try {
      await notificationService.markRead(notification.id)
    } catch {
      loadUnread().catch(() => undefined)
    }
    router.push(href)
  }

  return (
    <DropdownMenu onOpenChange={(open) => {
      if (open) loadUnread().catch(() => undefined)
    }}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 ? (
            <Badge className="absolute -right-1 -top-1 h-5 min-w-5 rounded-full px-1 text-[10px]">
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[min(360px,calc(100vw-2rem))] p-0">
        <div className="flex items-center justify-between px-4 py-3">
          <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
          {unreadCount > 0 ? (
            <span className="text-xs text-muted-foreground">{unreadCount} unread</span>
          ) : null}
        </div>
        <DropdownMenuSeparator />
        <div className="max-h-80 overflow-y-auto p-2">
          {isLoading ? (
            <p className="px-2 py-6 text-center text-sm text-muted-foreground">Loading notifications...</p>
          ) : error ? (
            <p className="px-2 py-6 text-center text-sm text-destructive">{error}</p>
          ) : notifications.length === 0 ? (
            <p className="px-2 py-6 text-center text-sm text-muted-foreground">No unread notifications</p>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className="block cursor-pointer rounded-md p-3"
                onSelect={(event) => {
                  event.preventDefault()
                  openNotification(notification).catch(() => undefined)
                }}
              >
                <p className="font-medium text-foreground">{notification.title}</p>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{notification.message}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {new Date(notification.createdAt).toLocaleString()}
                </p>
              </DropdownMenuItem>
            ))
          )}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="cursor-pointer justify-center p-3 font-medium">
          <Link href={viewAllHref}>View all notifications</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
