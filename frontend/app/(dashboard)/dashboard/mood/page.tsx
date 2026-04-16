"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { getMoodMeta, MOOD_OPTIONS, type MoodValue } from "@/lib/mood"
import { moodService } from "@/services"
import type { MoodEntry } from "@/lib/types"

export default function MoodTrackerPage() {
  const [entries, setEntries] = useState<MoodEntry[]>([])
  const [selectedMood, setSelectedMood] = useState<MoodValue>("calm")
  const [stressLevel, setStressLevel] = useState<number>(3)
  const [energyLevel, setEnergyLevel] = useState<number>(3)
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadEntries = async () => {
    try {
      setEntries(await moodService.list())
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load mood entries.")
    }
  }

  useEffect(() => {
    loadEntries().catch(() => undefined)
  }, [])

  const weeklyAverage = useMemo(() => {
    if (entries.length === 0) return null
    return (entries.reduce((sum, entry) => sum + entry.moodScore, 0) / entries.length).toFixed(1)
  }, [entries])

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      await moodService.create({
        entryDate: new Date().toISOString().slice(0, 10),
        mood: selectedMood,
        stressLevel,
        energyLevel,
        notes,
      })
      toast.success("Mood entry saved.")
      setNotes("")
      await loadEntries()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save mood entry.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Mood Tracker</h1>
        <p className="text-muted-foreground">Log your daily wellbeing and review recent entries.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Log today&apos;s mood</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              {MOOD_OPTIONS.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  variant={selectedMood === option.value ? "default" : "outline"}
                  className="h-auto justify-start px-4 py-3 text-left"
                  onClick={() => setSelectedMood(option.value)}
                >
                  <span className="mr-2 text-lg" aria-hidden="true">{option.emoji}</span>
                  <span>{option.label}</span>
                </Button>
              ))}
            </div>

              <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="stress-level">Stress level</Label>
                <Input id="stress-level" type="number" min={1} max={5} value={stressLevel} onChange={(e) => setStressLevel(Number(e.target.value) || 1)} />
              </div>
              <div>
                <Label htmlFor="energy-level">Energy level</Label>
                <Input id="energy-level" type="number" min={1} max={5} value={energyLevel} onChange={(e) => setEnergyLevel(Number(e.target.value) || 1)} />
              </div>
            </div>

            <div>
              <Label htmlFor="mood-notes">Notes</Label>
              <Textarea id="mood-notes" value={notes} onChange={(event) => setNotes(event.target.value)} />
            </div>

            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save entry"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent history</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">Weekly wellbeing score: {weeklyAverage ? `${weeklyAverage}/5` : "-"}</p>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            {entries.length === 0 ? (
              <p className="text-muted-foreground">No mood entries yet.</p>
            ) : (
              entries.slice(0, 7).map((entry) => (
                <div key={entry.id} className="rounded-lg border border-border p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{entry.entryDate}</p>
                    <p className="text-sm text-muted-foreground">
                      {(getMoodMeta(entry.mood)?.emoji || "")} {entry.moodLabel}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Stress {entry.stressLevel} | Energy {entry.energyLevel}
                  </p>
                  {entry.notes && <p className="text-sm mt-2">{entry.notes}</p>}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
