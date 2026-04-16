"use client"

import { useEffect, useState } from "react"
import { MapPin, Navigation } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ClinicLocationPicker } from "@/components/maps/clinic-location-picker"
import { therapistService } from "@/services"
import { toast } from "sonner"
import type { TherapistClinic } from "@/lib/types"

type ClinicFormState = {
  clinicName: string
  clinicAddress: string
  latitude: number | null
  longitude: number | null
  phone: string
  openingHours: string
  notes: string
}

const EMPTY_FORM: ClinicFormState = {
  clinicName: "",
  clinicAddress: "",
  latitude: null,
  longitude: null,
  phone: "",
  openingHours: "",
  notes: "",
}

function toFormState(clinic: TherapistClinic | null): ClinicFormState {
  if (!clinic) return EMPTY_FORM
  return {
    clinicName: clinic.clinicName,
    clinicAddress: clinic.clinicAddress,
    latitude: clinic.latitude,
    longitude: clinic.longitude,
    phone: clinic.phone,
    openingHours: clinic.openingHours,
    notes: clinic.notes,
  }
}

export default function TherapistClinicPage() {
  const [form, setForm] = useState<ClinicFormState>(EMPTY_FORM)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    therapistService
      .getMyClinic()
      .then((clinic) => {
        setForm(toFormState(clinic))
        setError(null)
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Unable to load clinic information.")
      })
      .finally(() => setIsLoading(false))
  }, [])

  const handleSave = async () => {
    if (!form.clinicName.trim() || !form.clinicAddress.trim()) {
      toast.error("Clinic name and address are required.")
      return
    }
    if (form.latitude === null || form.longitude === null) {
      toast.error("Select the clinic location on the map.")
      return
    }

    setIsSaving(true)
    try {
      const clinic = await therapistService.saveMyClinic({
        clinicName: form.clinicName.trim(),
        clinicAddress: form.clinicAddress.trim(),
        latitude: form.latitude,
        longitude: form.longitude,
        phone: form.phone.trim(),
        openingHours: form.openingHours.trim(),
        notes: form.notes.trim(),
      })
      setForm(toFormState(clinic))
      setError(null)
      toast.success("Clinic information saved.")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to save clinic information.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Clinic Management</h1>
          <p className="text-muted-foreground">
            Add your personal clinic details if you also provide in-person care. This is optional and can be updated anytime.
          </p>
        </div>
        <Button onClick={handleSave} disabled={isSaving || isLoading}>
          {isSaving ? "Saving..." : "Save Clinic"}
        </Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Clinic Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            {isLoading ? <p className="text-sm text-muted-foreground">Loading clinic details...</p> : null}

            <div>
              <Label htmlFor="clinic-name">Clinic Name</Label>
              <Input
                id="clinic-name"
                value={form.clinicName}
                onChange={(event) => setForm((current) => ({ ...current, clinicName: event.target.value }))}
                disabled={isLoading}
              />
            </div>

            <div>
              <Label htmlFor="clinic-address">Clinic Address</Label>
              <Textarea
                id="clinic-address"
                value={form.clinicAddress}
                onChange={(event) => setForm((current) => ({ ...current, clinicAddress: event.target.value }))}
                disabled={isLoading}
              />
            </div>

            <div className="rounded-xl border border-dashed border-border bg-muted/20 p-4 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Location comes from the map</p>
              <p className="mt-1">
                Click on the map to place your clinic marker, or drag the marker to adjust it. You do not need to type latitude or longitude manually.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="clinic-phone">Phone</Label>
                <Input
                  id="clinic-phone"
                  value={form.phone}
                  onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                  disabled={isLoading}
                />
              </div>
              <div>
                <Label htmlFor="clinic-hours">Opening Hours</Label>
                <Input
                  id="clinic-hours"
                  value={form.openingHours}
                  onChange={(event) => setForm((current) => ({ ...current, openingHours: event.target.value }))}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="clinic-notes">Notes</Label>
              <Textarea
                id="clinic-notes"
                value={form.notes}
                onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                disabled={isLoading}
              />
            </div>

            <div className="rounded-xl border border-border bg-background/60 p-4">
              <p className="text-sm font-medium text-foreground">Map-selected coordinates</p>
              {form.latitude !== null && form.longitude !== null ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  {form.latitude.toFixed(6)}, {form.longitude.toFixed(6)}
                </p>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">No location selected yet.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Select Location</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="overflow-hidden rounded-xl border border-border">
              <ClinicLocationPicker
                value={
                  form.latitude !== null && form.longitude !== null
                    ? { latitude: form.latitude, longitude: form.longitude }
                    : null
                }
                onChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    latitude: value.latitude,
                    longitude: value.longitude,
                  }))
                }
              />
            </div>
            <div className="rounded-xl border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 text-primary" />
                <p>Click anywhere on the map to place your clinic marker, then drag the marker if you need to adjust it.</p>
              </div>
              <div className="mt-3 flex items-start gap-3">
                <Navigation className="mt-0.5 h-4 w-4 text-primary" />
                <p>The saved coordinates are shown in the form and will appear on your public therapist profile.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
