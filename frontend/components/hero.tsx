"use client"

import { Button } from "@/components/ui/button"
import { User, Users, GraduationCap } from "lucide-react"

const therapyTypes = [
  {
    id: "individual",
    title: "Individual",
    subtitle: "For myself",
    icon: User,
    color: "bg-primary",
    textColor: "text-primary-foreground",
  },
  {
    id: "couples",
    title: "Couples",
    subtitle: "For me and my partner",
    icon: Users,
    color: "bg-accent",
    textColor: "text-accent-foreground",
  },
  {
    id: "teen",
    title: "Teen",
    subtitle: "For my child",
    icon: GraduationCap,
    color: "bg-secondary",
    textColor: "text-secondary-foreground",
  },
]

export function Hero() {
  return (
    <section className="bg-primary py-16 md:py-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-4 text-balance">
          You deserve to be happy.
        </h1>
        <p className="text-lg md:text-xl text-primary-foreground/80 mb-10">
          What type of therapy are you looking for?
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          {therapyTypes.map((type) => (
            <Button
              key={type.id}
              variant="outline"
              className={`${type.color} ${type.textColor} border-0 rounded-2xl px-8 py-6 h-auto flex flex-col items-center gap-2 min-w-[140px] hover:scale-105 transition-transform`}
            >
              <type.icon className="h-6 w-6" />
              <span className="font-semibold">{type.title}</span>
              <span className="text-xs opacity-80">{type.subtitle}</span>
            </Button>
          ))}
        </div>
      </div>
    </section>
  )
}
