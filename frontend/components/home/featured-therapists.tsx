"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { therapistService } from "@/services"
import type { Therapist } from "@/lib/types"

export function FeaturedTherapists() {
  const [therapists, setTherapists] = useState<Therapist[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    therapistService
      .listPublic()
      .then((data) => {
        setTherapists(data.slice(0, 6))
        setError(null)
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Unable to load therapists right now.")
      })
      .finally(() => setIsLoading(false))
  }, [])

  if (isLoading) {
    return <p className="text-center text-muted-foreground">Loading featured therapists...</p>
  }

  if (error) {
    return (
      <div className="text-center">
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button asChild size="lg">
          <Link href="/therapists">Browse all therapists</Link>
        </Button>
      </div>
    )
  }

  if (therapists.length === 0) {
    return (
      <div className="text-center">
        <p className="text-muted-foreground mb-4">No therapists are available to preview yet.</p>
        <Button asChild size="lg">
          <Link href="/therapists">Browse all therapists</Link>
        </Button>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {therapists.map((therapist) => (
          <Link key={therapist.id} href={`/therapists/${therapist.id}`}>
            <div className="relative aspect-square rounded-xl overflow-hidden group">
              <Image
                src={therapist.avatar || "/placeholder.svg"}
                alt={therapist.user.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                <p className="text-sm font-medium truncate">{therapist.user.name}</p>
                <p className="text-xs opacity-80 truncate">{therapist.title}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="text-center">
        <Button asChild size="lg">
          <Link href="/therapists">Get matched to a therapist</Link>
        </Button>
      </div>
    </>
  )
}
