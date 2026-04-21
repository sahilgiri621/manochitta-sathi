import { api } from "@/lib/api"
import type { Feedback, PaginatedResponse } from "@/lib/types"

export const feedbackService = {
  list(filters?: { date?: string; therapistId?: string; page?: number; pageSize?: number; search?: string }, options?: { auth?: boolean }): Promise<Feedback[]> {
    return api.getFeedback(filters, options)
  },
  listPage(filters?: { date?: string; therapistId?: string; page?: number; pageSize?: number; search?: string }, options?: { auth?: boolean }): Promise<PaginatedResponse<Feedback>> {
    return api.getFeedbackPage(filters, options)
  },
  submit(appointment: string, rating: number, comment: string, serviceRating?: number | null): Promise<Feedback> {
    return api.submitFeedback(appointment, rating, comment, serviceRating)
  },
}
