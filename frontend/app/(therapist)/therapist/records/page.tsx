"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { appointmentService, patientRecordService } from "@/services"
import type { Appointment, PatientRecord } from "@/lib/types"

function getUniquePatientAppointments(appointments: Appointment[]) {
  const seen = new Set<string>()
  return appointments.filter((appointment) => {
    if (seen.has(appointment.userId)) return false
    seen.add(appointment.userId)
    return true
  })
}

export default function TherapistRecordsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [records, setRecords] = useState<PatientRecord[]>([])
  const [selectedPatient, setSelectedPatient] = useState("")
  const [selectedAppointment, setSelectedAppointment] = useState("")
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null)
  const [notes, setNotes] = useState("")
  const [diagnosisNotes, setDiagnosisNotes] = useState("")
  const [recommendations, setRecommendations] = useState("")
  const [sessionSummary, setSessionSummary] = useState("")
  const [patientProgress, setPatientProgress] = useState("")
  const [nextSteps, setNextSteps] = useState("")
  const [riskFlag, setRiskFlag] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [appointmentData, recordData] = await Promise.all([
        appointmentService.list(),
        patientRecordService.list(),
      ])
      setAppointments(appointmentData)
      setRecords(recordData)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load patient records.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData().catch(() => undefined)
  }, [])

  const patientOptions = useMemo(() => getUniquePatientAppointments(appointments), [appointments])
  const filteredAppointments = useMemo(
    () => appointments.filter((appointment) => appointment.userId === selectedPatient),
    [appointments, selectedPatient]
  )
  const filteredRecords = useMemo(
    () => (selectedPatient ? records.filter((record) => record.patient === selectedPatient) : records),
    [records, selectedPatient]
  )

  const resetForm = () => {
    setEditingRecordId(null)
    setSelectedAppointment("")
    setNotes("")
    setDiagnosisNotes("")
    setRecommendations("")
    setSessionSummary("")
    setPatientProgress("")
    setNextSteps("")
    setRiskFlag("")
  }

  const handleEdit = (record: PatientRecord) => {
    setEditingRecordId(record.id)
    setSelectedPatient(record.patient)
    setSelectedAppointment(record.appointment || "")
    setNotes(record.notes)
    setDiagnosisNotes(record.diagnosisNotes)
    setRecommendations(record.recommendations)
    setSessionSummary(record.sessionSummary)
    setPatientProgress(record.patientProgress)
    setNextSteps(record.nextSteps)
    setRiskFlag(record.riskFlag)
  }

  const handleSubmit = async () => {
    if (!selectedPatient || !notes.trim()) {
      toast.error("Select a patient and add session notes.")
      return
    }

    setIsSaving(true)
    try {
      const payload = {
        patient: selectedPatient,
        appointment: selectedAppointment || undefined,
        notes: notes.trim(),
        diagnosisNotes: diagnosisNotes.trim(),
        recommendations: recommendations.trim(),
        sessionSummary: sessionSummary.trim(),
        patientProgress: patientProgress.trim(),
        nextSteps: nextSteps.trim(),
        riskFlag: riskFlag.trim(),
      }

      if (editingRecordId) {
        await patientRecordService.update(editingRecordId, payload)
        toast.success("Patient record updated.")
      } else {
        await patientRecordService.create(payload)
        toast.success("Patient record saved.")
      }

      resetForm()
      await loadData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to save patient record.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Patient Records</h1>
        <p className="text-muted-foreground">Create and update therapy notes for patients assigned to you.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>{editingRecordId ? "Update Record" : "New Record"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            {isLoading ? <p className="text-sm text-muted-foreground">Loading patients...</p> : null}

            <div>
              <Label htmlFor="patient-record-patient">Patient</Label>
              <select
                id="patient-record-patient"
                className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={selectedPatient}
                onChange={(event) => {
                  setSelectedPatient(event.target.value)
                  setSelectedAppointment("")
                }}
              >
                <option value="">Select a patient</option>
                {patientOptions.map((appointment) => (
                  <option key={appointment.userId} value={appointment.userId}>
                    {appointment.userName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="patient-record-appointment">Related Appointment</Label>
              <select
                id="patient-record-appointment"
                className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={selectedAppointment}
                onChange={(event) => setSelectedAppointment(event.target.value)}
              >
                <option value="">No specific appointment</option>
                {filteredAppointments.map((appointment) => (
                  <option key={appointment.id} value={appointment.id}>
                    {new Date(appointment.scheduledStart).toLocaleString()} | {appointment.status}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="patient-record-notes">Notes / Observations</Label>
              <Textarea id="patient-record-notes" value={notes} onChange={(event) => setNotes(event.target.value)} />
            </div>

            <div>
              <Label htmlFor="patient-record-summary">Session Summary</Label>
              <Textarea id="patient-record-summary" value={sessionSummary} onChange={(event) => setSessionSummary(event.target.value)} />
            </div>

            <div>
              <Label htmlFor="patient-record-diagnosis">Diagnosis Notes</Label>
              <Textarea id="patient-record-diagnosis" value={diagnosisNotes} onChange={(event) => setDiagnosisNotes(event.target.value)} />
            </div>

            <div>
              <Label htmlFor="patient-record-progress">Patient Progress / Condition</Label>
              <Textarea id="patient-record-progress" value={patientProgress} onChange={(event) => setPatientProgress(event.target.value)} />
            </div>

            <div>
              <Label htmlFor="patient-record-recommendations">Recommendations</Label>
              <Textarea id="patient-record-recommendations" value={recommendations} onChange={(event) => setRecommendations(event.target.value)} />
            </div>

            <div>
              <Label htmlFor="patient-record-next-steps">Next Steps</Label>
              <Textarea id="patient-record-next-steps" value={nextSteps} onChange={(event) => setNextSteps(event.target.value)} />
            </div>

            <div>
              <Label htmlFor="patient-record-risk-flag">Risk / Flag</Label>
              <Input id="patient-record-risk-flag" value={riskFlag} onChange={(event) => setRiskFlag(event.target.value)} />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSubmit} disabled={isSaving}>
                {isSaving ? "Saving..." : editingRecordId ? "Update Record" : "Save Record"}
              </Button>
              <Button variant="outline" onClick={resetForm} disabled={isSaving}>
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Existing Records</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <p className="text-muted-foreground">Loading records...</p>
            ) : filteredRecords.length === 0 ? (
              <p className="text-muted-foreground">No records found for the current selection.</p>
            ) : (
              filteredRecords.map((record) => (
                <div key={record.id} className="rounded-lg border border-border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{record.patientName}</p>
                      <p className="text-sm text-muted-foreground">
                        {record.appointmentScheduledStart ? new Date(record.appointmentScheduledStart).toLocaleString() : new Date(record.updatedAt).toLocaleString()}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleEdit(record)}>
                      Edit
                    </Button>
                  </div>
                  <p className="mt-3 text-sm">{record.notes}</p>
                  {record.sessionSummary ? <p className="mt-2 text-sm text-muted-foreground">Summary: {record.sessionSummary}</p> : null}
                  {record.patientProgress ? <p className="mt-2 text-sm text-muted-foreground">Progress: {record.patientProgress}</p> : null}
                  {record.nextSteps ? <p className="mt-2 text-sm text-muted-foreground">Next steps: {record.nextSteps}</p> : null}
                  {record.riskFlag ? <p className="mt-2 text-sm text-muted-foreground">Risk / flag: {record.riskFlag}</p> : null}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
