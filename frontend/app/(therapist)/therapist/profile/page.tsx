"use client"

import Image from "next/image"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { therapistService } from "@/services"
import type { Therapist } from "@/lib/types"

const EMPTY_PROFILE: Therapist = {
  id: "",
  userId: "",
  user: {
    id: "",
    email: "",
    name: "",
    role: "therapist",
    isVerified: false,
  },
  title: "",
  age: null,
  gender: "",
  bio: "",
  specializations: [],
  qualifications: [],
  experience: 0,
  languages: [],
  sessionTypes: ["video", "audio", "chat"],
  pricePerSession: 0,
  rating: 0,
  reviewCount: 0,
  isApproved: false,
  approvalStatus: "pending",
  licenseNumber: "",
}

export default function TherapistProfilePage() {
  const [profile, setProfile] = useState<Therapist>(EMPTY_PROFILE)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null)
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null)

  useEffect(() => {
    therapistService
      .getMyProfile()
      .then((data) => {
        setProfile(data)
        setError(null)
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Unable to load therapist profile.")
      })
      .finally(() => setIsLoading(false))
  }, [])

  useEffect(() => {
    return () => {
      if (profileImagePreview) {
        URL.revokeObjectURL(profileImagePreview)
      }
    }
  }, [profileImagePreview])

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null
    if (!file) {
      if (profileImagePreview) {
        URL.revokeObjectURL(profileImagePreview)
      }
      setProfileImageFile(null)
      setProfileImagePreview(null)
      return
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Profile image must be an image file.")
      event.target.value = ""
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Profile image must be 5 MB or smaller.")
      event.target.value = ""
      return
    }
    if (profileImagePreview) {
      URL.revokeObjectURL(profileImagePreview)
    }
    setProfileImageFile(file)
    setProfileImagePreview(URL.createObjectURL(file))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const updated = await therapistService.updateMyProfile({ ...profile, profileImageFile })
      setProfile(updated)
      setProfileImageFile(null)
      if (profileImagePreview) {
        URL.revokeObjectURL(profileImagePreview)
      }
      setProfileImagePreview(null)
      setError(null)
      toast.success("Therapist profile updated.")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to update therapist profile.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Professional Profile</h1>
          <p className="text-muted-foreground">
            Keep your public therapist details current. Approval status: {profile.approvalStatus}
          </p>
        </div>
        <Button onClick={handleSave} disabled={isSaving || isLoading}>
          {isSaving ? "Saving..." : "Save Profile"}
        </Button>
      </div>

      <Card>
        <CardHeader>
        <CardTitle>Profile Details</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {error ? <p className="md:col-span-2 text-sm text-destructive">{error}</p> : null}
        <div className="md:col-span-2">
          <Label>Profile Image</Label>
          <div className="mt-2 flex flex-col gap-4 rounded-lg border border-border p-4 sm:flex-row sm:items-center">
            <div className="relative h-24 w-24 overflow-hidden rounded-xl border border-border bg-muted">
              <Image
                src={profileImagePreview || profile.avatar || "/placeholder.svg"}
                alt={profile.user.name || "Therapist profile"}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
            <div className="flex-1 space-y-2">
              <Input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleImageChange}
                disabled={isLoading || isSaving}
              />
              <p className="text-xs text-muted-foreground">
                Upload a JPG, PNG, or WebP image up to 5 MB. This image appears on your public therapist profile after approval.
              </p>
            </div>
          </div>
        </div>
          <div>
            <Label>Age</Label>
            <Input
              type="number"
              min={1}
              max={120}
              value={profile.age ?? ""}
              onChange={(event) =>
                setProfile((current) => ({ ...current, age: event.target.value ? Number(event.target.value) : null }))
              }
              disabled={isLoading}
            />
          </div>
          <div>
            <Label>Gender</Label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={profile.gender || ""}
              onChange={(event) => setProfile((current) => ({ ...current, gender: event.target.value }))}
              disabled={isLoading}
            >
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="prefer_not_to_say">Prefer not to say</option>
            </select>
          </div>
          <div>
            <Label>Specialization</Label>
            <Input
              value={profile.specializations[0] || profile.title}
              onChange={(event) =>
                setProfile((current) => ({
                  ...current,
                  title: event.target.value,
                  specializations: event.target.value ? [event.target.value] : [],
                }))
              }
              disabled={isLoading}
            />
          </div>
          <div>
            <Label>Consultation Fee</Label>
            <Input
              type="number"
              min={0}
              value={profile.pricePerSession}
              onChange={(event) =>
                setProfile((current) => ({ ...current, pricePerSession: Number(event.target.value) || 0 }))
              }
              disabled={isLoading}
            />
          </div>
          <div>
            <Label>Experience (years)</Label>
            <Input
              type="number"
              min={0}
              value={profile.experience}
              onChange={(event) =>
                setProfile((current) => ({ ...current, experience: Number(event.target.value) || 0 }))
              }
              disabled={isLoading}
            />
          </div>
          <div>
            <Label>License Number</Label>
            <Input
              value={profile.licenseNumber || ""}
              onChange={(event) => setProfile((current) => ({ ...current, licenseNumber: event.target.value }))}
              disabled={isLoading}
            />
          </div>
          <div className="md:col-span-2">
            <Label>About / Bio</Label>
            <Textarea
              value={profile.bio}
              onChange={(event) => setProfile((current) => ({ ...current, bio: event.target.value }))}
              disabled={isLoading}
            />
          </div>
          <div className="md:col-span-2">
            <Label>Qualifications</Label>
            <Textarea
              value={profile.qualifications.join(", ")}
              onChange={(event) =>
                setProfile((current) => ({
                  ...current,
                  qualifications: event.target.value.split(",").map((item) => item.trim()).filter(Boolean),
                }))
              }
              disabled={isLoading}
            />
          </div>
          <div className="md:col-span-2">
            <Label>Languages</Label>
            <Textarea
              value={profile.languages.join(", ")}
              onChange={(event) =>
                setProfile((current) => ({
                  ...current,
                  languages: event.target.value.split(",").map((item) => item.trim()).filter(Boolean),
                }))
              }
              disabled={isLoading}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
