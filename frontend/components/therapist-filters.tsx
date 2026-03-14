"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface FilterSectionProps {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}

function FilterSection({ title, children, defaultOpen = true }: FilterSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="border-b border-border pb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
      >
        {title}
        {isOpen ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </button>
      {isOpen && <div className="mt-2">{children}</div>}
    </div>
  )
}

export function TherapistFilters() {
  const [specialty, setSpecialty] = useState<string[]>(["anxiety"])
  const [patientType, setPatientType] = useState("adults")
  const [experience, setExperience] = useState("5-15")
  const [communication, setCommunication] = useState<string[]>(["video"])
  const [priceRange, setPriceRange] = useState("all")

  const specialties = [
    { id: "anxiety", label: "Anxiety & Depression" },
    { id: "relationships", label: "Relationships" },
    { id: "trauma", label: "Trauma & PTSD" },
    { id: "stress", label: "Stress Management" },
    { id: "addiction", label: "Addiction" },
    { id: "grief", label: "Grief & Loss" },
    { id: "family", label: "Family Issues" },
    { id: "self-esteem", label: "Self-Esteem" },
  ]

  const toggleSpecialty = (id: string) => {
    setSpecialty(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    )
  }

  const toggleCommunication = (type: string) => {
    setCommunication(prev =>
      prev.includes(type) ? prev.filter(c => c !== type) : [...prev, type]
    )
  }

  return (
    <div className="bg-card rounded-2xl border border-border p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-foreground">Filters</h2>
        <button className="text-sm text-primary hover:underline">Clear all</button>
      </div>

      {/* Specialty */}
      <FilterSection title="Specialty">
        <div className="space-y-2">
          {specialties.map((spec) => (
            <label
              key={spec.id}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div
                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                  specialty.includes(spec.id)
                    ? "bg-primary border-primary"
                    : "border-border group-hover:border-primary/50"
                }`}
              >
                {specialty.includes(spec.id) && (
                  <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                {spec.label}
              </span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Patient Type */}
      <FilterSection title="Accepts">
        <div className="flex gap-2">
          <button
            onClick={() => setPatientType("adults")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              patientType === "adults"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            Adults
          </button>
          <button
            onClick={() => setPatientType("teens")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              patientType === "teens"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            Teens
          </button>
          <button
            onClick={() => setPatientType("couples")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              patientType === "couples"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            Couples
          </button>
        </div>
      </FilterSection>

      {/* Experience */}
      <FilterSection title="Experience">
        <div className="flex flex-wrap gap-2">
          {[
            { id: "any", label: "Any" },
            { id: "0-5", label: "0-5 years" },
            { id: "5-15", label: "5-15 years" },
            { id: "15+", label: "15+ years" },
          ].map((exp) => (
            <button
              key={exp.id}
              onClick={() => setExperience(exp.id)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                experience === exp.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              {exp.label}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Communication Type */}
      <FilterSection title="Session Type">
        <div className="flex gap-2">
          {[
            { id: "chat", label: "Chat" },
            { id: "audio", label: "Audio" },
            { id: "video", label: "Video" },
          ].map((type) => (
            <button
              key={type.id}
              onClick={() => toggleCommunication(type.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                communication.includes(type.id)
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Price Range */}
      <FilterSection title="Price per Session">
        <div className="flex flex-wrap gap-2">
          {[
            { id: "all", label: "All prices" },
            { id: "0-2000", label: "Under NPR 2,000" },
            { id: "2000-3000", label: "NPR 2,000 - NPR 3,000" },
            { id: "3000-4000", label: "NPR 3,000 - NPR 4,000" },
            { id: "4000+", label: "NPR 4,000+" },
          ].map((price) => (
            <button
              key={price.id}
              onClick={() => setPriceRange(price.id)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                priceRange === price.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              {price.label}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Apply Button */}
      <Button className="w-full mt-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full">
        Show 24 Therapists
      </Button>
      <button className="w-full mt-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        Reset filters
      </button>
    </div>
  )
}
