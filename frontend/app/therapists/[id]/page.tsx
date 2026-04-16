"use client"

import Image from "next/image"
import { use, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ClinicDisplayMap } from "@/components/maps/clinic-display-map"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ChevronLeft, Calendar, Clock, Check, MapPin } from "lucide-react"
import { toast } from "sonner"
import { toTitleCaseSession } from "@/lib/api"
import { useAuth } from "@/components/providers/auth-provider"
import { appointmentService, feedbackService, packageService, therapistService } from "@/services"
import type { AvailabilitySlot, Feedback, Therapist, UserSubscription } from "@/lib/types"

export default function TherapistDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const { user } = useAuth()
  const [therapist, setTherapist] = useState<Therapist | null>(null)
  const [slots, setSlots] = useState<AvailabilitySlot[]>([])
  const [selectedSlot, setSelectedSlot] = useState<string>("")
  const [selectedSessionType, setSelectedSessionType] = useState<string>("video")
  const [feedbackEntries, setFeedbackEntries] = useState<Feedback[]>([])
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isBooking, setIsBooking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setIsLoading(true)
    Promise.all([
      therapistService.getPublicById(id),
      therapistService.listAvailability(id),
      feedbackService.list({ therapistId: id }, { auth: false }),
      user?.role === "user" ? packageService.listMySubscriptions() : Promise.resolve([]),
    ])
      .then(([therapistData, availabilityData, feedbackData, subscriptionData]) => {
        setTherapist(therapistData)
        setFeedbackEntries(feedbackData)
        setSubscriptions(subscriptionData)
        setSlots(
          availabilityData.filter(
            (slot) => slot.isAvailable && new Date(slot.startTime).getTime() > Date.now()
          )
        )
        setSelectedSessionType(therapistData.sessionTypes[0] || "video")
        setError(null)
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load therapist.")
      })
      .finally(() => setIsLoading(false))
  }, [id, user?.role])

  const activeSubscription = useMemo(
    () =>
      subscriptions.find(
        (subscription) =>
          subscription.status === "active" &&
          subscription.paymentStatus === "paid" &&
          subscription.remainingCredits > 0
      ) || null,
    [subscriptions]
  )
  const [bookingMode, setBookingMode] = useState<"single" | "package">("single")

  const groupedSlots = useMemo(() => {
    return slots.reduce<Record<string, AvailabilitySlot[]>>((accumulator, slot) => {
      const dateKey = new Date(slot.startTime).toDateString()
      accumulator[dateKey] = [...(accumulator[dateKey] || []), slot]
      return accumulator
    }, {})
  }, [slots])

  const averageRating = useMemo(() => {
    if (feedbackEntries.length === 0) return null
    const total = feedbackEntries.reduce((sum, entry) => sum + entry.rating, 0)
    return (total / feedbackEntries.length).toFixed(1)
  }, [feedbackEntries])

  const handleBook = async () => {
    if (!selectedSlot) {
      toast.error("Select an available slot first.")
      return
    }
    if (!user || user.role !== "user") {
      toast.error("Please sign in as a user to book an appointment.")
      return
    }

    setIsBooking(true)
    try {
      const appointment = await appointmentService.create({
        therapistId: id,
        availabilitySlotId: selectedSlot,
        sessionType: selectedSessionType,
        bookingPaymentType: bookingMode,
        subscriptionId: bookingMode === "package" ? activeSubscription?.id : undefined,
      })
      if (bookingMode === "package") {
        toast.success("Booked using subscription credits.")
        router.push("/dashboard/appointments")
      } else {
        toast.success("Proceed to payment. Your session will be confirmed automatically after verified payment.")
        router.push(`/dashboard/appointments/payment/${appointment.id}`)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Booking failed.")
    } finally {
      setIsBooking(false)
    }
  }

  if (isLoading) {
    return <div className="min-h-screen bg-background"><Navbar /><div className="py-16 text-center">Loading therapist...</div><Footer /></div>
  }

  if (!therapist || error) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center">
          <p className="text-destructive mb-4">{error || "Therapist not found."}</p>
          <Button asChild>
            <Link href="/therapists">Back to therapists</Link>
          </Button>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <Link href="/therapists" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6">
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back to therapists
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="p-6">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start">
                  <div className="relative h-28 w-28 overflow-hidden rounded-2xl border border-border bg-muted">
                    <Image
                      src={therapist.avatar || "/placeholder.svg"}
                      alt={therapist.user.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-foreground mb-2">{therapist.user.name}</h1>
                    <p className="text-muted-foreground">{therapist.title}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {therapist.specializations.map((item) => (
                    <Badge key={item} variant="secondary">{item}</Badge>
                  ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-muted-foreground">
                  <p>Experience: {therapist.experience} years</p>
                  <p>License: {therapist.licenseNumber || "Provided on request"}</p>
                  <p>Languages: {therapist.languages.join(", ") || "Not specified"}</p>
                  <p>Approval: {therapist.approvalStatus}</p>
                  <p>Personal clinic: {therapist.clinic ? "Available" : "Not provided"}</p>
                  <p>Average rating: {averageRating ? `${averageRating}/5` : "No ratings yet"}</p>
                  <p>Reviews: {feedbackEntries.length}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>About</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-7">
                  {therapist.bio || "This therapist has not added a bio yet. Review their qualifications and experience below."}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Qualifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {therapist.qualifications.length > 0 ? (
                  therapist.qualifications.map((item) => (
                    <div key={item} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" />
                      {item}
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground">No qualifications listed yet.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Feedback & Ratings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {feedbackEntries.length === 0 ? (
                  <p className="text-muted-foreground">No feedback has been published for this therapist yet.</p>
                ) : (
                  feedbackEntries.map((entry) => (
                    <div key={entry.id} className="rounded-lg border border-border p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-medium">{entry.userName || "Patient"}</p>
                        <p className="text-sm text-muted-foreground">{entry.rating}/5</p>
                      </div>
                      {entry.comment ? <p className="mt-2 text-sm text-muted-foreground">{entry.comment}</p> : null}
                      <p className="mt-2 text-xs text-muted-foreground">{new Date(entry.createdAt).toLocaleDateString()}</p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Personal Clinic</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {therapist.clinic ? (
                  <>
                    <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
                      <div className="space-y-3">
                        <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/30 p-4">
                          <MapPin className="mt-0.5 h-5 w-5 text-primary" />
                          <div>
                            <p className="font-medium">{therapist.clinic.clinicName}</p>
                            <p className="mt-1 text-sm text-muted-foreground">{therapist.clinic.clinicAddress}</p>
                          </div>
                        </div>
                        {therapist.clinic.phone ? (
                          <p className="text-sm text-muted-foreground">Phone: {therapist.clinic.phone}</p>
                        ) : null}
                        {therapist.clinic.openingHours ? (
                          <p className="text-sm text-muted-foreground">Opening hours: {therapist.clinic.openingHours}</p>
                        ) : null}
                        {therapist.clinic.notes ? (
                          <p className="text-sm text-muted-foreground">{therapist.clinic.notes}</p>
                        ) : null}
                      </div>
                      <div className="overflow-hidden rounded-xl border border-border">
                        <ClinicDisplayMap
                          latitude={therapist.clinic.latitude}
                          longitude={therapist.clinic.longitude}
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-muted-foreground">No personal clinic information provided.</p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Book a Session</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-2xl font-bold">NPR {therapist.pricePerSession.toLocaleString()}</p>

                <div className="space-y-2 rounded-xl border border-border bg-muted/30 p-4">
                  <label className="text-sm font-medium block">Booking method</label>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant={bookingMode === "single" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setBookingMode("single")}
                    >
                      Single Session
                    </Button>
                    <Button
                      type="button"
                      variant={bookingMode === "package" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setBookingMode("package")}
                      disabled={!activeSubscription}
                    >
                      Use Subscription Credits
                    </Button>
                  </div>
                  {activeSubscription ? (
                    <p className="text-sm text-muted-foreground">
                      Active subscription: {activeSubscription.plan.name} ({activeSubscription.remainingCredits} credits left)
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No active subscription found. You can still book this therapist with normal pay-per-session checkout.
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Session type</label>
                  <Select value={selectedSessionType} onValueChange={setSelectedSessionType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {therapist.sessionTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {toTitleCaseSession(type)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium block">Available slots</label>
                  <p className="text-sm text-muted-foreground">
                    This published slot is already committed by the therapist. Your session will be confirmed automatically after successful payment verification.
                  </p>
                  {Object.keys(groupedSlots).length === 0 ? (
                    <p className="text-sm text-muted-foreground">No open slots available right now.</p>
                  ) : (
                    Object.entries(groupedSlots).map(([date, items]) => (
                      <div key={date} className="rounded-lg border border-border p-3">
                        <div className="flex items-center gap-2 mb-3 text-sm font-medium">
                          <Calendar className="h-4 w-4 text-primary" />
                          {new Date(date).toLocaleDateString("en-US", {
                            weekday: "long",
                            month: "long",
                            day: "numeric",
                          })}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {items.map((slot) => {
                            const isSelected = selectedSlot === slot.id
                            return (
                              <Button
                                key={slot.id}
                                variant={isSelected ? "default" : "outline"}
                                size="sm"
                                onClick={() => setSelectedSlot(slot.id)}
                              >
                                <Clock className="mr-2 h-4 w-4" />
                                {new Date(slot.startTime).toLocaleTimeString([], {
                                  hour: "numeric",
                                  minute: "2-digit",
                                })}
                              </Button>
                            )
                          })}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <Button
                  className="w-full"
                  onClick={handleBook}
                  disabled={isBooking || !selectedSlot || (bookingMode === "package" && !activeSubscription)}
                >
                  {isBooking ? "Booking..." : bookingMode === "package" ? "Book with subscription" : "Continue to payment"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
