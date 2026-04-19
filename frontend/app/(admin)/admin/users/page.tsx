"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ConfirmActionDialog } from "@/components/admin/confirm-action-dialog"
import { toast } from "sonner"
import { adminService } from "@/services"
import type { User } from "@/lib/types"

type UserAction = {
  user: User
  active: boolean
  label: string
  destructive?: boolean
} | null

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [search, setSearch] = useState("")
  const [selectedDate, setSelectedDate] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pendingAction, setPendingAction] = useState<UserAction>(null)

  const loadUsers = async (date = selectedDate) => {
    setIsLoading(true)
    try {
      setUsers(await adminService.listUsers({ role: "user", date: date || undefined }))
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load users.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [selectedDate])

  const filteredUsers = useMemo(
    () =>
      users.filter((user) =>
        [user.name, user.email, user.role, user.isActive === false ? "inactive deactivated" : "active activated"]
          .join(" ")
          .toLowerCase()
          .includes(search.toLowerCase())
      ),
    [search, users]
  )

  const activeUsers = useMemo(
    () => filteredUsers.filter((user) => user.isActive !== false),
    [filteredUsers]
  )

  const inactiveUsers = useMemo(
    () => filteredUsers.filter((user) => user.isActive === false),
    [filteredUsers]
  )

  const confirmAction = async () => {
    if (!pendingAction) return
    setIsUpdating(true)
    try {
      if (pendingAction.active) {
        await adminService.activateUser(pendingAction.user.id)
      } else {
        await adminService.deactivateUser(pendingAction.user.id)
      }
      toast.success(`User ${pendingAction.active ? "activated" : "deactivated"}.`)
      setPendingAction(null)
      await loadUsers()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to update user.")
    } finally {
      setIsUpdating(false)
    }
  }

  const renderUserRow = (user: User, mode: "active" | "inactive") => (
    <div key={user.id} className="rounded-lg border border-border p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <Link href={`/admin/users/${user.id}`} className="font-medium hover:text-primary">
          {user.name}
        </Link>
        <p className="text-sm text-muted-foreground">{user.email}</p>
        <p className="text-sm text-muted-foreground">
          Status: {user.isActive === false ? "Inactive" : "Active"}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="ghost" asChild>
          <Link href={`/admin/users/${user.id}`}>View</Link>
        </Button>
        {mode === "inactive" ? (
          <Button onClick={() => setPendingAction({ user, active: true, label: "activate" })}>
            Activate
          </Button>
        ) : null}
        <Button
          variant="destructive"
          onClick={() => setPendingAction({ user, active: false, label: "deactivate", destructive: true })}
        >
          Deactivate
        </Button>
      </div>
    </div>
  )

  const renderUserList = (items: User[], emptyMessage: string, mode: "active" | "inactive") => {
    if (isLoading) return <p className="text-muted-foreground">Loading users...</p>
    if (error) return <p className="text-destructive">{error}</p>
    if (items.length === 0) return <p className="text-muted-foreground">{emptyMessage}</p>
    return <div className="space-y-3">{items.map((user) => renderUserRow(user, mode))}</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Users</h1>
        <p className="text-muted-foreground">Manage active and inactive user accounts.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_200px_auto] md:items-end">
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name or email" />
            <div className="space-y-2">
              <Label htmlFor="users-date">Filter by Date</Label>
              <Input id="users-date" type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} />
            </div>
            <Button variant="outline" onClick={() => setSelectedDate("")} disabled={!selectedDate}>
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">Active Users</TabsTrigger>
          <TabsTrigger value="inactive">Inactive Users</TabsTrigger>
        </TabsList>
        <TabsContent value="active" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Users</CardTitle>
            </CardHeader>
            <CardContent>
              {renderUserList(
                activeUsers,
                selectedDate ? "No active users were created on the selected day." : "No active users found.",
                "active"
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="inactive" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Inactive Users</CardTitle>
            </CardHeader>
            <CardContent>
              {renderUserList(
                inactiveUsers,
                selectedDate ? "No inactive users were created on the selected day." : "No inactive users found.",
                "inactive"
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ConfirmActionDialog
        open={Boolean(pendingAction)}
        onOpenChange={(open) => {
          if (!open && !isUpdating) setPendingAction(null)
        }}
        title="Are you sure?"
        description={
          pendingAction
            ? `Confirm ${pendingAction.label} for ${pendingAction.user.name}.`
            : "Confirm this user status update."
        }
        confirmLabel="Confirm"
        cancelLabel="Cancel"
        destructive={pendingAction?.destructive}
        isWorking={isUpdating}
        onConfirm={confirmAction}
      />
    </div>
  )
}
