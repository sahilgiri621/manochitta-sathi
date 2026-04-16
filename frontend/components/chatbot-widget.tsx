"use client"

import Image from "next/image"
import Link from "next/link"
import { FormEvent, useEffect, useRef, useState } from "react"
import { Loader2, MessageCircleMore, SendHorizonal, X } from "lucide-react"

import { aiService } from "@/services"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import type { AIRecommendedResource, AIRecommendedTherapist } from "@/lib/types"

type ChatRole = "user" | "assistant"

interface ChatMessage {
  id: string
  role: ChatRole
  content: string
  recommendedTherapists?: AIRecommendedTherapist[]
  recommendedResources?: AIRecommendedResource[]
}

const INITIAL_MESSAGE: ChatMessage = {
  id: "assistant-welcome",
  role: "assistant",
  content: "Hi, I'm the Manochitta Sathi assistant. Ask me about mental wellbeing, sessions, or how to use the platform.",
}

const STARTER_PROMPTS = [
  "How is your mood today?",
  "How are you feeling?",
  "What kind of help are you looking for?",
]

export function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE])
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    })
  }, [messages, isOpen, isSending])

  const sendMessage = async (rawMessage: string) => {
    const message = rawMessage.trim()
    if (!message || isSending) return

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: message,
    }

    setMessages((current) => [...current, userMessage])
    setInput("")
    setIsSending(true)
    setError(null)

    try {
      const response = await aiService.chat(message, {
        conversationContext: messages.map((item) => ({ role: item.role, content: item.content })),
      })
      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: response.reply || "I could not generate a response just now.",
          recommendedTherapists: response.recommendedTherapists || [],
          recommendedResources: response.recommendedResources || [],
        },
      ])
    } catch (err) {
      const messageText = err instanceof Error ? err.message : "Unable to contact the assistant right now."
      setError(messageText)
      setMessages((current) => [
        ...current,
        {
          id: `assistant-error-${Date.now()}`,
          role: "assistant",
          content: "I'm having trouble responding right now. Please try again in a moment.",
        },
      ])
    } finally {
      setIsSending(false)
    }
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    await sendMessage(input)
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      {isOpen ? (
        <Card className="flex h-[min(42rem,calc(100dvh-7rem))] w-[min(24rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-3xl border-primary/20 shadow-2xl">
          <CardHeader className="shrink-0 border-b border-border bg-card px-4 py-2.5 text-foreground">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-sm font-medium">
                Assistant
              </CardTitle>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:bg-muted hover:text-foreground"
                onClick={() => setIsOpen(false)}
                aria-label="Close assistant"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex min-h-0 flex-1 flex-col p-0">
            <div ref={scrollRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {messages.length === 1 ? (
                <div className="flex flex-wrap gap-2">
                  {STARTER_PROMPTS.map((prompt) => (
                    <Button
                      key={prompt}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-full"
                      disabled={isSending}
                      onClick={() => void sendMessage(prompt)}
                    >
                      {prompt}
                    </Button>
                  ))}
                </div>
              ) : null}
              {messages.map((message) => (
                <div key={message.id} className="space-y-3">
                  <div
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-6 ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground"
                      }`}
                    >
                      {message.content}
                    </div>
                  </div>
                  {message.role === "assistant" && message.recommendedTherapists?.length ? (
                    <div className="space-y-2">
                      {message.recommendedTherapists.map((therapist) => (
                        <div key={therapist.id} className="rounded-2xl border border-border bg-card p-3 shadow-sm">
                          <div className="flex gap-3">
                            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-muted">
                              {therapist.profileImage ? (
                                <Image src={therapist.profileImage} alt={therapist.name} fill className="object-cover" unoptimized />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">No photo</div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-foreground">{therapist.name}</p>
                              <p className="text-sm text-muted-foreground">{therapist.specialization || "General support"}</p>
                              <p className="text-xs text-muted-foreground">{therapist.experienceYears} years experience</p>
                            </div>
                          </div>
                          <p className="mt-2 text-sm text-foreground">{therapist.reason}</p>
                          <div className="mt-3">
                            <Button asChild size="sm" className="rounded-full">
                              <Link href={therapist.profileUrl}>View profile</Link>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                  {message.role === "assistant" && message.recommendedResources?.length ? (
                    <div className="space-y-2">
                      {message.recommendedResources.map((resource) => (
                        <div key={resource.id} className="rounded-2xl border border-border bg-muted/50 p-3">
                          <p className="font-medium text-foreground">{resource.title}</p>
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">{resource.category}</p>
                          <p className="mt-1 text-sm text-foreground">{resource.reason}</p>
                          <Link href={resource.url} className="mt-2 inline-block text-sm font-medium text-primary hover:underline">
                            Read resource
                          </Link>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
              {isSending ? (
                <div className="flex justify-start">
                  <div className="flex items-center gap-2 rounded-2xl bg-muted px-3 py-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Thinking...
                  </div>
                </div>
              ) : null}
            </div>
            <div className="shrink-0 border-t border-border bg-card px-4 pb-4 pt-3">
              {error ? <p className="mb-2 line-clamp-2 text-xs text-destructive">{error}</p> : null}
              <form onSubmit={handleSubmit} className="flex items-center gap-2">
                <Input
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="Ask a question..."
                  className="h-10"
                  disabled={isSending}
                />
                <Button type="submit" size="icon" disabled={isSending || !input.trim()} aria-label="Send message">
                  <SendHorizonal className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Button
        type="button"
        size="icon"
        className="h-14 w-14 rounded-full shadow-xl"
        onClick={() => setIsOpen((current) => !current)}
        aria-label={isOpen ? "Close chatbot" : "Open chatbot"}
      >
        <MessageCircleMore className="h-6 w-6" />
      </Button>
    </div>
  )
}
