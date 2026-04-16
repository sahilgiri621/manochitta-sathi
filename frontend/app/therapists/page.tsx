"use client"

import { useEffect, useMemo, useState } from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { TherapistCard } from "@/components/therapist-card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, X } from "lucide-react"
import { therapistService } from "@/services"
import type { SessionType, Therapist } from "@/lib/types"

const sessionTypeOptions: { value: SessionType; label: string }[] = [
  { value: "chat", label: "Chat" },
  { value: "audio", label: "Audio" },
  { value: "video", label: "Video" },
]

const experienceOptions = ["Any", "0-5 years", "5-15 years", "15+ years"]

export default function TherapistsPage() {
  const [therapists, setTherapists] = useState<Therapist[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSpecialization, setSelectedSpecialization] = useState("all")
  const [selectedExperience, setSelectedExperience] = useState("Any")
  const [selectedSessionTypes, setSelectedSessionTypes] = useState<SessionType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setIsLoading(true)
    therapistService
      .listPublic()
      .then((data) => {
        setTherapists(data)
        setError(null)
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load therapists.")
      })
      .finally(() => setIsLoading(false))
  }, [])

  const specializationOptions = useMemo(() => {
    return [
      "all",
      ...Array.from(
        new Set(
          therapists
            .flatMap((therapist) => therapist.specializations)
            .filter(Boolean)
        )
      ),
    ]
  }, [therapists])

  const filteredTherapists = useMemo(() => {
    return therapists.filter((therapist) => {
      const query = searchQuery.trim().toLowerCase()
      if (query) {
        const matchesQuery =
          therapist.user.name.toLowerCase().includes(query) ||
          therapist.specializations.some((item) => item.toLowerCase().includes(query)) ||
          therapist.languages.some((item) => item.toLowerCase().includes(query))
        if (!matchesQuery) return false
      }

      if (selectedSpecialization !== "all" && !therapist.specializations.includes(selectedSpecialization)) {
        return false
      }

      if (selectedExperience === "0-5 years" && therapist.experience > 5) return false
      if (selectedExperience === "5-15 years" && (therapist.experience < 5 || therapist.experience > 15)) {
        return false
      }
      if (selectedExperience === "15+ years" && therapist.experience < 15) return false

      if (
        selectedSessionTypes.length > 0 &&
        !selectedSessionTypes.some((sessionType) => therapist.sessionTypes.includes(sessionType))
      ) {
        return false
      }

      return true
    })
  }, [searchQuery, selectedSpecialization, selectedExperience, selectedSessionTypes, therapists])

  const clearFilters = () => {
    setSearchQuery("")
    setSelectedSpecialization("all")
    setSelectedExperience("Any")
    setSelectedSessionTypes([])
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Find a Therapist</h1>
          <p className="text-muted-foreground">
            Browse approved therapists and book sessions with real availability.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 md:p-6 mb-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search by therapist name, specialization, or language"
              className="pl-10"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {specializationOptions.map((option) => (
              <Button
                key={option}
                variant={selectedSpecialization === option ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedSpecialization(option)}
              >
                {option === "all" ? "All specialties" : option}
              </Button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {experienceOptions.map((option) => (
              <Button
                key={option}
                variant={selectedExperience === option ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedExperience(option)}
              >
                {option}
              </Button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {sessionTypeOptions.map((option) => {
              const selected = selectedSessionTypes.includes(option.value)
              return (
                <Button
                  key={option.value}
                  variant={selected ? "default" : "outline"}
                  size="sm"
                  onClick={() =>
                    setSelectedSessionTypes((current) =>
                      selected
                        ? current.filter((item) => item !== option.value)
                        : [...current, option.value]
                    )
                  }
                >
                  {option.label}
                </Button>
              )
            })}

            {(searchQuery || selectedSpecialization !== "all" || selectedExperience !== "Any" || selectedSessionTypes.length > 0) && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="mr-2 h-4 w-4" />
                Clear filters
              </Button>
            )}
          </div>
        </div>

        <div className="mb-4 flex items-center justify-between">
          <Badge variant="secondary">{filteredTherapists.length} therapists</Badge>
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-muted-foreground">Loading therapists...</div>
        ) : error ? (
          <div className="py-16 text-center">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </div>
        ) : filteredTherapists.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-muted-foreground">
              {therapists.length === 0
                ? "No approved therapists are available yet. Therapist applications must be approved before they appear here."
                : "No therapists match the current filters."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTherapists.map((therapist) => (
              <TherapistCard key={therapist.id} therapist={therapist} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
