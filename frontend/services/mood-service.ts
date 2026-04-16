import { api } from "@/lib/api"
import type { MoodEntry } from "@/lib/types"

export const moodService = {
  list(filters?: { date?: string }): Promise<MoodEntry[]> {
    return api.getMoodEntries(filters)
  },
  create(payload: {
    entryDate: string
    mood: MoodEntry["mood"]
    stressLevel: number
    energyLevel: number
    notes?: string
  }): Promise<MoodEntry> {
    return api.createMoodEntry(payload)
  },
}
