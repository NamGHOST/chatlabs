"use client"

import React, {
  memo,
  useCallback,
  useContext,
  useEffect,
  useState
} from "react"
import { notFound, useParams, useSearchParams } from "next/navigation"
import { ChatbotUIContext } from "@/context/context"
import { ChatbotUIChatContext } from "@/context/chat"
import { useAuth } from "@/context/auth"
import { useChatHandler } from "@/components/chat/chat-hooks/use-chat-handler"
import { usePromptAndCommand } from "@/components/chat/chat-hooks/use-prompt-and-command"
import { useScroll } from "./chat-hooks/use-scroll"
import useHotkey from "@/lib/hooks/use-hotkey"
import { useTheme } from "next-themes"
import { ChatMessage, LLM, LLMID, MessageImage } from "@/types"
import { Tables } from "@/supabase/types"
import { parseIdFromSlug } from "@/lib/slugify"

import Loading from "@/components/ui/loading"
import { ChatInput } from "./chat-input"
import { ChatMessages } from "./chat-messages"
import { QuickSettings } from "@/components/chat/quick-settings"
import { ChatSettings } from "@/components/chat/chat-settings"
import { Brand } from "@/components/ui/brand"
import { AssistantIcon } from "@/components/assistants/assistant-icon"
import { ConversationStarters } from "@/components/chat/conversation-starters"

import { getPromptById } from "@/db/prompts"
import { getAssistantToolsByAssistantId } from "@/db/assistant-tools"
import { getChatFilesByChatId } from "@/db/chat-files"
import { getMessageById, getMessagesByChatId } from "@/db/messages"
import { getMessageImageFromStorage } from "@/db/storage/message-images"
import { convertBlobToBase64 } from "@/lib/blob-to-b64"
import { ChatMessageCounter } from "@/components/chat/chat-message-counter"
import { getFileByHashId } from "@/db/files"
import {
  parseChatMessageCodeBlocksAndContent,
  parseDBMessageCodeBlocksAndContent
} from "@/lib/messages"
import { CodeBlock } from "@/types/chat-message"
import { isMobileScreen } from "@/lib/mobile"
import { IconArrowDown } from "@tabler/icons-react"
import { Button } from "../ui/button"
import { motion, AnimatePresence } from "framer-motion" // Add this import
import { cn } from "@/lib/utils"
import { ModelIcon } from "../models/model-icon"
import { AssistantCard } from "@/components/assistants/assistant-card" // Add this import
import { useRouter } from "next/navigation"

interface ChatUIProps {
  chatId?: string
  showModelSelector?: boolean
  showChatSettings?: boolean
  showAssistantSelector?: boolean
  assistant?: Tables<"assistants">
  onSelectCodeBlock?: (codeBlock: CodeBlock | null) => void
  onChatCreate?: (chat: Tables<"chats">) => void
  onChatUpdate?: (chat: Tables<"chats">) => void
  experimentalCodeEditor: boolean // New prop
}

export const ChatUI: React.FC<ChatUIProps> = ({
  showModelSelector = true,
  showChatSettings = true,
  showAssistantSelector = true,
  assistant,
  onChatCreate,
  onChatUpdate,
  onSelectCodeBlock,
  chatId,
  experimentalCodeEditor // Default to false
}) => {
  const params = useParams()
  const searchParams = useSearchParams()
  const { theme } = useTheme()

  const { user } = useAuth()

  const {
    chats,
    setChatImages,
    assistants,
    setSelectedAssistant,
    setChatFiles,
    setShowFilesDisplay,
    setUseRetrieval,
    selectedAssistant,
    allModels
  } = useContext(ChatbotUIContext)

  const {
    chatSettings,
    setSelectedChat,
    setChatSettings,
    setChatFileItems,
    setSelectedTools,
    chatMessages,
    setChatMessages
  } = useContext(ChatbotUIChatContext)

  const { handleNewChat, handleFocusChatInput, handleSendMessage } =
    useChatHandler({
      onChatCreate,
      onChatUpdate
    })

  const { handleSelectPromptWithVariables, handleSelectAssistant } =
    usePromptAndCommand()
  const {
    scrollRef,
    messagesStartRef,
    messagesEndRef,
    isAtBottom,
    handleScroll,
    scrollToBottom,
    setIsAtBottom
  } = useScroll()

  const [loading, setLoading] = useState<boolean>(true)

  useHotkey("o", handleNewChat)
  useHotkey("l", handleFocusChatInput)

  useEffect(() => {
    if (assistant) {
      handleSelectAssistant(assistant).catch(console.error)
    }
    if (!chatId) {
      setLoading(false)
      return
    }
    ;(async () => {
      try {
        await fetchChatData()
      } catch (error) {
        console.error(error)
        return notFound()
      }
    })()
  }, [params, chatId, assistant])

  useEffect(() => {
    const assistantHashId = searchParams?.get("assistant")
    if (assistantHashId) {
      const selectedAssistant = assistants.find(
        a => a.hashid === assistantHashId
      )
      if (selectedAssistant) {
        handleSelectAssistant(selectedAssistant).catch(console.error)
      }
    }
  }, [searchParams, assistants])

  useEffect(() => {
    handleSearchParams()
  }, [searchParams])

  const fetchChatData = async (): Promise<void> => {
    await Promise.all([fetchMessages(), fetchChat()])
    scrollToBottom()
    setIsAtBottom(true)
    handleFocusChatInput()
    setLoading(false)
  }

  const createRemixMessages = (
    filename: string,
    content: string,
    model: LLMID | null,
    assistantId: string | null
  ): ChatMessage[] =>
    [
      {
        fileItems: [],
        message: {
          content: `Remixing ${filename}`,
          annotation: {},
          assistant_id: assistantId || null,
          created_at: new Date().toISOString(),
          role: "user",
          chat_id: chatId || "",
          id: "",
          image_paths: [],
          model: model || chatSettings?.model!,
          sequence_number: 0,
          updated_at: null,
          user_id: user?.id!,
          word_count: 0
        }
      },
      {
        fileItems: [],
        message: {
          content: `\`\`\`html
#filename=${filename}#
${content}
\`\`\``,
          annotation: {},
          assistant_id: assistantId || null,
          created_at: new Date().toISOString(),
          role: "assistant",
          chat_id: chatId || "",
          id: "",
          image_paths: [],
          model: model || chatSettings?.model!,
          sequence_number: 1,
          updated_at: null,
          user_id: user?.id!,
          word_count: 0
        }
      }
    ].map(parseChatMessageCodeBlocksAndContent)

  async function handleForkMessage(
    messageId: string,
    sequenceNo: number,
    assistantId: string | null,
    modelId: LLMID | null
  ) {
    const message = await getMessageById(messageId)
    if (message) {
      const codeBlock =
        parseDBMessageCodeBlocksAndContent(message)?.codeBlocks?.[sequenceNo]
      if (codeBlock && codeBlock.language === "html" && codeBlock.filename) {
        await handleNewChat(
          "",
          createRemixMessages(
            codeBlock.filename,
            codeBlock.code,
            modelId,
            assistantId
          )
        )
      }
    }
  }

  function handleRemixFile(
    fileId: string,
    assistantId: string | null,
    modelId: LLMID | null
  ) {
    getFileByHashId(fileId).then(file => {
      if (chatMessages?.length === 0 && file && file.type === "html") {
        setChatMessages(
          createRemixMessages(
            file.name,
            file.file_items[0].content,
            modelId,
            assistantId
          )
        )
      }
    })
  }

  const handleSearchParams = (): void => {
    const promptId = searchParams?.get("prompt_id")
    let modelId = searchParams?.get("model") as LLMID
    const remixFileId = searchParams?.get("remix")
    const forkMessageId = searchParams?.get("forkMessageId")
    const assistantId = searchParams?.get("assistant")
    const forkSequenceNo = parseInt(searchParams?.get("forkSequenceNo") || "-1")

    if (promptId) {
      getPromptById(parseIdFromSlug(promptId))
        .then(prompt => {
          if (prompt) handleSelectPromptWithVariables(prompt)
        })
        .catch(console.error)
    }

    if (assistantId) {
      const assistant = assistants.find(
        assistant => assistant.id === assistantId
      )

      if (assistant) {
        handleSelectAssistant(assistant).catch(console.error)
      }
    }

    if (modelId) {
      setChatSettings(prev => ({ ...prev, model: modelId as LLMID }))
    }

    if (chatMessages?.length === 0 && remixFileId) {
      handleRemixFile(remixFileId, assistantId || null, modelId)
    }

    if (chatMessages?.length === 0 && forkMessageId && forkSequenceNo > -1) {
      handleForkMessage(
        forkMessageId,
        forkSequenceNo,
        assistantId || null,
        modelId
      ).catch(console.error)
    }
  }

  const fetchMessages = async (): Promise<void> => {
    const chat = chats.find(chat => chat.id === chatId)
    if (!chat) return

    const fetchedMessages = await getMessagesByChatId(chat.id)

    const images = await fetchMessageImages(fetchedMessages)
    const uniqueFileItems = fetchedMessages.flatMap(item => item.file_items)
    const chatFiles = await getChatFilesByChatId(chat.id)

    setChatImages(images)
    setChatFileItems(uniqueFileItems)
    setUseRetrieval(true)
    setShowFilesDisplay(true)
    setChatFiles(
      chatFiles.files.map(file => ({
        id: file.id,
        name: file.name,
        type: file.type,
        file: null
      }))
    )
    setChatMessages(fetchedMessages.map(parseDBMessageCodeBlocksAndContent))
  }

  const fetchMessageImages = async (
    messages: Tables<"messages">[]
  ): Promise<MessageImage[]> => {
    const imagePromises = messages.flatMap(message =>
      message.image_paths
        ? message.image_paths.map(async imagePath => {
            const url = await getMessageImageFromStorage(imagePath)
            if (url) {
              const response = await fetch(url)
              const blob = await response.blob()
              const base64 = await convertBlobToBase64(blob)
              return {
                messageId: message.id,
                path: imagePath,
                base64,
                url,
                file: null
              }
            }
            return {
              messageId: message.id,
              path: imagePath,
              base64: "",
              url,
              file: null
            }
          })
        : []
    )
    return Promise.all(imagePromises)
  }

  const fetchChat = async (): Promise<void> => {
    const chat = chats.find(chat => chat.id === chatId)
    if (!chat) return

    if (chat.assistant_id) {
      const assistant = assistants.find(
        assistant => assistant.id === chat.assistant_id
      )
      if (assistant) {
        setSelectedAssistant(assistant)
        const assistantTools = (
          await getAssistantToolsByAssistantId(assistant.id)
        ).tools
        setSelectedTools(assistantTools)
      }
    }

    setSelectedChat(chat)
    setChatSettings({
      model: chat.model as LLMID,
      prompt: chat.prompt,
      temperature: chat.temperature,
      contextLength: chat.context_length,
      includeProfileContext: chat.include_profile_context,
      includeWorkspaceInstructions: chat.include_workspace_instructions,
      embeddingsProvider: chat.embeddings_provider as
        | "jina"
        | "openai"
        | "local"
    })
  }

  const isMobile = isMobileScreen()
  const isExperimentalCodeEditor = experimentalCodeEditor && !isMobile
  const model = allModels.find(
    model =>
      model.modelId === chatSettings?.model ||
      model.hostedId === chatSettings?.model
  )

  return (
    <div className="relative flex h-full flex-1 shrink-0 flex-col overflow-hidden overflow-y-auto">
      {showChatSettings && (
        <div className="bg-background sticky top-0 z-20 flex h-14 w-full shrink-0 justify-between p-2">
          <div className="flex items-center">
            {!assistant && <QuickSettings />}
          </div>
          {showModelSelector && <ChatSettings />}
        </div>
      )}
      {/* Chat Content */}
      <div className="flex min-h-[calc(100dvh-4rem)] w-full">
        {loading ? (
          <Loading />
        ) : (
          <div
            className={cn(
              "relative mx-auto flex w-full flex-1 flex-col px-2",
              chatMessages?.length === 0 ? "max-w-none" : "max-w-2xl"
            )}
          >
            {chatMessages?.length === 0 ? (
              <EmptyChatView
                model={model!}
                selectedAssistant={selectedAssistant}
                theme={theme}
              />
            ) : (
              <>
                <div ref={messagesStartRef} />
                <ChatMessages
                  onSelectCodeBlock={onSelectCodeBlock}
                  isExperimentalCodeEditor={isExperimentalCodeEditor}
                />
                <div ref={messagesEndRef} className="min-h-20 flex-1" />
              </>
            )}
            <div className="sticky inset-x-0 bottom-0">
              <div className="mx-auto max-w-2xl p-4">
                {chatMessages?.length === 0 && (
                  <ConversationStarters
                    values={selectedAssistant?.conversation_starters}
                    onSelect={(value: string) =>
                      handleSendMessage(value, chatMessages, false)
                    }
                  />
                )}
                <div className="relative">
                  <div className="absolute inset-0 backdrop-blur-sm" />
                  <div className="relative">
                    <ChatInput
                      showAssistant={
                        showAssistantSelector && !selectedAssistant
                      }
                      handleSendMessage={handleSendMessage}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

interface EmptyChatViewProps {
  model: LLM
  selectedAssistant: Tables<"assistants"> | null
  theme: string | undefined
}

const EmptyChatView: React.FC<EmptyChatViewProps> = ({
  model,
  selectedAssistant,
  theme
}) => {
  const { assistants, setSelectedAssistant } = useContext(ChatbotUIContext)
  const router = useRouter()

  const handleAssistantClick = async (assistant: Tables<"assistants">) => {
    const searchParams = new URLSearchParams(window.location.search)
    searchParams.set("assistant", assistant.hashid)
    window.history.replaceState(null, "", `?${searchParams.toString()}`)
  }

  const handleClearAssistant = () => {
    setSelectedAssistant(null)
    const searchParams = new URLSearchParams(window.location.search)
    searchParams.delete("assistant")
    window.history.replaceState(
      null,
      "",
      searchParams.toString()
        ? `?${searchParams.toString()}`
        : window.location.pathname
    )
  }

  if (selectedAssistant) {
    return (
      <div className="flex flex-1 flex-col">
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <div className="flex justify-center">
              <AssistantIcon
                assistant={selectedAssistant}
                size={80}
                className="rounded-full"
              />
            </div>
            <div className="mt-4 text-2xl font-bold">
              {selectedAssistant.name}
            </div>
            <div className="text-muted-foreground mt-2 max-w-xl px-4">
              {selectedAssistant.description}
            </div>
            <Button
              variant="outline"
              onClick={handleClearAssistant}
              className="mt-6"
            >
              Change Assistant
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col items-center justify-center">
        <Brand theme={theme === "dark" ? "dark" : "light"} />
        <div className="mt-12 w-full max-w-[1200px] px-8">
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
