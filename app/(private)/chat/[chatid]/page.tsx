"use client"

import { ChatUI } from "@/components/chat/chat-ui"
import { ChatPreviewContent } from "@/components/chat/chat-preview-content"
import { useState, useContext } from "react"
import { CodeBlock } from "@/types/chat-message"
import { ChatbotUIChatContext } from "@/context/chat"
import { useCodeChange } from "@/hooks/useCodeChange"
import { useCodeBlockEditable } from "@/hooks/useCodeBlockEditable"
import { useParams } from "next/navigation"
import { ChatbotUIContext } from "@/context/context"
import { useSelectCodeBlock } from "@/hooks/useSelectCodeBlock"

export default function ChatIDPage() {
  const { chatMessages } = useContext(ChatbotUIChatContext)
  const { selectedCodeBlock, handleSelectCodeBlock } =
    useSelectCodeBlock(chatMessages)
  const { profile } = useContext(ChatbotUIContext)
  const { isGenerating } = useContext(ChatbotUIChatContext)
  const handleCodeChange = useCodeChange(
    selectedCodeBlock,
    handleSelectCodeBlock
  )

  const params = useParams()
  const chatId = params.chatid as string
  const isCodeBlockEditable = useCodeBlockEditable()

  return (
    <>
      <ChatUI
        onSelectCodeBlock={handleSelectCodeBlock}
        chatId={chatId}
        experimentalCodeEditor={!!profile?.experimental_code_editor}
      />
      <ChatPreviewContent
        open={!!selectedCodeBlock}
        isGenerating={isGenerating}
        selectedCodeBlock={selectedCodeBlock}
        onSelectCodeBlock={handleSelectCodeBlock}
        isEditable={isCodeBlockEditable(selectedCodeBlock)}
        onCodeChange={handleCodeChange}
      />
    </>
  )
}
