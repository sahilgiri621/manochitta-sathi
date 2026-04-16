import { api } from "@/lib/api"
import type { PatientRecord } from "@/lib/types"

export const patientRecordService = {
  list(filters?: { patientId?: string }): Promise<PatientRecord[]> {
    return api.getPatientRecords(filters)
  },
  create(payload: {
    patient: string
    appointment?: string
    notes: string
    diagnosisNotes?: string
    recommendations?: string
    sessionSummary?: string
    patientProgress?: string
    nextSteps?: string
    riskFlag?: string
  }): Promise<PatientRecord> {
    return api.createPatientRecord(payload)
  },
  update(
    id: string,
    payload: {
      patient?: string
      appointment?: string
      notes?: string
      diagnosisNotes?: string
      recommendations?: string
      sessionSummary?: string
      patientProgress?: string
      nextSteps?: string
      riskFlag?: string
    }
  ): Promise<PatientRecord> {
    return api.updatePatientRecord(id, payload)
  },
}
