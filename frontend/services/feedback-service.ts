import { api } from "@/lib/api"
import type { Feedback } from "@/lib/types"

export const feedbackService = {
  list(filters?: { date?: string; therapistId?: string }, options?: { auth?: boolean }): Promise<Feedback[]> {
    return api.getFeedback(filters, options)
  },
  submit(appointment: string, rating: number, comment: string, serviceRating?: number | null): Promise<Feedback> {
    return api.submitFeedback(appointment, rating, comment, serviceRating)
  },
}
