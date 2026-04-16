"use client"

import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { useAuth } from "@/components/providers/auth-provider"
import { therapistService } from "@/services"

export default function ForTherapistsPage() {
  const MAX_IMAGE_SIZE = 5 * 1024 * 1024
  const router = useRouter()
  const { login } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null)
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    age: "",
    gender: "",
    specialization: "",
    qualifications: "",
    experience: "",
    licenseNumber: "",
    consultationFee: "",
    languages: "",
    bio: "",
  })

  useEffect(() => {
    return () => {
      if (profileImagePreview) {
        URL.revokeObjectURL(profileImagePreview)
      }
    }
  }, [profileImagePreview])

  const handleChange =
    (field: keyof typeof formData) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFormData((current) => ({ ...current, [field]: event.target.value }))
    }

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
      toast.error("Profile image must be a JPG, PNG, or WebP image.")
      event.target.value = ""
      return
    }
    if (file.size > MAX_IMAGE_SIZE) {
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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    const trimmedName = formData.fullName.trim()
    const trimmedEmail = formData.email.trim()

    if (!trimmedName) {
      toast.error("Full name is required")
      return
    }
    if (!trimmedEmail) {
      toast.error("Email is required")
      return
    }
    if (!formData.specialization.trim()) {
      toast.error("Specialization is required")
      return
    }
    if (!(Number(formData.age) > 0)) {
      toast.error("Age is required")
      return
    }
    if (!formData.gender) {
      toast.error("Gender is required")
      return
    }
    if (!formData.licenseNumber.trim()) {
      toast.error("License number is required")
      return
    }
    if (formData.password.length < 8) {
      toast.error("Password must be at least 8 characters")
      return
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match")
      return
    }

    setIsSubmitting(true)

    try {
      const nameParts = trimmedName.split(/\s+/).filter(Boolean)

      await therapistService.apply({
        firstName: nameParts.slice(0, -1).join(" ") || nameParts[0] || "",
        lastName: nameParts.length > 1 ? nameParts[nameParts.length - 1] : "",
        email: trimmedEmail,
        phone: formData.phone.trim(),
        password: formData.password,
        age: Number(formData.age),
        gender: formData.gender,
        specialization: formData.specialization.trim(),
        qualifications: formData.qualifications.trim(),
        experienceYears: Number(formData.experience) || 0,
        licenseNumber: formData.licenseNumber.trim(),
        consultationFee: Number(formData.consultationFee) || 0,
        languages: formData.languages.trim(),
        bio: formData.bio.trim(),
        profileImageFile,
      })

      await login({
        email: trimmedEmail,
        password: formData.password,
      })

      toast.success("Therapist application submitted. Your profile is pending admin approval.")
      router.push("/therapist")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to submit therapist application.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-10">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="space-y-3 text-center">
            <h1 className="text-4xl font-bold text-foreground">Apply as a Therapist</h1>
            <p className="text-muted-foreground">
              Create your therapist account, submit your professional details, and we&apos;ll place your profile in
              admin review.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Therapist Application</CardTitle>
              <CardDescription>
                After submitting, you&apos;ll be able to sign in to the therapist portal while your application remains
                pending approval.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input id="fullName" value={formData.fullName} onChange={handleChange("fullName")} required />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="profileImage">Profile Image</Label>
                  <Input
                    id="profileImage"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleImageChange}
                  />
                  <p className="mt-2 text-xs text-muted-foreground">
                    Upload a clear professional headshot. JPG, PNG, or WebP up to 5 MB.
                  </p>
                  {profileImagePreview ? (
                    <div className="mt-3 flex items-center gap-4 rounded-lg border border-border p-3">
                      <div className="relative h-20 w-20 overflow-hidden rounded-lg">
                        <Image src={profileImagePreview} alt="Therapist profile preview" fill className="object-cover" unoptimized />
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <p className="font-medium text-foreground">{profileImageFile?.name}</p>
                        <p>Preview of the image that will appear on your therapist profile after approval.</p>
                      </div>
                    </div>
                  ) : null}
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={formData.email} onChange={handleChange("email")} required />
                </div>

                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" value={formData.phone} onChange={handleChange("phone")} placeholder="Optional" />
                </div>

                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange("password")}
                    minLength={8}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleChange("confirmPassword")}
                    minLength={8}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="age">Age</Label>
                  <Input id="age" type="number" min={1} max={120} value={formData.age} onChange={handleChange("age")} required />
                </div>

                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <select
                    id="gender"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={formData.gender}
                    onChange={(event) => setFormData((current) => ({ ...current, gender: event.target.value }))}
                    required
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="specialization">Specialization</Label>
                  <Input
                    id="specialization"
                    value={formData.specialization}
                    onChange={handleChange("specialization")}
                    placeholder="Clinical Psychologist"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="licenseNumber">License Number</Label>
                  <Input
                    id="licenseNumber"
                    value={formData.licenseNumber}
                    onChange={handleChange("licenseNumber")}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="experience">Experience (years)</Label>
                  <Input
                    id="experience"
                    type="number"
                    min={0}
                    value={formData.experience}
                    onChange={handleChange("experience")}
                  />
                </div>

                <div>
                  <Label htmlFor="consultationFee">Consultation Fee (NPR)</Label>
                  <Input
                    id="consultationFee"
                    type="number"
                    min={0}
                    value={formData.consultationFee}
                    onChange={handleChange("consultationFee")}
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="bio">About</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={handleChange("bio")}
                    placeholder="Briefly describe your background, approach, and the kind of support you provide."
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="qualifications">Qualifications</Label>
                  <Textarea
                    id="qualifications"
                    value={formData.qualifications}
                    onChange={handleChange("qualifications")}
                    placeholder="Comma separated, e.g. PhD, NMC Licensed"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="languages">Languages</Label>
                  <Textarea
                    id="languages"
                    value={formData.languages}
                    onChange={handleChange("languages")}
                    placeholder="Comma separated, e.g. English, Nepali, Hindi"
                  />
                </div>

                <div className="md:col-span-2 flex flex-col sm:flex-row gap-3 pt-2">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Submitting..." : "Submit Therapist Application"}
                  </Button>
                  <Button type="button" variant="outline" asChild>
                    <Link href="/login">Already have an account? Sign in</Link>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  )
}
