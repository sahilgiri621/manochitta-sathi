import { api } from "@/lib/api"
import type { KhaltiInitiation, KhaltiVerificationResult } from "@/lib/types"

export const paymentService = {
  initiateKhaltiPayment(appointmentId: string): Promise<KhaltiInitiation> {
    return api.initiateKhaltiPayment(appointmentId)
  },
  verifyKhaltiPayment(
    payload: { appointment?: string; pidx?: string },
    options?: { auth?: boolean }
  ): Promise<KhaltiVerificationResult> {
    return api.verifyKhaltiPayment(payload, options)
  },
}
