import { api } from "@/lib/api";
import type { Appointment, PaginatedResponse } from "@/lib/types";

export const appointmentService = {
  list(filters?: {
    date?: string;
    pageSize?: number;
    allPages?: boolean;
  }): Promise<Appointment[]> {
    return api.getAppointments(filters);
  },
  listPage(filters?: {
    date?: string;
    status?: string;
    page?: number;
    pageSize?: number;
    search?: string;
  }): Promise<PaginatedResponse<Appointment>> {
    return api.getAppointmentsPage(filters);
  },
  getById(id: string): Promise<Appointment> {
    return api.getAppointment(id);
  },
  create(payload: {
    therapistId: string;
    availabilitySlotId: string;
    sessionType: string;
    notes?: string;
    bookingPaymentType?: "single" | "package";
    subscriptionId?: string;
  }): Promise<Appointment> {
    return api.createAppointment(payload);
  },
  cancel(id: string, reason?: string): Promise<Appointment> {
    return api.cancelAppointment(id, reason);
  },
  accept(id: string, note?: string): Promise<Appointment> {
    return api.acceptAppointment(id, note);
  },
  reject(id: string, note?: string): Promise<Appointment> {
    return api.rejectAppointment(id, note);
  },
  complete(
    id: string,
    payload: {
      notes: string;
      sessionSummary: string;
      patientProgress: string;
      recommendations: string;
      nextSteps: string;
      riskFlag?: string;
      diagnosisNotes?: string;
    },
  ): Promise<Appointment> {
    return api.completeAppointment(id, payload);
  },
  confirmAttendance(
    id: string,
    attended: boolean,
    note?: string,
  ): Promise<Appointment> {
    return api.confirmAppointmentAttendance(id, attended, note);
  },
};
