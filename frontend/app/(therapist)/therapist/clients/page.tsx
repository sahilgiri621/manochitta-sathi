"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { profileService } from "@/services"
import type { PatientProfile } from "@/lib/types"

function formatGender(value: string) {
  const labels: Record<string, string> = {
    male: "Male",
    female: "Female",
    other: "Other",
    prefer_not_to_say: "Prefer not to say",
  }
  return labels[value] || "Not provided"
}

function formatDate(value: string) {
  return value ? new Date(value).toLocaleString() : "No appointments yet"
}

export default function TherapistClientsPage() {
  const [patients, setPatients] = useState<PatientProfile[]>([])
  const [selectedPatientId, setSelectedPatientId] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    profileService
      .listAssignedPatients()
      .then((data) => {
        setPatients(data)
        setSelectedPatientId((current) => current || data[0]?.id || "")
        setError(null)
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Unable to load client profiles.")
      })
      .finally(() => setIsLoading(false))
  }, [])

  const selectedPatient = useMemo(
    () => patients.find((patient) => patient.id === selectedPatientId) || null,
    [patients, selectedPatientId],
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Clients</h1>
        <p className="text-muted-foreground">View profile details for patients assigned to you.</p>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <Card>
          <CardHeader>
            <CardTitle>Assigned Patients</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <p className="text-muted-foreground">Loading client profiles...</p>
            ) : patients.length === 0 ? (
              <p className="text-muted-foreground">No assigned patients yet.</p>
            ) : (
              patients.map((patient) => (
                <Button
                  key={patient.id}
                  type="button"
                  variant={patient.id === selectedPatientId ? "default" : "outline"}
                  className="h-auto w-full justify-start rounded-md p-4 text-left"
                  onClick={() => setSelectedPatientId(patient.id)}
                >
                  <span>
                    <span className="block font-medium">{patient.name || patient.email}</span>
                    <span className="block text-xs opacity-80">
                      {patient.appointmentCount} appointment{patient.appointmentCount === 1 ? "" : "s"}
                    </span>
                  </span>
                </Button>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Patient Profile</CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedPatient ? (
              <p className="text-muted-foreground">Select a patient to view their profile.</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{selectedPatient.name || "Not provided"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedPatient.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{selectedPatient.phone || "Not provided"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Age</p>
                  <p className="font-medium">{selectedPatient.age ?? "Not provided"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Gender</p>
                  <p className="font-medium">{formatGender(selectedPatient.gender)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Last appointment</p>
                  <p className="font-medium">{formatDate(selectedPatient.lastAppointmentAt)}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="font-medium">{selectedPatient.address || "Not provided"}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-muted-foreground">Wellbeing goals</p>
                  <p className="font-medium">{selectedPatient.wellbeingGoals || "Not provided"}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-muted-foreground">Bio</p>
                  <p className="font-medium">{selectedPatient.bio || "Not provided"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Emergency contact</p>
                  <p className="font-medium">{selectedPatient.emergencyContactName || "Not provided"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Emergency phone</p>
                  <p className="font-medium">{selectedPatient.emergencyContactPhone || "Not provided"}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
