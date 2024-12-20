"use client"

import React from "react"
import { ChatUI } from "@/components/chat/chat-ui"
import { Tables } from "@/supabase/types"

interface AssistantChatViewProps {
  assistant: Tables<"assistants">
}

export function AssistantChatView({ assistant }: AssistantChatViewProps) {
  return (
    <div className="flex h-full flex-col">
      <ChatUI assistant={assistant} experimentalCodeEditor={false} />
    </div>
  )
}
