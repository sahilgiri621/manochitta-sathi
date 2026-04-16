import { api } from "@/lib/api"
import type { Conversation, Message } from "@/lib/types"

export const communicationService = {
  listConversations(): Promise<Conversation[]> {
    return api.getConversations()
  },
  createConversation(appointment: string, therapist: string): Promise<Conversation> {
    return api.createConversation(appointment, therapist)
  },
  listMessages(conversationId?: string): Promise<Message[]> {
    return api.getMessages(conversationId)
  },
  sendMessage(conversation: string, content: string): Promise<Message> {
    return api.sendMessage(conversation, content)
  },
}
