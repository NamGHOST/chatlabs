"use client"

import { useContext } from "react"
import { AssistantCard } from "./assistant-card"
import { Tables } from "@/supabase/types"
import { useRouter } from "next/navigation"
import { ChatbotUIContext } from "@/context/context"

export function AssistantGrid() {
  const { assistants } = useContext(ChatbotUIContext)
  const router = useRouter()

  const handleAssistantClick = (assistant: Tables<"assistants">) => {
    router.push(`/assistants/${assistant.id}`) // Navigate to the assistants route
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {assistants.map(assistant => (
        <AssistantCard
          key={assistant.id}
          assistant={assistant}
          onClick={() => handleAssistantClick(assistant)}
        />
      ))}
    </div>
  )
}
