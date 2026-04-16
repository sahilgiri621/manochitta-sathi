"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { therapistService } from "@/services"
import type { Therapist } from "@/lib/types"

export default function AdminTherapistDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [therapist, setTherapist] = useState<Therapist | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [imageLoadFailed, setImageLoadFailed] = useState(false)

  const loadTherapist = async () => {
    setIsLoading(true)
    try {
      const data = await therapistService.getForAdmin(params.id)
      setTherapist(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load therapist details.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadTherapist().catch(() => undefined)
  }, [params.id])

  useEffect(() => {
    setImageLoadFailed(false)
  }, [therapist?.profileImage, therapist?.avatar])

  const reviewTherapist = async (status: "approved" | "rejected") => {
    if (!therapist) return
    try {
      const updated = await therapistService.approve(therapist.id, status)
      setTherapist(updated)
      toast.success(`Therapist ${status}.`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to update therapist status.")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground mb-1">
            <Link href="/admin/therapists" className="hover:text-foreground">Therapists</Link> / Review
          </p>
          <h1 className="text-2xl font-bold">Therapist Review</h1>
        </div>
        <Button variant="outline" onClick={() => router.push("/admin/therapists")}>
          Back to list
        </Button>
      </div>

      {isLoading ? <p className="text-muted-foreground">Loading therapist details...</p> : null}
      {error ? <p className="text-destructive">{error}</p> : null}

      {therapist ? (
        <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <div className="relative h-28 w-28 overflow-hidden rounded-2xl border border-border bg-muted">
                  {therapist.profileImage && !imageLoadFailed ? (
                    <Image
                      src={therapist.profileImage}
                      alt={`${therapist.user.name} profile`}
                      fill
                      className="object-cover"
                      unoptimized
                      onError={() => setImageLoadFailed(true)}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-center text-sm text-muted-foreground">
                      No image
                      <br />
                      uploaded
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <CardTitle>{therapist.user.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{therapist.user.email}</p>
                  <p className="text-sm text-muted-foreground capitalize">Status: {therapist.approvalStatus}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p>{therapist.user.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Specialization</p>
                <p>{therapist.title || therapist.specializations[0] || "Not provided"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">About</p>
                <p>{therapist.bio || "Not provided"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Qualifications</p>
                <p>{therapist.qualifications.join(", ") || "Not provided"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Languages</p>
                <p>{therapist.languages.join(", ") || "Not provided"}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Age</p>
                  <p>{therapist.age ?? "Not provided"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Gender</p>
                  <p>{therapist.gender || "Not provided"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Experience</p>
                  <p>{therapist.experience} years</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Consultation Fee</p>
                  <p>NPR {therapist.pricePerSession.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">License Number</p>
                  <p>{therapist.licenseNumber || "Not provided"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Decision</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Current status</p>
                <p className="font-medium capitalize">{therapist.approvalStatus}</p>
              </div>
              <Button className="w-full" onClick={() => reviewTherapist("approved")}>
                Approve Therapist
              </Button>
              <Button variant="outline" className="w-full" onClick={() => reviewTherapist("rejected")}>
                Reject Therapist
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  )
}
