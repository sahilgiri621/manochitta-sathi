"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { therapistService } from "@/services"
import type { Therapist } from "@/lib/types"

export function FeaturedTherapists() {
  const [therapists, setTherapists] = useState<Therapist[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)
  const viewportRef = useRef<HTMLDivElement | null>(null)

  const updateScrollState = useCallback(() => {
    const viewport = viewportRef.current
    if (!viewport) return
    const maxScrollLeft = viewport.scrollWidth - viewport.clientWidth
    setCanScrollPrev(viewport.scrollLeft > 8)
    setCanScrollNext(viewport.scrollLeft < maxScrollLeft - 8)
  }, [])

  useEffect(() => {
    therapistService
      .listPublic({ pageSize: 20 })
      .then((data) => {
        setTherapists(data)
        setError(null)
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Unable to load therapists right now.")
      })
      .finally(() => setIsLoading(false))
  }, [])

  useEffect(() => {
    updateScrollState()
    const handleResize = () => updateScrollState()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [therapists, updateScrollState])

  const scrollCarousel = (direction: "prev" | "next") => {
    const viewport = viewportRef.current
    if (!viewport) return
    const distance = Math.max(260, Math.floor(viewport.clientWidth * 0.85))
    viewport.scrollBy({
      left: direction === "next" ? distance : -distance,
      behavior: "smooth",
    })
  }

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
      <div className="mb-8 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            Browse {therapists.length} approved therapist{therapists.length === 1 ? "" : "s"}
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Previous therapists"
              disabled={!canScrollPrev}
              onClick={() => scrollCarousel("prev")}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Next therapists"
              disabled={!canScrollNext}
              onClick={() => scrollCarousel("next")}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div
          ref={viewportRef}
          onScroll={updateScrollState}
          className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label="Featured therapist carousel"
        >
          {therapists.map((therapist) => (
            <Link
              key={therapist.id}
              href={`/therapists/${therapist.id}`}
              className="group relative block aspect-square min-w-0 flex-[0_0_78%] snap-start overflow-hidden rounded-xl outline-none transition-shadow hover:shadow-lg focus-visible:ring-2 focus-visible:ring-primary/60 sm:flex-[0_0_46%] md:flex-[0_0_31%] lg:flex-[0_0_23%] xl:flex-[0_0_15.5%]"
            >
              <Image
                src={therapist.avatar || "/placeholder.svg"}
                alt={therapist.user.name}
                fill
                sizes="(max-width: 640px) 78vw, (max-width: 768px) 46vw, (max-width: 1024px) 31vw, (max-width: 1280px) 23vw, 16vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                <p className="truncate text-sm font-medium">{therapist.user.name}</p>
                <p className="truncate text-xs opacity-85">{therapist.title}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="text-center">
        <Button asChild size="lg">
          <Link href="/therapists">Get matched to a therapist</Link>
        </Button>
      </div>
    </>
  )
}
