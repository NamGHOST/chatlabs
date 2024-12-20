"use client"

import { useContext } from "react"
import { AssistantCard } from "./assistant-card"
import { Tables } from "@/supabase/types"
import { useRouter } from "next/navigation"
import { ChatbotUIContext } from "@/context/context"
import { Brand } from "../ui/brand"
import { useTheme } from "next-themes"

export function AssistantGrid() {
  const { assistants } = useContext(ChatbotUIContext)
  const router = useRouter()
  const { theme } = useTheme()

  const handleAssistantClick = (assistant: Tables<"assistants">) => {
    router.push(`/chat?assistant=${assistant.hashid}`)
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex justify-center py-8">
        <Brand theme={theme === "dark" ? "dark" : "light"} />
      </div>

      <div className="flex flex-1 flex-col items-center px-6">
        <div className="mx-auto w-full max-w-[900px]">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {assistants.map(assistant => (
              <AssistantCard
                key={assistant.id}
                assistant={assistant}
                onClick={() => handleAssistantClick(assistant)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
