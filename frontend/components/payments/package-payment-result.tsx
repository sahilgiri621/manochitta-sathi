"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { AlertCircle, CheckCircle2, Clock3, PackageCheck, XCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { packageService } from "@/services"
import type { UserSubscription } from "@/lib/types"

type VerificationState = "verifying" | "success" | "pending" | "failed"

function getStatusTone(state: VerificationState) {
  if (state === "success") return "text-green-700"
  if (state === "pending") return "text-amber-700"
  if (state === "failed") return "text-destructive"
  return "text-muted-foreground"
}

function getStatusIcon(state: VerificationState) {
  if (state === "success") return <CheckCircle2 className="h-8 w-8 text-green-700" />
  if (state === "pending") return <Clock3 className="h-8 w-8 text-amber-700" />
  if (state === "failed") return <XCircle className="h-8 w-8 text-destructive" />
  return <PackageCheck className="h-8 w-8 text-primary" />
}

export function PackagePaymentResult() {
  const searchParams = useSearchParams()
  const subscriptionId = searchParams.get("subscription") || ""
  const pidx = searchParams.get("pidx") || ""
  const [subscription, setSubscription] = useState<UserSubscription | null>(null)
  const [message, setMessage] = useState("Verifying your package payment...")
  const [state, setState] = useState<VerificationState>("verifying")

  useEffect(() => {
    packageService
      .verifyPayment({ subscription: subscriptionId || undefined, pidx: pidx || undefined }, { auth: false })
      .then((result) => {
        setSubscription(result.subscription || null)
        if (result.paymentStatus === "paid" && result.subscriptionStatus === "active") {
          setState("success")
          setMessage("Package activated successfully.")
          return
        }
        if (result.paymentStatus === "pending") {
          setState("pending")
          setMessage("Khalti returned a pending package payment. We are still waiting for final confirmation.")
          return
        }
        setState("failed")
        setMessage(`Package payment status: ${result.paymentStatus}.`)
      })
      .catch((error) => {
        setState("failed")
        setMessage(error instanceof Error ? error.message : "Unable to verify package payment.")
      })
  }, [subscriptionId, pidx])

  const summaryRows = useMemo(
    () =>
      [
        subscription?.plan.name ? ["Plan", subscription.plan.name] : null,
        subscription ? ["Credits", `${subscription.remainingCredits} / ${subscription.totalCredits}`] : null,
        subscription?.status ? ["Subscription status", subscription.status.replaceAll("_", " ")] : null,
        subscription?.paymentStatus ? ["Payment status", subscription.paymentStatus] : null,
        subscription?.expiresAt
          ? ["Valid until", new Date(subscription.expiresAt).toLocaleString()]
          : null,
        pidx || subscription?.khaltiPidx
          ? ["Khalti PIDX", pidx || subscription?.khaltiPidx || ""]
          : null,
        subscription?.paymentTransactionId
          ? ["Transaction ID", subscription.paymentTransactionId]
          : null,
      ].filter(Boolean) as [string, string][],
    [subscription, pidx]
  )

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Package Payment Result</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Package Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            {getStatusIcon(state)}
            <div className="space-y-2">
              <p className={`font-medium ${getStatusTone(state)}`}>{message}</p>
              {state === "failed" && !subscription ? (
                <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                  <AlertCircle className="mt-0.5 h-4 w-4" />
                  <span>We could not match this return to an activated package purchase yet.</span>
                </div>
              ) : null}
            </div>
          </div>

          {summaryRows.length > 0 ? (
            <div className="grid gap-3 rounded-xl border border-border p-4 text-sm text-muted-foreground md:grid-cols-2">
              {summaryRows.map(([label, value]) => (
                <div key={label}>
                  <p className="font-medium text-foreground">{label}</p>
                  <p className="capitalize">{value}</p>
                </div>
              ))}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/services">Back to services</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/therapists">Browse therapists</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href="/dashboard">Go to dashboard</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
