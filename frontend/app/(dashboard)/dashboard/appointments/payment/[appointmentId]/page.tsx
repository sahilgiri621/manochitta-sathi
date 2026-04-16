"use client"

import Link from "next/link"
import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AlertCircle, CalendarDays, CreditCard, Clock, ShieldCheck } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { appointmentService, paymentService, therapistService } from "@/services"
import { toTitleCaseSession } from "@/lib/api"
import type { Appointment, Therapist } from "@/lib/types"

export default function AppointmentPaymentPage({
  params,
}: {
  params: Promise<{ appointmentId: string }>
}) {
  const { appointmentId } = use(params)
  const router = useRouter()
  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [therapist, setTherapist] = useState<Therapist | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isPaying, setIsPaying] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [paymentError, setPaymentError] = useState<string | null>(null)

  useEffect(() => {
    setIsLoading(true)
    appointmentService
      .getById(appointmentId)
      .then(async (appointmentData) => {
        setAppointment(appointmentData)
        const therapistData = await therapistService.getPublicById(appointmentData.therapistId)
        setTherapist(therapistData)
        setLoadError(null)
        setPaymentError(null)
      })
      .catch((loadError) => {
        setLoadError(loadError instanceof Error ? loadError.message : "Unable to load booking payment details.")
      })
      .finally(() => setIsLoading(false))
  }, [appointmentId])

  const handleConfirmPayment = async () => {
    if (!appointment) {
      return
    }

    setIsPaying(true)
    setPaymentError(null)
    try {
      const result = await paymentService.initiateKhaltiPayment(appointment.id)
      if (!result.paymentUrl) {
        throw new Error("Payment initiation failed: backend did not return a Khalti payment URL.")
      }
      if (process.env.NODE_ENV !== "production") {
        console.info("Redirecting to Khalti payment page.", {
          appointmentId: appointment.id,
          pidx: result.pidx,
          paymentUrl: result.paymentUrl,
        })
      }
      window.location.assign(result.paymentUrl)
    } catch (paymentError) {
      if (process.env.NODE_ENV !== "production") {
        console.error("Payment initiation failed.", { appointmentId: appointment.id, paymentError })
      }
      setPaymentError(paymentError instanceof Error ? paymentError.message : "Payment initiation failed.")
    } finally {
      setIsPaying(false)
    }
  }

  if (isLoading) {
    return <div className="space-y-4"><h1 className="text-2xl font-bold">Payment</h1><p className="text-muted-foreground">Loading booking summary...</p></div>
  }

  if (!appointment || !therapist || loadError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Payment</h1>
          <p className="text-muted-foreground">Review your booking before continuing.</p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <div className="space-y-2">
              <p className="font-medium text-destructive">{loadError || "Booking not found."}</p>
              <p className="text-sm text-muted-foreground">
                We could not prepare the payment page for this booking.
              </p>
            </div>
            <Button asChild>
              <Link href="/dashboard/appointments">Back to appointments</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const canInitiatePayment =
    ["pending_payment", "pending"].includes(appointment.status) &&
    ["unpaid", "pending", "failed", "cancelled", "expired"].includes(appointment.paymentStatus)

  const amount = therapist.pricePerSession

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Complete Your Payment</h1>
          <p className="text-muted-foreground">
            Review the session details, then continue securely to Khalti. Successful verified payment will confirm the booking automatically.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/dashboard/appointments">Back to appointments</Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Booking Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-xl border border-border bg-muted/30 p-4">
              <p className="text-sm text-muted-foreground">Therapist</p>
              <p className="mt-1 text-lg font-semibold">{appointment.therapistName}</p>
              <p className="text-sm text-muted-foreground">{therapist.title}</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-border p-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <CalendarDays className="h-4 w-4 text-primary" />
                  Session date
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {new Date(appointment.scheduledStart).toLocaleDateString()}
                </p>
              </div>
              <div className="rounded-xl border border-border p-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Clock className="h-4 w-4 text-primary" />
                  Session time
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {new Date(appointment.scheduledStart).toLocaleTimeString([], {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                  {" - "}
                  {new Date(appointment.scheduledEnd).toLocaleTimeString([], {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-border p-4">
                <p className="text-sm font-medium">Session type</p>
                <p className="mt-2 text-sm text-muted-foreground">{toTitleCaseSession(appointment.sessionType)}</p>
              </div>
              <div className="rounded-xl border border-border p-4">
                <p className="text-sm font-medium">Booking status</p>
                <p className="mt-2 text-sm text-muted-foreground capitalize">{appointment.status.replaceAll("_", " ")}</p>
              </div>
            </div>

            <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
              No payment means no confirmed booking. Once Khalti payment is verified, this slot is confirmed automatically and removed from availability.
            </div>

            {paymentError ? (
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                {paymentError}
              </div>
            ) : null}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment Method</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border border-primary/40 bg-primary/5 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-primary/10 p-2 text-primary">
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">Pay with Khalti</p>
                      <p className="text-sm text-muted-foreground">Secure online payment for this booking.</p>
                    </div>
                  </div>
                  <Badge>Selected</Badge>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <p className="text-sm text-muted-foreground">Price</p>
                <p className="mt-1 text-3xl font-bold">NPR {amount.toLocaleString()}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  The backend confirms your session only after Khalti verifies the transaction server-side.
                </p>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-border p-4 text-sm text-muted-foreground">
                <ShieldCheck className="mt-0.5 h-4 w-4 text-primary" />
                Therapist-published slots are pre-committed. Your appointment is confirmed automatically once the backend verifies the payment result from Khalti.
              </div>

              <Button className="w-full" onClick={handleConfirmPayment} disabled={!canInitiatePayment || isPaying}>
                {isPaying ? "Redirecting to Khalti..." : appointment.paymentStatus === "pending" ? "Continue to Khalti" : "Confirm Booking and Pay"}
              </Button>

              {!canInitiatePayment ? (
                <p className="text-sm text-muted-foreground">
                  This booking is currently marked as <span className="capitalize">{appointment.paymentStatus}</span> and cannot start a new payment from here.
                </p>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Need to review later?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>You can come back to this page anytime from your appointments dashboard before paying.</p>
              <Button variant="outline" className="w-full" onClick={() => router.push("/dashboard/appointments")}>
                Return to appointments
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
