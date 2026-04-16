"use client"

import { useEffect, useMemo, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send } from "lucide-react"
import { toast } from "sonner"
import { communicationService } from "@/services"
import type { Conversation } from "@/lib/types"

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversationId, setSelectedConversationId] = useState<string>("")
  const [newMessage, setNewMessage] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadConversations = async () => {
    setIsLoading(true)
    try {
      const data = await communicationService.listConversations()
      setConversations(data)
      if (!selectedConversationId && data.length > 0) {
        setSelectedConversationId(data[0].id)
      }
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load conversations.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadConversations()
  }, [])

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === selectedConversationId) || null,
    [conversations, selectedConversationId]
  )

  const handleSend = async () => {
    if (!selectedConversationId || !newMessage.trim()) return
    try {
      await communicationService.sendMessage(selectedConversationId, newMessage.trim())
      setNewMessage("")
      await loadConversations()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to send message.")
    }
  }

  return (
    <div className="h-[calc(100vh-8rem)]">
      <Card className="h-full grid grid-cols-1 md:grid-cols-[320px_1fr] overflow-hidden">
        <div className="border-r border-border">
          <div className="p-4 border-b border-border font-semibold">Conversations</div>
          <div className="p-2 space-y-2">
            {isLoading ? (
              <p className="p-4 text-muted-foreground">Loading conversations...</p>
            ) : error ? (
              <p className="p-4 text-destructive">{error}</p>
            ) : conversations.length === 0 ? (
              <p className="p-4 text-muted-foreground">No conversations yet.</p>
            ) : (
              conversations.map((conversation) => {
                const lastMessage = conversation.messages[conversation.messages.length - 1]
                return (
                  <button
                    key={conversation.id}
                    onClick={() => setSelectedConversationId(conversation.id)}
                    className={`w-full rounded-lg p-3 text-left ${selectedConversationId === conversation.id ? "bg-muted" : "hover:bg-muted/50"}`}
                  >
                    <p className="font-medium">{conversation.therapistName}</p>
                    <p className="text-sm text-muted-foreground mt-1 truncate">
                      {lastMessage?.content || "No messages yet"}
                    </p>
                  </button>
                )
              })
            )}
          </div>
        </div>

        <div className="flex flex-col">
          <div className="p-4 border-b border-border font-semibold">
            {selectedConversation?.therapistName || "Select a conversation"}
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {selectedConversation ? (
              selectedConversation.messages.map((message) => (
                <div key={message.id} className="rounded-lg border border-border p-3">
                  <p className="font-medium text-sm">{message.senderName}</p>
                  <p className="text-sm mt-1">{message.content}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(message.createdAt).toLocaleString()}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">Choose a conversation to view messages.</p>
            )}
          </div>
          <div className="border-t border-border p-4 flex gap-2">
            <Input
              value={newMessage}
              onChange={(event) => setNewMessage(event.target.value)}
              placeholder="Type a message..."
            />
            <Button onClick={handleSend} disabled={!selectedConversationId || !newMessage.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
