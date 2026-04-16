export const MOOD_OPTIONS = [
  { value: "happy", label: "Happy", emoji: "😊", score: 5 },
  { value: "calm", label: "Calm", emoji: "😌", score: 4 },
  { value: "motivated", label: "Motivated", emoji: "💪", score: 4 },
  { value: "tired", label: "Tired", emoji: "😴", score: 3 },
  { value: "anxious", label: "Anxious", emoji: "😟", score: 2 },
  { value: "stressed", label: "Stressed", emoji: "😣", score: 2 },
  { value: "sad", label: "Sad", emoji: "😔", score: 1 },
  { value: "angry", label: "Angry", emoji: "😠", score: 1 },
] as const

export type MoodValue = (typeof MOOD_OPTIONS)[number]["value"]

const moodMap = new Map(MOOD_OPTIONS.map((option) => [option.value, option]))

export function getMoodMeta(mood: string) {
  return moodMap.get(mood as MoodValue)
}
