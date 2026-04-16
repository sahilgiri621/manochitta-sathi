import { api } from "@/lib/api"
import type { PackagePlan, PackagePlanInput, PackagePurchaseInitiation, PackageVerificationResult, UserSubscription } from "@/lib/types"

export const packageService = {
  listPlans(options?: { auth?: boolean }): Promise<PackagePlan[]> {
    return api.getPackagePlans(options)
  },
  listMySubscriptions(): Promise<UserSubscription[]> {
    return api.getMySubscriptions()
  },
  createPlan(payload: PackagePlanInput): Promise<PackagePlan> {
    return api.createPackagePlan(payload)
  },
  updatePlan(id: string, payload: Partial<PackagePlanInput>): Promise<PackagePlan> {
    return api.updatePackagePlan(id, payload)
  },
  deletePlan(id: string): Promise<void> {
    return api.deletePackagePlan(id)
  },
  purchasePlan(planId: string): Promise<PackagePurchaseInitiation> {
    return api.purchasePackagePlan(planId)
  },
  verifyPayment(
    payload: { subscription?: string; pidx?: string },
    options?: { auth?: boolean }
  ): Promise<PackageVerificationResult> {
    return api.verifyPackagePayment(payload, options)
  },
}
