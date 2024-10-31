import { Tables } from "@/supabase/types"
import { ChatMessage, LLMID } from "."
import { MessageHtmlElement } from "@/types/html"

export interface ChatSettings {
  model: LLMID
  prompt: string
  temperature: number
  useCustomSystemPrompt?: boolean
  customSystemPrompt?: string
  contextLength: number
  includeProfileContext: boolean
  includeWorkspaceInstructions: boolean
  embeddingsProvider: "jina" | "openai" | "local"
}

export interface ChatPayload {
  chatSettings: ChatSettings
  // workspaceInstructions: string
  chatMessages: ChatMessage[]
  assistant: Tables<"assistants"> | null
  messageFileItems: Tables<"file_items">[]
  chatFileItems: Tables<"file_items">[]
  messageHtmlElements?: MessageHtmlElement[]
}

export interface ChatAPIPayload {
  chatSettings: ChatSettings
  messages: Tables<"messages">[]
}

export interface Message {
  role: "user" | "assistant"
  content: string
  participantIndex?: number
  senderName?: string
}
