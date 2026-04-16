"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { packageService } from "@/services"
import type { UserSubscription } from "@/lib/types"

export function PackagePaymentResult() {
  const searchParams = useSearchParams()
  const subscriptionId = searchParams.get("subscription") || ""
  const pidx = searchParams.get("pidx") || ""
  const [subscription, setSubscription] = useState<UserSubscription | null>(null)
  const [message, setMessage] = useState("Verifying your package payment...")

  useEffect(() => {
    packageService
      .verifyPayment({ subscription: subscriptionId || undefined, pidx: pidx || undefined }, { auth: false })
      .then((result) => {
        setSubscription(result.subscription || null)
        if (result.paymentStatus === "paid" && result.subscriptionStatus === "active") {
          setMessage("Package activated successfully.")
          return
        }
        setMessage(`Package payment status: ${result.paymentStatus}.`)
      })
      .catch((error) => {
        setMessage(error instanceof Error ? error.message : "Unable to verify package payment.")
      })
  }, [subscriptionId, pidx])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Package Payment Result</h1>
        <p className="text-muted-foreground">{message}</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Package Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {subscription ? (
            <>
              <p className="font-medium">{subscription.plan.name}</p>
              <p className="text-sm text-muted-foreground">
                Credits: {subscription.remainingCredits} / {subscription.totalCredits}
              </p>
              <p className="text-sm text-muted-foreground capitalize">Status: {subscription.status}</p>
            </>
          ) : null}
          <div className="flex gap-2">
            <Button asChild>
              <Link href="/services">Back to services</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/therapists">Browse therapists</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
