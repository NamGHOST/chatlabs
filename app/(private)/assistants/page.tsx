"use client"

import { AssistantGrid } from "@/components/assistants/assistant-grid"
import { ChatbotUIChatProvider } from "@/context/chat"

export default function AssistantsPage() {
  return (
    <ChatbotUIChatProvider id="assistants">
      <div className="flex h-full flex-col space-y-4 p-4">
        <h1 className="text-2xl font-bold">Assistants</h1>
        <AssistantGrid />
      </div>
    </ChatbotUIChatProvider>
  )
}
