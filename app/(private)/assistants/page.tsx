"use client"

import { AssistantGrid } from "@/components/assistants/assistant-grid"
import { ChatbotUIChatProvider } from "@/context/chat"

export default function AssistantsPage() {
  return (
    <ChatbotUIChatProvider id="assistants">
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/30 dark:from-black/50 dark:to-black/80">
        <AssistantGrid />
      </div>
    </ChatbotUIChatProvider>
  )
}
