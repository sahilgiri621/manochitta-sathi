"use client"

import { useEffect, useMemo, useState } from "react"
import { MessageSquare, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/components/providers/auth-provider"
import { communicationService } from "@/services"
import type { Conversation } from "@/lib/types"
import { toast } from "sonner"

interface ConversationInboxProps {
  title: string
  emptyText: string
  inputPlaceholder: string
  getPeerName: (conversation: Conversation) => string
}

function formatTime(value: string) {
  if (!value) return ""
  return new Date(value).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

export function ConversationInbox({ title, emptyText, inputPlaceholder, getPeerName }: ConversationInboxProps) {
  const { user } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversationId, setSelectedConversationId] = useState("")
  const [newMessage, setNewMessage] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadConversations = async () => {
    setIsLoading(true)
    try {
      const data = await communicationService.listConversations()
      setConversations(data)
      setSelectedConversationId((current) => current || data[0]?.id || "")
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load conversations.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadConversations().catch(() => undefined)
  }, [])

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === selectedConversationId) || null,
    [conversations, selectedConversationId],
  )

  const handleSend = async () => {
    if (!selectedConversationId || !newMessage.trim()) return
    try {
      setIsSending(true)
      await communicationService.sendMessage(selectedConversationId, newMessage.trim())
      setNewMessage("")
      await loadConversations()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to send message.")
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="h-[calc(100vh-8rem)]">
      <Card className="grid h-full grid-cols-1 overflow-hidden md:grid-cols-[340px_1fr]">
        <aside className="min-h-0 border-r border-border">
          <div className="border-b border-border p-4">
            <p className="font-semibold">{title}</p>
            <p className="text-sm text-muted-foreground">Booked sessions open a secure conversation automatically.</p>
          </div>
          <div className="max-h-full space-y-1 overflow-y-auto p-2">
            {isLoading ? (
              <p className="p-4 text-muted-foreground">Loading conversations...</p>
            ) : error ? (
              <p className="p-4 text-destructive">{error}</p>
            ) : conversations.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">
                <MessageSquare className="mx-auto mb-3 h-8 w-8" />
                <p>{emptyText}</p>
              </div>
            ) : (
              conversations.map((conversation) => {
                const lastMessage = conversation.messages[conversation.messages.length - 1]
                const isSelected = selectedConversationId === conversation.id
                return (
                  <button
                    key={conversation.id}
                    onClick={() => setSelectedConversationId(conversation.id)}
                    className={`w-full rounded-md p-3 text-left transition ${isSelected ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="min-w-0 truncate font-medium">{getPeerName(conversation)}</p>
                      <span className={`shrink-0 text-xs ${isSelected ? "text-primary-foreground/75" : "text-muted-foreground"}`}>
                        {formatTime(lastMessage?.createdAt || conversation.createdAt)}
                      </span>
                    </div>
                    <p className={`mt-1 truncate text-sm ${isSelected ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                      {lastMessage?.content || "No messages yet"}
                    </p>
                  </button>
                )
              })
            )}
          </div>
        </aside>

        <section className="flex min-h-0 flex-col">
          <div className="border-b border-border p-4">
            <p className="font-semibold">{selectedConversation ? getPeerName(selectedConversation) : "Select a conversation"}</p>
            {selectedConversation ? (
              <p className="text-sm text-muted-foreground">Appointment conversation</p>
            ) : null}
          </div>

          <div className="flex-1 overflow-y-auto bg-muted/20 p-4">
            {selectedConversation ? (
              selectedConversation.messages.length === 0 ? (
                <div className="flex h-full items-center justify-center text-center text-muted-foreground">
                  <p>No messages yet. Start the conversation below.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedConversation.messages.map((message) => {
                    const isMine = message.sender === user?.id
                    return (
                      <div key={message.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[78%] rounded-md px-4 py-3 ${isMine ? "bg-primary text-primary-foreground" : "bg-background border border-border"}`}>
                          <p className={`text-xs font-medium ${isMine ? "text-primary-foreground/75" : "text-muted-foreground"}`}>
                            {message.senderName || (isMine ? "You" : getPeerName(selectedConversation))}
                          </p>
                          <p className="mt-1 text-sm leading-relaxed">{message.content}</p>
                          <p className={`mt-2 text-xs ${isMine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                            {formatTime(message.createdAt)}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            ) : (
              <div className="flex h-full items-center justify-center text-center text-muted-foreground">
                <p>Choose a conversation to view messages.</p>
              </div>
            )}
          </div>

          <div className="flex gap-2 border-t border-border p-4">
            <Input
              value={newMessage}
              onChange={(event) => setNewMessage(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault()
                  handleSend()
                }
              }}
              placeholder={inputPlaceholder}
              disabled={!selectedConversationId}
            />
            <Button onClick={handleSend} disabled={!selectedConversationId || !newMessage.trim() || isSending}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </section>
      </Card>
    </div>
  )
}
