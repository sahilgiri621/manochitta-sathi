import { Suspense } from "react"
import { KhaltiPaymentResult } from "@/components/payments/khalti-payment-result"

export default function PublicKhaltiPaymentResultPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-3xl space-y-4"><h1 className="text-2xl font-bold">Khalti Payment Result</h1><p className="text-muted-foreground">Loading payment result...</p></div>}>
      <KhaltiPaymentResult />
    </Suspense>
  )
}
