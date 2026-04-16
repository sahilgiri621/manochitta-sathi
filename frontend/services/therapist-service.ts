import { api } from "@/lib/api"
import type { AvailabilitySlot, Therapist, TherapistClinic, TherapistFilters } from "@/lib/types"

export const therapistService = {
  apply(payload: {
    firstName: string
    lastName: string
    email: string
    phone?: string
    password: string
    age: number
    gender: string
    specialization: string
    qualifications?: string
    experienceYears?: number
    licenseNumber: string
    consultationFee?: number
    languages?: string
    bio?: string
    profileImageFile?: File | null
  }): Promise<Therapist> {
    return api.applyAsTherapist(payload)
  },
  listPublic(filters: TherapistFilters = {}): Promise<Therapist[]> {
    return api.listTherapists(filters, { auth: false })
  },
  listForAdmin(filters: TherapistFilters = {}): Promise<Therapist[]> {
    return api.listTherapists(filters, { auth: true })
  },
  getPublicById(id: string): Promise<Therapist> {
    return api.getTherapist(id)
  },
  getForAdmin(id: string): Promise<Therapist> {
    return api.getTherapist(id, { auth: true })
  },
  getMyProfile(): Promise<Therapist> {
    return api.getMyTherapistProfile()
  },
  updateMyProfile(payload: Partial<Therapist> & { profileImageFile?: File | null }): Promise<Therapist> {
    return api.updateMyTherapistProfile(payload)
  },
  getMyClinic(): Promise<TherapistClinic | null> {
    return api.getMyTherapistClinic()
  },
  saveMyClinic(payload: {
    clinicName: string
    clinicAddress: string
    latitude: number
    longitude: number
    phone?: string
    openingHours?: string
    notes?: string
  }): Promise<TherapistClinic> {
    return api.saveMyTherapistClinic(payload)
  },
  approve(id: string, approvalStatus: "approved" | "rejected"): Promise<Therapist> {
    return api.approveTherapist(id, approvalStatus)
  },
  listAvailability(therapistId?: string): Promise<AvailabilitySlot[]> {
    return api.getAvailability(therapistId)
  },
  createAvailability(startTime: string, endTime: string): Promise<AvailabilitySlot> {
    return api.createAvailability(startTime, endTime)
  },
  updateAvailability(id: string, startTime: string, endTime: string): Promise<AvailabilitySlot> {
    return api.updateAvailability(id, startTime, endTime)
  },
  deleteAvailability(id: string): Promise<void> {
    return api.deleteAvailability(id)
  },
}
