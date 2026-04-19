"use client"

import { ConversationInbox } from "@/components/messages/conversation-inbox"

export default function MessagesPage() {
  return (
    <ConversationInbox
      title="Messages"
      emptyText="Book a therapist to start a conversation."
      inputPlaceholder="Type a message..."
      getPeerName={(conversation) => conversation.therapistName || "Therapist"}
    />
  )
}
