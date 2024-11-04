"use client"

import { createContext, useState } from "react"
import { ChatbotUIContext } from "./context"

interface ChatbotUIContextType {
  showAdvancedSettings: boolean
  setShowAdvancedSettings: (show: boolean) => void
  // ... other context values
}

export const ChatContext = createContext<ChatbotUIContextType | undefined>(
  undefined
)

export function ChatbotUIProvider({ children }: { children: React.ReactNode }) {
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false)

  return (
    <ChatContext.Provider
      value={{
        showAdvancedSettings,
        setShowAdvancedSettings
        // ... other context values
      }}
    >
      {children}
    </ChatContext.Provider>
  )
}
