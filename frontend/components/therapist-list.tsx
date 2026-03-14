"use client"

import Image from "next/image"
import { Star, Video, MessageCircle, Phone, Award } from "lucide-react"

interface TherapistListProps {
  searchQuery: string
  selectedDate: Date | null
}

const therapists = [
  {
    id: 1,
    name: "Dr. Rajesh Karki",
    title: "Clinical Psychologist",
    specialties: ["Anxiety & Depression", "Trauma & PTSD", "Stress Management"],
    badges: ["PhD", "NMC Licensed", "10+ Years"],
    price: 2500,
    originalPrice: 3000,
    rating: 4.9,
    reviews: 234,
    image: "/images/doctors/doctor-1.png",
    availableSlots: ["9:00", "9:30", "10:00", "10:30", "14:00", "14:30", "15:00", "15:30", "16:00"],
    sessionTypes: ["video", "chat", "audio"],
  },
  {
    id: 2,
    name: "Dr. Anjali Shrestha",
    title: "Licensed Therapist, LMFT",
    specialties: ["Relationships", "Family Issues", "Couples Therapy"],
    badges: ["LMFT", "Certified", "15+ Years"],
    price: 2000,
    originalPrice: null,
    rating: 4.8,
    reviews: 189,
    image: "/images/doctors/doctor-2.png",
    availableSlots: ["11:00", "11:30", "13:00", "13:30"],
    sessionTypes: ["video", "audio"],
  },
  {
    id: 3,
    name: "Dr. Sita Gurung",
    title: "Psychiatrist, MD",
    specialties: ["Addiction", "Anxiety & Depression", "Medication Management"],
    badges: ["MD", "Board Certified", "8+ Years"],
    price: 3500,
    originalPrice: 4000,
    rating: 4.9,
    reviews: 312,
    image: "/images/doctors/doctor-3.jpg",
    availableSlots: ["8:00", "8:30", "9:00", "12:00", "12:30"],
    sessionTypes: ["video"],
  },
  {
    id: 4,
    name: "Dr. Bikash Thapa",
    title: "Clinical Psychologist",
    specialties: ["Grief & Loss", "Self-Esteem", "Life Transitions"],
    badges: ["PsyD", "Licensed", "12+ Years"],
    price: 1800,
    originalPrice: null,
    rating: 4.7,
    reviews: 156,
    image: "/images/doctors/doctor-4.png",
    availableSlots: ["10:00", "10:30", "11:00", "15:00", "15:30", "16:00", "16:30"],
    sessionTypes: ["video", "chat", "audio"],
  },
  {
    id: 5,
    name: "Dr. Prabha Maharjan",
    title: "Licensed Counselor, LPC",
    specialties: ["Stress Management", "Anxiety & Depression", "Mindfulness"],
    badges: ["LPC", "Certified", "7+ Years"],
    price: 1500,
    originalPrice: 2000,
    rating: 4.8,
    reviews: 203,
    image: "/images/doctors/doctor-5.png",
    availableSlots: ["9:00", "9:30", "10:00", "14:00", "14:30"],
    sessionTypes: ["video", "chat"],
  },
  {
    id: 6,
    name: "Dr. Sunita Tamang",
    title: "Psychiatrist, MD",
    specialties: ["Women's Health", "Postpartum Depression", "Anxiety"],
    badges: ["MD", "NMC Licensed", "9+ Years"],
    price: 2800,
    originalPrice: 3200,
    rating: 4.9,
    reviews: 178,
    image: "/images/doctors/doctor-6.png",
    availableSlots: ["10:00", "10:30", "11:00", "14:00", "14:30", "15:00"],
    sessionTypes: ["video", "chat"],
  },
]

function formatNpr(amount: number) {
  return `NPR ${amount.toLocaleString("en-US")}`
}

export function TherapistList({ searchQuery }: TherapistListProps) {
  const filteredTherapists = therapists.filter((therapist) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      therapist.name.toLowerCase().includes(query) ||
      therapist.specialties.some((specialty) => specialty.toLowerCase().includes(query)) ||
      therapist.title.toLowerCase().includes(query)
    )
  })

  return (
    <div className="space-y-4">
      {filteredTherapists.map((therapist) => (
        <div
          key={therapist.id}
          className="bg-card rounded-2xl border border-border p-5 hover:shadow-lg transition-shadow"
        >
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-shrink-0">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-secondary">
                <Image
                  src={therapist.image}
                  alt={therapist.name}
                  width={96}
                  height={96}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-lg text-foreground">{therapist.name}</h3>
                  <p className="text-sm text-muted-foreground">{therapist.title}</p>
                </div>

                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium text-foreground">{therapist.rating}</span>
                  <span className="text-sm text-muted-foreground">({therapist.reviews})</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 mt-2">
                {therapist.specialties.map((specialty) => (
                  <span
                    key={specialty}
                    className="text-xs px-2 py-1 bg-secondary text-secondary-foreground rounded-full"
                  >
                    {specialty}
                  </span>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2 mt-3">
                {therapist.badges.map((badge) => (
                  <span
                    key={badge}
                    className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-primary/10 text-primary rounded-full font-medium"
                  >
                    <Award className="h-3 w-3" />
                    {badge}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-2 mt-3">
                {therapist.sessionTypes.includes("video") && (
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Video className="h-3.5 w-3.5" /> Video
                  </span>
                )}
                {therapist.sessionTypes.includes("chat") && (
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <MessageCircle className="h-3.5 w-3.5" /> Chat
                  </span>
                )}
                {therapist.sessionTypes.includes("audio") && (
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Phone className="h-3.5 w-3.5" /> Audio
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col items-start sm:items-end gap-3">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-primary">{formatNpr(therapist.price)}</span>
                {therapist.originalPrice && (
                  <span className="text-sm text-muted-foreground line-through">
                    {formatNpr(therapist.originalPrice)}
                  </span>
                )}
                <span className="text-xs text-muted-foreground">per session</span>
              </div>

              <div className="flex flex-wrap gap-1.5 max-w-[200px]">
                {therapist.availableSlots.slice(0, 6).map((slot) => (
                  <button
                    key={slot}
                    className="px-3 py-1.5 text-sm font-medium border border-primary text-primary rounded-lg hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    {slot}
                  </button>
                ))}
                {therapist.availableSlots.length > 6 && (
                  <button className="px-2 py-1.5 text-sm font-medium text-primary hover:underline">
                    +{therapist.availableSlots.length - 6} more
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}

      {filteredTherapists.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No therapists found matching your criteria.</p>
        </div>
      )}
    </div>
  )
}
