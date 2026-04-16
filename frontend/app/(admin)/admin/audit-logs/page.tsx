"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { adminService } from "@/services"
import type { AdminAction } from "@/lib/types"

export default function AdminAuditLogsPage() {
  const [actions, setActions] = useState<AdminAction[]>([])
  const [search, setSearch] = useState("")
  const [selectedDate, setSelectedDate] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setIsLoading(true)
    adminService
      .listActions({ date: selectedDate || undefined })
      .then((data) => {
        setActions(data)
        setError(null)
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Unable to load audit logs.")
      })
      .finally(() => setIsLoading(false))
  }, [selectedDate])

  const filteredActions = useMemo(
    () =>
      actions.filter((action) =>
        [action.adminName, action.action, action.targetType, action.targetId]
          .join(" ")
          .toLowerCase()
          .includes(search.toLowerCase())
      ),
    [actions, search]
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Audit Logs</h1>
        <p className="text-muted-foreground">Track admin activity across approvals, user management, and content updates.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Admin Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_200px_auto] md:items-end">
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by admin, action, target, or target ID" />
            <div className="space-y-2">
              <Label htmlFor="audit-date">Filter by Date</Label>
              <Input id="audit-date" type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} />
            </div>
            <Button variant="outline" onClick={() => setSelectedDate("")} disabled={!selectedDate}>
              Reset
            </Button>
          </div>
          {isLoading ? (
            <p className="text-muted-foreground">Loading audit logs...</p>
          ) : error ? (
            <p className="text-destructive">{error}</p>
          ) : filteredActions.length === 0 ? (
            <p className="text-muted-foreground">
              {selectedDate ? "No admin actions were recorded on the selected day." : "No admin actions match the current search."}
            </p>
          ) : (
            <div className="space-y-3">
              {filteredActions.map((action) => (
                <div key={action.id} className="rounded-lg border border-border p-4">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
                    <div>
                      <p className="font-medium">{action.action}</p>
                      <p className="text-sm text-muted-foreground">
                        {action.adminName || "Admin"} • {action.targetType} #{action.targetId}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">{new Date(action.createdAt).toLocaleString()}</p>
                  </div>
                  {Object.keys(action.details || {}).length > 0 ? (
                    <pre className="mt-3 overflow-x-auto rounded-md bg-muted p-3 text-xs text-muted-foreground">
                      {JSON.stringify(action.details, null, 2)}
                    </pre>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
