import { Suspense } from "react"
import { PackagePaymentResult } from "@/components/payments/package-payment-result"

export default function ServicesPackagePaymentResultPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <h1 className="text-2xl font-bold">Package Payment Result</h1>
          <p className="text-muted-foreground">Loading payment result...</p>
        </div>
      }
    >
      <PackagePaymentResult />
    </Suspense>
  )
}
