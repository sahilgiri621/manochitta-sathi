"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { TherapistFilters } from "@/components/therapist-filters"
import { TherapistList } from "@/components/therapist-list"
import { DatePicker } from "@/components/date-picker"
import { Search, SlidersHorizontal, X } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function TherapistsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date())
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [activeFilters, setActiveFilters] = useState<string[]>([
    "Anxiety & Depression",
    "5-15 years experience",
    "Video"
  ])

  const removeFilter = (filter: string) => {
    setActiveFilters(activeFilters.filter(f => f !== filter))
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-2">Find Your Therapist</h1>
          <p className="text-muted-foreground">Browse our qualified therapists and book your session</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Mobile Filter Toggle */}
          <div className="lg:hidden">
            <Button
              variant="outline"
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="w-full justify-between"
            >
              <span className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                Filters
              </span>
              {activeFilters.length > 0 && (
                <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                  {activeFilters.length}
                </span>
              )}
            </Button>
          </div>

          {/* Left Sidebar - Filters */}
          <aside className={`lg:w-72 flex-shrink-0 ${showMobileFilters ? 'block' : 'hidden lg:block'}`}>
            <TherapistFilters />
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {/* Search Bar */}
            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by name or specialization..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            {/* Date Picker */}
            <DatePicker selectedDate={selectedDate} onDateSelect={setSelectedDate} />

            {/* Active Filters */}
            {activeFilters.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
                {activeFilters.map((filter) => (
                  <button
                    key={filter}
                    onClick={() => removeFilter(filter)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary text-sm rounded-full hover:bg-primary/20 transition-colors"
                  >
                    {filter}
                    <X className="h-3.5 w-3.5" />
                  </button>
                ))}
              </div>
            )}

            {/* Therapist List */}
            <TherapistList searchQuery={searchQuery} selectedDate={selectedDate} />
          </div>
        </div>
      </main>
    </div>
  )
}
