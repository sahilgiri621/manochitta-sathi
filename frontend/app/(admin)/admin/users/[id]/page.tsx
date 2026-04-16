"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { adminService } from "@/services"
import type { User } from "@/lib/types"

export default function AdminUserDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadUser = async () => {
    setIsLoading(true)
    try {
      const data = await adminService.getUser(params.id)
      setUser(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load user details.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadUser().catch(() => undefined)
  }, [params.id])

  const updateStatus = async (nextActive: boolean) => {
    if (!user) return
    try {
      const updated = nextActive
        ? await adminService.activateUser(user.id)
        : await adminService.deactivateUser(user.id)
      setUser(updated)
      toast.success(`User ${nextActive ? "activated" : "deactivated"}.`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to update user.")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground mb-1">
            <Link href="/admin/users" className="hover:text-foreground">Users</Link> / Details
          </p>
          <h1 className="text-2xl font-bold">User Detail</h1>
        </div>
        <Button variant="outline" onClick={() => router.push("/admin/users")}>
          Back to list
        </Button>
      </div>

      {isLoading ? <p className="text-muted-foreground">Loading user details...</p> : null}
      {error ? <p className="text-destructive">{error}</p> : null}

      {user ? (
        <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{user.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p>{user.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p>{user.phone || "Not provided"}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Role</p>
                  <p className="capitalize">{user.role}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p>{user.isActive === false ? "Inactive" : "Active"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Verified</p>
                  <p>{user.isVerified ? "Yes" : "No"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Admin Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {user.isActive === false ? (
                <Button className="w-full" onClick={() => updateStatus(true)}>
                  Activate User
                </Button>
              ) : (
                <Button variant="destructive" className="w-full" onClick={() => updateStatus(false)}>
                  Deactivate User
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  )
}
