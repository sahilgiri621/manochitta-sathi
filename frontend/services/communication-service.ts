import { api } from "@/lib/api"
import type { Conversation, Message } from "@/lib/types"

export const communicationService = {
  listConversations(): Promise<Conversation[]> {
    return api.getConversations()
  },
  listMessages(conversationId?: string): Promise<Message[]> {
    return api.getMessages(conversationId)
  },
  sendMessage(conversation: string, content: string): Promise<Message> {
    return api.sendMessage(conversation, content)
  },
}
