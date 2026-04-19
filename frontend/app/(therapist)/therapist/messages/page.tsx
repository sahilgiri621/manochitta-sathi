"use client"

import { ConversationInbox } from "@/components/messages/conversation-inbox"

export default function TherapistMessagesPage() {
  return (
    <ConversationInbox
      title="Client Conversations"
      emptyText="No client conversations yet."
      inputPlaceholder="Type a reply..."
      getPeerName={(conversation) => conversation.userName || "Client"}
    />
  )
}
