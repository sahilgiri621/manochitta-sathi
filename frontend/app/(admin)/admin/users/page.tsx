"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { adminService, therapistService } from "@/services"
import type { Therapist, User } from "@/lib/types"

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [therapistProfiles, setTherapistProfiles] = useState<Therapist[]>([])
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all")
  const [selectedDate, setSelectedDate] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [errors, setErrors] = useState<string[]>([])

  const loadUsers = async (date = selectedDate) => {
    setIsLoading(true)
    try {
      const [userResult, therapistResult] = await Promise.allSettled([
        adminService.listUsers({ date: date || undefined }),
        therapistService.listForAdmin({ date: date || undefined }),
      ])

      setUsers(userResult.status === "fulfilled" ? userResult.value : [])
      setTherapistProfiles(therapistResult.status === "fulfilled" ? therapistResult.value : [])

      const nextErrors = [userResult, therapistResult]
        .map((result, index) => {
          if (result.status === "fulfilled") return null
          const source = index === 0 ? "users" : "therapists"
          return `${source}: ${result.reason instanceof Error ? result.reason.message : "Unknown error"}`
        })
        .filter(Boolean) as string[]
      setErrors(nextErrors)
    } catch (err) {
      setErrors([err instanceof Error ? err.message : "Unable to load users."])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [selectedDate])

  const therapistProfilesByUserId = useMemo(
    () => new Map(therapistProfiles.map((therapist) => [therapist.userId, therapist])),
    [therapistProfiles]
  )

  const filteredUsers = useMemo(
    () =>
      users.filter((user) => {
        const matchesSearch = [user.name, user.email, user.role].some((value) =>
          value.toLowerCase().includes(search.toLowerCase())
        )
        const isActive = user.isActive !== false
        const matchesStatus =
          statusFilter === "all" ||
          (statusFilter === "active" && isActive) ||
          (statusFilter === "inactive" && !isActive)
        return matchesSearch && matchesStatus
      }),
    [search, statusFilter, users]
  )

  const therapistUsers = useMemo(
    () => filteredUsers.filter((user) => user.role === "therapist"),
    [filteredUsers]
  )

  const nonTherapistUsers = useMemo(
    () => filteredUsers.filter((user) => user.role !== "therapist"),
    [filteredUsers]
  )

  const pendingTherapists = useMemo(
    () =>
      therapistProfiles.filter((therapist) => {
        const linkedUser = users.find((user) => user.id === therapist.userId)
        if (!linkedUser) return false
        const matchesSearch = [linkedUser.name, linkedUser.email, therapist.title, therapist.approvalStatus]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(search.toLowerCase())
        const isActive = linkedUser.isActive !== false
        const matchesStatus =
          statusFilter === "all" ||
          (statusFilter === "active" && isActive) ||
          (statusFilter === "inactive" && !isActive)
        return therapist.approvalStatus === "pending" && matchesSearch && matchesStatus
      }),
    [search, statusFilter, therapistProfiles, users]
  )

  const updateStatus = async (user: User, nextActive: boolean) => {
    try {
      if (nextActive) {
        await adminService.activateUser(user.id)
      } else {
        await adminService.deactivateUser(user.id)
      }
      await loadUsers()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update user.")
    }
  }

  const renderUserRow = (user: User) => {
    const therapistProfile = therapistProfilesByUserId.get(user.id)

    return (
      <div key={user.id} className="rounded-lg border border-border p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <Link href={`/admin/users/${user.id}`} className="font-medium hover:text-primary">
            {user.name}
          </Link>
          <p className="text-sm text-muted-foreground">{user.email}</p>
          <p className="text-sm text-muted-foreground capitalize">
            {user.role} {user.isActive === false ? "| inactive" : ""}
          </p>
          {therapistProfile?.approvalStatus === "pending" ? (
            <p className="text-sm text-amber-700">
              Pending therapist application: {therapistProfile.title || therapistProfile.specializations[0] || "Awaiting review"}
            </p>
          ) : null}
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" asChild>
            <Link href={`/admin/users/${user.id}`}>View</Link>
          </Button>
          {user.role === "therapist" && therapistProfile?.approvalStatus === "pending" ? (
            <Button variant="outline" asChild>
              <Link href={`/admin/therapists/${therapistProfile.id}`}>Review application</Link>
            </Button>
          ) : null}
          <Button variant="outline" onClick={() => updateStatus(user, false)}>Deactivate</Button>
          <Button onClick={() => updateStatus(user, true)}>Activate</Button>
        </div>
      </div>
    )
  }

  const renderSection = (title: string, description: string, items: User[], emptyMessage: string) => (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 ? <p className="text-muted-foreground">{emptyMessage}</p> : items.map(renderUserRow)}
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Users</h1>
        <p className="text-muted-foreground">Admin user management backed by `/api/v1/auth/admin/users/`.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_180px_200px_auto] md:items-end">
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name, email, or role" />
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as "all" | "active" | "inactive")}
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <div className="space-y-2">
              <Label htmlFor="users-date">Filter by Date</Label>
              <Input id="users-date" type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} />
            </div>
            <Button variant="outline" onClick={() => setSelectedDate("")} disabled={!selectedDate}>
              Reset
            </Button>
          </div>
          {isLoading ? <p className="text-muted-foreground">Loading users...</p> : null}
          {errors.length > 0 ? (
            <div className="space-y-1">
              {errors.map((error) => (
                <p key={error} className="text-destructive">{error}</p>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {!isLoading ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Pending Therapist Applications</CardTitle>
              <p className="text-sm text-muted-foreground">Only therapist profiles waiting for approval are shown here.</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {pendingTherapists.length === 0 ? (
                <p className="text-muted-foreground">
                  {selectedDate ? "No pending therapist applications were created on the selected day." : "No pending therapist applications match the current filters."}
                </p>
              ) : (
                pendingTherapists.map((therapist) => {
                  const user = users.find((candidate) => candidate.id === therapist.userId)
                  return user ? renderUserRow(user) : null
                })
              )}
            </CardContent>
          </Card>

          {renderSection(
            "Therapist Accounts",
            "Therapist user accounts are always shown separately from the general user base.",
            therapistUsers,
            selectedDate ? "No therapist accounts were created on the selected day." : "No therapist accounts match the current filters."
          )}

          {renderSection(
            "Users And Admins",
            "General users and admins are listed here without therapist accounts mixed in.",
            nonTherapistUsers,
            selectedDate ? "No user or admin accounts were created on the selected day." : "No non-therapist users match the current filters."
          )}
        </>
      ) : null}
    </div>
  )
}
