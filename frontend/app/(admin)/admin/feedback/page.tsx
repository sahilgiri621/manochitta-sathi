"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AdminPagination } from "@/components/admin/admin-pagination"
import { feedbackService } from "@/services"
import type { Feedback } from "@/lib/types"

const PAGE_SIZE = 10

export default function AdminFeedbackPage() {
  const [feedbackEntries, setFeedbackEntries] = useState<Feedback[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [search, setSearch] = useState("")
  const [selectedDate, setSelectedDate] = useState("")
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setPage(1)
  }, [search, selectedDate])

  useEffect(() => {
    setIsLoading(true)
    feedbackService
      .listPage({
        date: selectedDate || undefined,
        search: search.trim() || undefined,
        page,
        pageSize: PAGE_SIZE,
      })
      .then((data) => {
        setFeedbackEntries(data.results)
        setTotalCount(data.count)
        setError(null)
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Unable to load feedback.")
      })
      .finally(() => setIsLoading(false))
  }, [page, search, selectedDate])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Feedback Oversight</h1>
        <p className="text-muted-foreground">Review therapy feedback submitted by platform users.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Submitted Feedback</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_200px_auto] md:items-end">
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by user, therapist, comment, or rating" />
            <div className="space-y-2">
              <Label htmlFor="feedback-date">Filter by Date</Label>
              <Input id="feedback-date" type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} />
            </div>
            <Button variant="outline" onClick={() => setSelectedDate("")} disabled={!selectedDate}>
              Reset
            </Button>
          </div>
          {isLoading ? (
            <p className="text-muted-foreground">Loading feedback...</p>
          ) : error ? (
            <p className="text-destructive">{error}</p>
          ) : feedbackEntries.length === 0 ? (
            <p className="text-muted-foreground">
              {selectedDate ? "No feedback entries were submitted on the selected day." : "No feedback entries match the current search."}
            </p>
          ) : (
            <div className="space-y-3">
              {feedbackEntries.map((entry) => (
                <div key={entry.id} className="rounded-lg border border-border p-4">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
                    <div>
                      <p className="font-medium">{entry.userName || "User"} → {entry.therapistName || "Therapist"}</p>
                      <p className="text-sm text-muted-foreground">Rating {entry.rating}/5</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {entry.appointmentScheduledStart ? new Date(entry.appointmentScheduledStart).toLocaleString() : ""}
                    </p>
                  </div>
                  <p className="mt-3 text-sm">{entry.comment || "No written feedback provided."}</p>
                </div>
              ))}
              <AdminPagination
                page={page}
                pageSize={PAGE_SIZE}
                totalCount={totalCount}
                isLoading={isLoading}
                onPageChange={setPage}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
