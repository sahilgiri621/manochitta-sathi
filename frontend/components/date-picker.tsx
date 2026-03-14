"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { useState } from "react"

interface DatePickerProps {
  selectedDate: Date | null
  onDateSelect: (date: Date) => void
}

export function DatePicker({ selectedDate, onDateSelect }: DatePickerProps) {
  const [startDate, setStartDate] = useState(new Date())
  
  const getDaysArray = () => {
    const days = []
    const current = new Date(startDate)
    
    for (let i = 0; i < 14; i++) {
      const date = new Date(current)
      date.setDate(current.getDate() + i)
      days.push(date)
    }
    
    return days
  }

  const days = getDaysArray()
  const dayNames = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]

  const goBack = () => {
    const newDate = new Date(startDate)
    newDate.setDate(startDate.getDate() - 7)
    setStartDate(newDate)
  }

  const goForward = () => {
    const newDate = new Date(startDate)
    newDate.setDate(startDate.getDate() + 7)
    setStartDate(newDate)
  }

  const isSelected = (date: Date) => {
    if (!selectedDate) return false
    return date.toDateString() === selectedDate.toDateString()
  }

  const isToday = (date: Date) => {
    return date.toDateString() === new Date().toDateString()
  }

  return (
    <div className="bg-card rounded-xl border border-border p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={goBack}
          className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
          aria-label="Previous week"
        >
          <ChevronLeft className="h-5 w-5 text-muted-foreground" />
        </button>
        <span className="text-sm font-medium text-foreground">
          {startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </span>
        <button
          onClick={goForward}
          className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
          aria-label="Next week"
        >
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </button>
      </div>

      <div className="flex gap-1 overflow-x-auto pb-2">
        {days.map((date, index) => (
          <button
            key={index}
            onClick={() => onDateSelect(date)}
            className={`flex flex-col items-center min-w-[48px] py-2 px-3 rounded-xl transition-colors ${
              isSelected(date)
                ? "bg-primary text-primary-foreground"
                : isToday(date)
                ? "bg-primary/10 text-primary hover:bg-primary/20"
                : "hover:bg-secondary text-foreground"
            }`}
          >
            <span className="text-xs font-medium opacity-70">
              {dayNames[date.getDay()]}
            </span>
            <span className="text-lg font-semibold">
              {date.getDate()}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
