import Image from "next/image"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Star, Video, MessageSquare, Phone, ChevronRight } from "lucide-react"
import type { Therapist } from "@/lib/types"

interface TherapistCardProps {
  therapist: Therapist
  availableSlots?: string[]
}

export function TherapistCard({ therapist, availableSlots = [] }: TherapistCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Avatar */}
          <div className="relative w-20 h-20 md:w-24 md:h-24 flex-shrink-0">
            <Image
              src={therapist.avatar || "/placeholder.svg"}
              alt={therapist.user.name}
              fill
              className="object-cover rounded-lg"
            />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <Link
                  href={`/therapists/${therapist.id}`}
                  className="font-semibold text-foreground hover:text-primary transition-colors"
                >
                  {therapist.user.name}
                </Link>
                <p className="text-sm text-muted-foreground">{therapist.title}</p>
              </div>
              <div className="flex items-center gap-1 text-sm">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">{therapist.rating}</span>
                <span className="text-muted-foreground">({therapist.reviewCount})</span>
              </div>
            </div>

            {/* Specializations */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {therapist.specializations.slice(0, 3).map((spec) => (
                <Badge key={spec} variant="secondary" className="text-xs">
                  {spec}
                </Badge>
              ))}
            </div>

            {/* Qualifications */}
            <div className="flex flex-wrap gap-2 mt-2 text-xs text-primary">
              {therapist.qualifications.map((qual) => (
                <span key={qual} className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  {qual}
                </span>
              ))}
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                {therapist.experience}+ Years
              </span>
            </div>

            {/* Session Types */}
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              {therapist.sessionTypes.includes("video") && (
                <span className="flex items-center gap-1">
                  <Video className="w-3.5 h-3.5" /> Video
                </span>
              )}
              {therapist.sessionTypes.includes("chat") && (
                <span className="flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5" /> Chat
                </span>
              )}
              {therapist.sessionTypes.includes("audio") && (
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" /> Audio
                </span>
              )}
            </div>
          </div>

          {/* Price and Slots */}
          <div className="hidden md:flex flex-col items-end justify-between">
            <div className="text-right">
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold text-foreground">
                  NPR {therapist.pricePerSession.toLocaleString()}
                </span>
                {therapist.originalPrice && (
                  <span className="text-sm text-muted-foreground line-through">
                    NPR {therapist.originalPrice.toLocaleString()}
                  </span>
                )}
              </div>
              <span className="text-xs text-muted-foreground">per session</span>
            </div>

            {availableSlots.length > 0 && (
              <div className="flex flex-wrap gap-1 justify-end max-w-[200px]">
                {availableSlots.slice(0, 6).map((slot) => (
                  <Button
                    key={slot}
                    variant="outline"
                    size="sm"
                    className="text-xs h-7 px-2"
                  >
                    {slot}
                  </Button>
                ))}
                {availableSlots.length > 6 && (
                  <span className="text-xs text-primary">+{availableSlots.length - 6} more</span>
                )}
              </div>
            )}
          </div>

          {/* Mobile Arrow */}
          <div className="md:hidden flex items-center">
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </div>
        </div>

        {/* Mobile Price */}
        <div className="md:hidden flex items-center justify-between mt-4 pt-4 border-t border-border">
          <div>
            <span className="text-lg font-bold text-foreground">
              NPR {therapist.pricePerSession.toLocaleString()}
            </span>
            <span className="text-xs text-muted-foreground ml-1">per session</span>
          </div>
          <Button asChild size="sm">
            <Link href={`/therapists/${therapist.id}`}>Book Session</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
