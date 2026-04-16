"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { patientRecordService } from "@/services"
import type { PatientRecord } from "@/lib/types"

export default function PatientRecordsPage() {
  const [records, setRecords] = useState<PatientRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    patientRecordService
      .list()
      .then((data) => {
        setRecords(data)
        setError(null)
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Unable to load your records.")
      })
      .finally(() => setIsLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Records</h1>
        <p className="text-muted-foreground">Review therapy notes and recommendations shared by your therapist.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Session Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <p className="text-muted-foreground">Loading your records...</p>
          ) : error ? (
            <p className="text-destructive">{error}</p>
          ) : records.length === 0 ? (
            <p className="text-muted-foreground">No therapy records are available yet.</p>
          ) : (
            records.map((record) => (
              <div key={record.id} className="rounded-lg border border-border p-4">
                <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-medium">{record.therapistName}</p>
                    <p className="text-sm text-muted-foreground">
                      {record.appointmentScheduledStart ? new Date(record.appointmentScheduledStart).toLocaleString() : new Date(record.updatedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="mt-4 space-y-3 text-sm">
                  <div>
                    <p className="font-medium text-foreground">Notes</p>
                    <p className="text-muted-foreground">{record.notes}</p>
                  </div>
                  {record.sessionSummary ? (
                    <div>
                      <p className="font-medium text-foreground">Session Summary</p>
                      <p className="text-muted-foreground">{record.sessionSummary}</p>
                    </div>
                  ) : null}
                  {record.diagnosisNotes ? (
                    <div>
                      <p className="font-medium text-foreground">Diagnosis Notes</p>
                      <p className="text-muted-foreground">{record.diagnosisNotes}</p>
                    </div>
                  ) : null}
                  {record.recommendations ? (
                    <div>
                      <p className="font-medium text-foreground">Recommendations</p>
                      <p className="text-muted-foreground">{record.recommendations}</p>
                    </div>
                  ) : null}
                  {record.patientProgress ? (
                    <div>
                      <p className="font-medium text-foreground">Patient Progress / Condition</p>
                      <p className="text-muted-foreground">{record.patientProgress}</p>
                    </div>
                  ) : null}
                  {record.nextSteps ? (
                    <div>
                      <p className="font-medium text-foreground">Next Steps</p>
                      <p className="text-muted-foreground">{record.nextSteps}</p>
                    </div>
                  ) : null}
                  {record.riskFlag ? (
                    <div>
                      <p className="font-medium text-foreground">Risk / Flag</p>
                      <p className="text-muted-foreground">{record.riskFlag}</p>
                    </div>
                  ) : null}
                  {record.completedAt ? (
                    <div>
                      <p className="font-medium text-foreground">Completed At</p>
                      <p className="text-muted-foreground">{new Date(record.completedAt).toLocaleString()}</p>
                    </div>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
