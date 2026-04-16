import { api } from "@/lib/api"
import type { AIChatMessagePayload, AIChatReply } from "@/lib/types"

export const aiService = {
  chat(message: string, options?: { conversationContext?: AIChatMessagePayload[]; userContext?: Record<string, unknown> }): Promise<AIChatReply> {
    return api.chatWithRecommendations(message, options)
  },
}
