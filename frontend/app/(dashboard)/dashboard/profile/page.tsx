"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { useAuth } from "@/components/providers/auth-provider"
import { profileService } from "@/services"
import type { Profile } from "@/lib/types"

const EMPTY_PROFILE: Profile = {
  id: "",
  age: null,
  gender: "",
  wellbeingGoals: "",
  bio: "",
  address: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
  createdAt: "",
  updatedAt: "",
}

export default function ProfilePage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile>(EMPTY_PROFILE)
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    profileService
      .getMyProfile()
      .then((data) => {
        setProfile(data)
        setError(null)
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Unable to load profile.")
      })
      .finally(() => setIsLoading(false))
  }, [])

  const fullName = useMemo(() => user?.name || "", [user])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const updated = await profileService.updateMyProfile(profile)
      setProfile(updated)
      setIsEditing(false)
      toast.success("Profile updated successfully.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Profile update failed.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Profile</h1>
          <p className="text-muted-foreground">Keep your personal and emergency contact details current.</p>
        </div>
        {isEditing ? (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={isSaving}>{isSaving ? "Saving..." : "Save"}</Button>
          </div>
        ) : (
          <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Full name</Label>
            <Input value={fullName} disabled />
          </div>
          <div>
            <Label>Email</Label>
            <Input value={user?.email || ""} disabled />
          </div>
          <div>
            <Label>Phone</Label>
            <Input value={user?.phone || ""} disabled />
          </div>
          <div>
            <Label>Role</Label>
            <Input value={user?.role || ""} disabled />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Profile Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {error ? <p className="md:col-span-2 text-sm text-destructive">{error}</p> : null}
          <div>
            <Label>Age</Label>
            <Input
              type="number"
              value={profile.age ?? ""}
              onChange={(event) => setProfile((current) => ({ ...current, age: Number(event.target.value) || null }))}
              disabled={!isEditing || isLoading}
            />
          </div>
          <div>
            <Label>Gender</Label>
            <Input
              value={profile.gender}
              onChange={(event) => setProfile((current) => ({ ...current, gender: event.target.value }))}
              disabled={!isEditing || isLoading}
            />
          </div>
          <div className="md:col-span-2">
            <Label>Address</Label>
            <Input
              value={profile.address}
              onChange={(event) => setProfile((current) => ({ ...current, address: event.target.value }))}
              disabled={!isEditing || isLoading}
            />
          </div>
          <div className="md:col-span-2">
            <Label>Wellbeing goals</Label>
            <Textarea
              value={profile.wellbeingGoals}
              onChange={(event) => setProfile((current) => ({ ...current, wellbeingGoals: event.target.value }))}
              disabled={!isEditing || isLoading}
            />
          </div>
          <div className="md:col-span-2">
            <Label>Bio</Label>
            <Textarea
              value={profile.bio}
              onChange={(event) => setProfile((current) => ({ ...current, bio: event.target.value }))}
              disabled={!isEditing || isLoading}
            />
          </div>
          <div>
            <Label>Emergency contact name</Label>
            <Input
              value={profile.emergencyContactName}
              onChange={(event) =>
                setProfile((current) => ({ ...current, emergencyContactName: event.target.value }))
              }
              disabled={!isEditing || isLoading}
            />
          </div>
          <div>
            <Label>Emergency contact phone</Label>
            <Input
              value={profile.emergencyContactPhone}
              onChange={(event) =>
                setProfile((current) => ({ ...current, emergencyContactPhone: event.target.value }))
              }
              disabled={!isEditing || isLoading}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
