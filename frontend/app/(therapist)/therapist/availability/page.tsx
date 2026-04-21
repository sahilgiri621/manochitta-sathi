"use client"

import { useEffect, useMemo, useState } from "react"
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, Pencil, Plus, Trash2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { therapistService } from "@/services"
import type { AvailabilitySlot } from "@/lib/types"

const DURATION_OPTIONS = [
  { value: "60", label: "1 hour" },
  { value: "90", label: "1.5 hours" },
  { value: "120", label: "2 hours" },
]
const SLOTS_PER_PAGE = 20

function toLocalDateParts(value: string) {
  const date = new Date(value)
  const offset = date.getTimezoneOffset()
  const localDate = new Date(date.getTime() - offset * 60_000)
  return {
    date: localDate.toISOString().slice(0, 10),
    time: localDate.toISOString().slice(11, 16),
  }
}

function buildIsoFromLocal(date: string, time: string) {
  return new Date(`${date}T${time}`).toISOString()
}

function formatDateHeading(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  })
}

function formatTimeRange(startTime: string, endTime: string) {
  const start = new Date(startTime)
  const end = new Date(endTime)
  return `${start.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} - ${end.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`
}

function getDurationMinutes(startTime: string, endTime: string) {
  return Math.round((new Date(endTime).getTime() - new Date(startTime).getTime()) / 60000)
}

export default function TherapistAvailabilityPage() {
  const [slots, setSlots] = useState<AvailabilitySlot[]>([])
  const [selectedDate, setSelectedDate] = useState("")
  const [startTime, setStartTime] = useState("")
  const [durationMinutes, setDurationMinutes] = useState("60")
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  const loadSlots = async () => {
    setIsLoading(true)
    try {
      setSlots(await therapistService.listAvailability())
      setCurrentPage(1)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load availability.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadSlots().catch(() => undefined)
  }, [])

  const today = useMemo(() => new Date().toISOString().slice(0, 10), [])

  const preview = useMemo(() => {
    if (!selectedDate || !startTime || !durationMinutes) return null
    const start = new Date(`${selectedDate}T${startTime}`)
    if (Number.isNaN(start.getTime())) return null
    const end = new Date(start.getTime() + Number(durationMinutes) * 60000)
    return { start, end }
  }, [durationMinutes, selectedDate, startTime])

  useEffect(() => {
    if (!preview) {
      setValidationError(null)
      return
    }

    const now = new Date()
    const duration = Number(durationMinutes)

    if (preview.start <= now) {
      setValidationError("Choose a future date and start time.")
      return
    }
    if (duration < 60) {
      setValidationError("Availability slots must be at least 1 hour long.")
      return
    }
    if (duration > 120) {
      setValidationError("Availability slots cannot be longer than 2 hours.")
      return
    }

    setValidationError(null)
  }, [durationMinutes, preview])

  const resetForm = () => {
    setEditingSlotId(null)
    setSelectedDate("")
    setStartTime("")
    setDurationMinutes("60")
    setValidationError(null)
  }

  const handleSubmit = async () => {
    if (!selectedDate || !startTime || !preview) {
      setValidationError("Select a date, start time, and duration.")
      return
    }
    if (validationError) {
      toast.error(validationError)
      return
    }

    setIsSaving(true)
    try {
      const startIso = buildIsoFromLocal(selectedDate, startTime)
      const endIso = preview.end.toISOString()

      if (editingSlotId) {
        await therapistService.updateAvailability(editingSlotId, startIso, endIso)
        toast.success("Availability slot updated.")
      } else {
        await therapistService.createAvailability(startIso, endIso)
        toast.success("Availability slot created.")
      }

      resetForm()
      await loadSlots()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to save slot.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleEdit = (slot: AvailabilitySlot) => {
    const start = toLocalDateParts(slot.startTime)
    setEditingSlotId(slot.id)
    setSelectedDate(start.date)
    setStartTime(start.time)
    setDurationMinutes(String(getDurationMinutes(slot.startTime, slot.endTime)))
    setValidationError(null)
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this availability slot?")) return
    try {
      await therapistService.deleteAvailability(id)
      if (editingSlotId === id) resetForm()
      toast.success("Availability slot deleted.")
      await loadSlots()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to delete slot.")
    }
  }

  const orderedSlots = useMemo(() => {
    return [...slots].sort((left, right) => new Date(left.startTime).getTime() - new Date(right.startTime).getTime())
  }, [slots])

  const totalPages = Math.max(1, Math.ceil(orderedSlots.length / SLOTS_PER_PAGE))

  const paginatedSlots = useMemo(() => {
    const startIndex = (currentPage - 1) * SLOTS_PER_PAGE
    return orderedSlots.slice(startIndex, startIndex + SLOTS_PER_PAGE)
  }, [currentPage, orderedSlots])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const startItem = slots.length === 0 ? 0 : (currentPage - 1) * SLOTS_PER_PAGE + 1
  const endItem = Math.min(currentPage * SLOTS_PER_PAGE, slots.length)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">Availability</h1>
        <p className="max-w-2xl text-muted-foreground">
          Set clear appointment windows for clients. Each slot must be between 1 and 2 hours, and only future times can be published.
        </p>
      </div>

      <Card className="border-amber-300 bg-amber-50">
        <CardContent className="p-5">
          <p className="font-medium text-amber-900">Availability is a commitment</p>
          <p className="mt-1 text-sm text-amber-800">
            Please ensure you are available for the selected date and time. By creating this slot, you agree that any successfully paid booking for it will be confirmed automatically.
          </p>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader className="border-b bg-muted/30">
          <CardTitle>{editingSlotId ? "Edit Availability Slot" : "Create Availability Slot"}</CardTitle>
          <CardDescription>
            Choose a date, start time, and one of the supported durations to publish a bookable session window that will auto-confirm after verified payment.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.1fr_1fr_1fr]">
            <div className="space-y-2">
              <Label htmlFor="availability-date">Date</Label>
              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="availability-date"
                  type="date"
                  min={today}
                  className="pl-10"
                  value={selectedDate}
                  onChange={(event) => setSelectedDate(event.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="availability-start">Start Time</Label>
              <div className="relative">
                <Clock3 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="availability-start"
                  type="time"
                  className="pl-10"
                  value={startTime}
                  onChange={(event) => setStartTime(event.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Duration</Label>
              <Select value={durationMinutes} onValueChange={setDurationMinutes}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  {DURATION_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-background/60 p-4">
            <p className="text-sm font-medium text-foreground">Slot preview</p>
            {preview ? (
              <p className="mt-2 text-sm text-muted-foreground">
                {preview.start.toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}{" "}
                | {preview.start.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} to{" "}
                {preview.end.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
              </p>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">Pick a date, start time, and duration to preview the slot.</p>
            )}
            <p className="mt-3 text-sm text-muted-foreground">
              Once a user books this slot and completes verified payment, the session is confirmed automatically and the slot becomes unavailable.
            </p>
            {validationError ? (
              <p className="mt-3 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {validationError}
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-3">
            <Button onClick={handleSubmit} disabled={isSaving || !selectedDate || !startTime || Boolean(validationError)}>
              <Plus className="mr-2 h-4 w-4" />
              {isSaving ? "Saving..." : editingSlotId ? "Update Slot" : "Add Slot"}
            </Button>
            {editingSlotId ? (
              <Button variant="outline" onClick={resetForm}>
                Cancel Edit
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader className="border-b bg-muted/30">
          <CardTitle>Current Slots</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {isLoading ? (
            <p className="text-muted-foreground">Loading availability...</p>
          ) : error ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</p>
          ) : slots.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center">
              <p className="font-medium text-foreground">No availability slots yet</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Add your first session window above so clients can begin booking with you.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {startItem}-{endItem} of {slots.length} slots
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                {paginatedSlots.map((slot) => {
                  const duration = getDurationMinutes(slot.startTime, slot.endTime)
                  return (
                    <div key={slot.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <CalendarDays className="h-4 w-4 text-primary" />
                            <span>{formatDateHeading(slot.startTime)}</span>
                          </div>
                          <p className="mt-3 font-medium text-foreground">{formatTimeRange(slot.startTime, slot.endTime)}</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {duration / 60} hour{duration === 60 ? "" : "s"}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            slot.isAvailable ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {slot.isAvailable ? "Open" : "Reserved"}
                        </span>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(slot)} disabled={!slot.isAvailable}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDelete(slot.id)} disabled={!slot.isAvailable}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                      {!slot.isAvailable ? (
                        <p className="mt-3 text-xs text-muted-foreground">
                          Reserved or booked slots cannot be edited or deleted.
                        </p>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
