"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AdminPagination } from "@/components/admin/admin-pagination"
import { adminService } from "@/services"
import type { AdminRevenueReport } from "@/lib/types"

const PAGE_SIZE = 10

const emptyReport: AdminRevenueReport = {
  count: 0,
  next: null,
  previous: null,
  results: [],
  summary: {
    completedSessions: 0,
    grossRevenue: 0,
    therapistRevenue: 0,
    platformRevenue: 0,
  },
  therapistTotals: [],
}

function formatCurrency(value: number) {
  return `NPR ${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
}

export default function AdminRevenuePage() {
  const [report, setReport] = useState<AdminRevenueReport>(emptyReport)
  const [search, setSearch] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [page, setPage] = useState(1)
  const [therapistTotalsPage, setTherapistTotalsPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setPage(1)
    setTherapistTotalsPage(1)
  }, [search, dateFrom, dateTo])

  useEffect(() => {
    let isMounted = true

    const loadReport = async () => {
      setIsLoading(true)
      try {
        const data = await adminService.getRevenueReport({
          search: search.trim() || undefined,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
          page,
          pageSize: PAGE_SIZE,
        })
        if (!isMounted) return
        setReport(data)
        setError(null)
      } catch (err) {
        if (!isMounted) return
        setError(err instanceof Error ? err.message : "Unable to load revenue report.")
        setReport(emptyReport)
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    loadReport().catch(() => undefined)
    return () => {
      isMounted = false
    }
  }, [search, dateFrom, dateTo, page])

  const therapistTotalsStart = (therapistTotalsPage - 1) * PAGE_SIZE
  const paginatedTherapistTotals = report.therapistTotals.slice(
    therapistTotalsStart,
    therapistTotalsStart + PAGE_SIZE,
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Revenue</h1>
        <p className="text-muted-foreground">
          Review completed-session revenue by therapist and the platform share.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_180px_180px_auto] md:items-end">
            <div className="space-y-2">
              <Label htmlFor="revenue-search">Therapist Name</Label>
              <Input
                id="revenue-search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by therapist name or email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="revenue-date-from">From</Label>
              <Input
                id="revenue-date-from"
                type="date"
                value={dateFrom}
                onChange={(event) => setDateFrom(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="revenue-date-to">To</Label>
              <Input
                id="revenue-date-to"
                type="date"
                value={dateTo}
                onChange={(event) => setDateTo(event.target.value)}
              />
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setSearch("")
                setDateFrom("")
                setDateTo("")
              }}
              disabled={!search && !dateFrom && !dateTo}
            >
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Completed sessions</p>
            <p className="mt-2 text-3xl font-bold">{report.summary.completedSessions}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Gross revenue</p>
            <p className="mt-2 text-3xl font-bold">{formatCurrency(report.summary.grossRevenue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Therapist earnings</p>
            <p className="mt-2 text-3xl font-bold">{formatCurrency(report.summary.therapistRevenue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Platform revenue</p>
            <p className="mt-2 text-3xl font-bold">{formatCurrency(report.summary.platformRevenue)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Therapist</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? <p className="text-muted-foreground">Loading therapist totals...</p> : null}
            {error ? <p className="text-destructive">{error}</p> : null}
            {!isLoading && !error && report.therapistTotals.length === 0 ? (
              <p className="text-muted-foreground">No therapist totals found for the selected filters.</p>
            ) : null}
            {!isLoading && !error
              ? paginatedTherapistTotals.map((item) => (
                  <div key={item.therapistId} className="rounded-lg border border-border p-4">
                    <div className="flex flex-col gap-4">
                      <div className="space-y-1">
                        <p className="font-medium">{item.therapistName}</p>
                        <p className="text-sm text-muted-foreground">{item.therapistEmail}</p>
                        <p className="text-sm text-muted-foreground">
                          Completed sessions: {item.completedSessions}
                        </p>
                      </div>
                      <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-3">
                        <span>Gross revenue: {formatCurrency(item.grossRevenue)}</span>
                        <span>Therapist earnings: {formatCurrency(item.therapistRevenue)}</span>
                        <span>Platform revenue: {formatCurrency(item.platformRevenue)}</span>
                      </div>
                    </div>
                  </div>
                ))
              : null}
            {!isLoading && !error ? (
              <AdminPagination
                page={therapistTotalsPage}
                pageSize={PAGE_SIZE}
                totalCount={report.therapistTotals.length}
                isLoading={isLoading}
                onPageChange={setTherapistTotalsPage}
              />
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue Records</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? <p className="text-muted-foreground">Loading revenue report...</p> : null}
            {error ? <p className="text-destructive">{error}</p> : null}
            {!isLoading && !error && report.results.length === 0 ? (
              <p className="text-muted-foreground">No revenue records found for the selected filters.</p>
            ) : null}
            {!isLoading && !error
              ? report.results.map((item) => (
                  <div key={item.id} className="rounded-lg border border-border p-4">
                    <div className="flex flex-col gap-4">
                      <div className="space-y-1">
                        <p className="font-medium">{item.therapistName}</p>
                        <p className="text-sm text-muted-foreground">{item.therapistEmail}</p>
                        <p className="text-sm text-muted-foreground">Client: {item.userName}</p>
                        <p className="text-sm text-muted-foreground">
                          Session date: {new Date(item.scheduledStart).toLocaleString()}
                        </p>
                        <p className="text-sm text-muted-foreground capitalize">
                          Type: {item.sessionType.replaceAll("_", " ")}
                        </p>
                        {item.tierUsed ? (
                          <p className="text-sm text-muted-foreground">Tier used: {item.tierUsed}</p>
                        ) : null}
                      </div>
                      <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                        <span>Session price: {formatCurrency(item.sessionPrice)}</span>
                        <span>
                          Commission: {item.commissionRateUsed !== null ? `${(item.commissionRateUsed * 100).toFixed(0)}%` : "N/A"}
                        </span>
                        <span>Therapist earning: {formatCurrency(item.therapistEarning)}</span>
                        <span>Platform revenue: {formatCurrency(item.platformCommission)}</span>
                        <span className="capitalize">Payment: {item.paymentProvider || "N/A"}</span>
                        <span>Transaction: {item.paymentTransactionId || "N/A"}</span>
                      </div>
                    </div>
                  </div>
                ))
              : null}
            {!isLoading && !error ? (
              <AdminPagination
                page={page}
                pageSize={PAGE_SIZE}
                totalCount={report.count}
                isLoading={isLoading}
                onPageChange={setPage}
              />
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
