"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { AlertCircle, CheckCircle2, Clock3, ReceiptText, XCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { paymentService } from "@/services"
import type { Appointment } from "@/lib/types"

type VerificationState = "verifying" | "success" | "pending" | "failed"

function getKhaltiStatusTone(state: VerificationState) {
  if (state === "success") return "text-green-700"
  if (state === "pending") return "text-amber-700"
  if (state === "failed") return "text-destructive"
  return "text-muted-foreground"
}

function getStatusIcon(state: VerificationState) {
  if (state === "success") return <CheckCircle2 className="h-8 w-8 text-green-700" />
  if (state === "pending") return <Clock3 className="h-8 w-8 text-amber-700" />
  if (state === "failed") return <XCircle className="h-8 w-8 text-destructive" />
  return <ReceiptText className="h-8 w-8 text-primary" />
}

export function KhaltiPaymentResult() {
  const searchParams = useSearchParams()
  const appointmentId = searchParams.get("appointment") || ""
  const pidx = searchParams.get("pidx") || ""
  const khaltiStatus = searchParams.get("status") || ""
  const transactionId = searchParams.get("transaction_id") || searchParams.get("txnId") || ""
  const totalAmount = searchParams.get("amount") || searchParams.get("total_amount") || ""

  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [message, setMessage] = useState("Verifying your Khalti payment...")
  const [state, setState] = useState<VerificationState>("verifying")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!appointmentId && !pidx) {
      setMessage("Missing Khalti payment reference.")
      setState("failed")
      setIsLoading(false)
      return
    }

    const requiresAuthenticatedFallback = Boolean(appointmentId && !pidx)

    paymentService
      .verifyKhaltiPayment(
        { appointment: appointmentId || undefined, pidx: pidx || undefined },
        { auth: requiresAuthenticatedFallback }
      )
      .then((result) => {
        setAppointment(result.appointment || null)
        if (result.paymentStatus === "paid") {
          setState("success")
          setMessage("Payment successful. Your session is confirmed.")
        } else if (result.paymentStatus === "pending") {
          setState("pending")
          setMessage("Khalti returned a pending payment. We are still waiting for final confirmation.")
        } else {
          setState("failed")
          setMessage(`Payment verification failed. Current status: ${result.paymentStatus}.`)
        }
      })
      .catch((error) => {
        setState("failed")
        setMessage(error instanceof Error ? error.message : "Unable to verify Khalti payment.")
      })
      .finally(() => setIsLoading(false))
  }, [appointmentId, pidx])

  const summaryRows = useMemo(
    () =>
      [
        appointment?.therapistName ? ["Therapist", appointment.therapistName] : null,
        appointment?.scheduledStart ? ["Scheduled", new Date(appointment.scheduledStart).toLocaleString()] : null,
        appointment?.paymentStatus ? ["Payment status", appointment.paymentStatus] : null,
        appointment?.status ? ["Booking status", appointment.status.replaceAll("_", " ")] : null,
        transactionId || appointment?.paymentTransactionId ? ["Transaction ID", transactionId || appointment?.paymentTransactionId || ""] : null,
        pidx || appointment?.khaltiPidx ? ["Khalti PIDX", pidx || appointment?.khaltiPidx || ""] : null,
        khaltiStatus ? ["Khalti return status", khaltiStatus] : null,
        totalAmount ? ["Returned amount", totalAmount] : null,
      ].filter(Boolean) as [string, string][],
    [appointment, transactionId, pidx, khaltiStatus, totalAmount]
  )

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Khalti Payment Result</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Verification Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            {getStatusIcon(state)}
            <div className="space-y-2">
              <p className={`font-medium ${getKhaltiStatusTone(state)}`}>{message}</p>
              {state === "failed" && !appointment ? (
                <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                  <AlertCircle className="mt-0.5 h-4 w-4" />
                  <span>The app did not treat the redirect alone as success. Verification must complete first.</span>
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
              <Link href="/dashboard/appointments">{isLoading ? "Back to Appointments" : "Go to Appointments"}</Link>
            </Button>
            {appointment && appointment.paymentStatus !== "paid" ? (
              <Button variant="outline" asChild>
                <Link href={`/dashboard/appointments/payment/${appointment.id}`}>Retry payment</Link>
              </Button>
            ) : null}
            <Button variant="ghost" asChild>
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
