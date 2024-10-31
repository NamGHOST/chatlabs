"use client"

import { MeetingContainer } from "@/components/meeting/meeting-container"
import { ChatbotUIChatProvider } from "@/context/chat"

export default function MeetingPage() {
  return (
    <ChatbotUIChatProvider id="meeting">
      <div className="flex h-full flex-col">
        <MeetingContainer />
      </div>
    </ChatbotUIChatProvider>
  )
}
