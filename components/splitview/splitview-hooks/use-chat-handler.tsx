import { ChatbotUIContext } from "@/context/context"
import { getAssistantCollectionsByAssistantId } from "@/db/assistant-collections"
import { getAssistantFilesByAssistantId } from "@/db/assistant-files"
import { getAssistantToolsByAssistantId } from "@/db/assistant-tools"
import { updateChat } from "@/db/chats"
import { getCollectionFilesByCollectionId } from "@/db/collection-files"
import { deleteMessagesIncludingAndAfter } from "@/db/messages"
import { Tables } from "@/supabase/types"
import {
  ChatMessage,
  ChatPayload,
  LLMID,
  ModelProvider,
  LLMTier
} from "@/types"
import { useRouter } from "next/navigation"
import React, { useContext, useEffect, useRef } from "react"
import { LLM_LIST } from "@/lib/models/llm/llm-list"
import {
  createTempMessages,
  fetchChatResponse,
  handleCreateChat,
  handleCreateMessages,
  handleHostedChat,
  handleLocalChat,
  handleRetrieval,
  handleToolsChat,
  processResponse,
  validateChatSettings
} from "@/components/chat/chat-helpers"
import { isMobileScreen } from "@/lib/mobile"
import { SubscriptionRequiredError } from "@/lib/errors"
import { ChatbotUIChatContext } from "@/context/chat"
import { encode } from "gpt-tokenizer"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader
} from "@/components/ui/dialog"

export const useChatHandler = () => {
  const router = useRouter()

  const {
    chatFiles,
    setNewMessageImages,
    profile,
    selectedWorkspace,
    setChats,
    allModels,
    newMessageImages,
    selectedAssistant,
    chatImages,
    setChatImages,
    setChatFiles,
    setNewMessageFiles,
    setShowFilesDisplay,
    newMessageFiles,
    setToolInUse,
    useRetrieval,
    sourceCount,
    setIsPromptPickerOpen,
    setIsFilePickerOpen,
    selectedPreset,
    models,
    isPromptPickerOpen,
    isFilePickerOpen,
    isToolPickerOpen,
    setIsPaywallOpen
  } = useContext(ChatbotUIContext)

  const {
    userInput,
    setUserInput,
    isGenerating,
    setIsGenerating,
    setChatMessages,
    setFirstTokenReceived,
    selectedChat,
    setSelectedChat,
    setSelectedTools,
    abortController,
    setAbortController,
    chatSettings,
    chatMessages,
    chatFileItems,
    setChatFileItems,
    selectedTools,
    setChatSettings,
    selectedHtmlElements,
    setResponseTimeToFirstToken,
    setResponseTimeTotal,
    setResponseTokensTotal,
    setRequestTokensTotal,
    setSelectedHtmlElements
  } = useContext(ChatbotUIChatContext)

  const chatInputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (window.top !== window.self) {
      return
    }
    if (!isPromptPickerOpen || !isFilePickerOpen || !isToolPickerOpen) {
      chatInputRef.current?.focus()
    }
  }, [isPromptPickerOpen, isFilePickerOpen, isToolPickerOpen])

  const handleNewChat = async (
    redirectTo = "",
    chatMessages: ChatMessage[] = []
  ) => {
    if (!selectedWorkspace) return

    setUserInput("")
    setChatMessages(chatMessages)
    setSelectedChat(null)
    setChatFileItems([])

    setIsGenerating(false)
    setFirstTokenReceived(false)

    setChatFiles([])
    setChatImages([])
    setNewMessageFiles([])
    setNewMessageImages([])
    setShowFilesDisplay(false)
    setIsPromptPickerOpen(false)
    setIsFilePickerOpen(false)
    setSelectedHtmlElements([])

    // setSelectedTools([])
    setToolInUse("none")

    if (selectedAssistant) {
      setChatSettings({
        model: selectedAssistant.model as LLMID,
        prompt: selectedAssistant.prompt,
        temperature: selectedAssistant.temperature,
        contextLength: selectedAssistant.context_length,
        includeProfileContext: selectedAssistant.include_profile_context,
        includeWorkspaceInstructions:
          selectedAssistant.include_workspace_instructions,
        embeddingsProvider: selectedAssistant.embeddings_provider as
          | "jina"
          | "openai"
          | "local"
      })

      let allFiles = []

      const assistantFiles = (
        await getAssistantFilesByAssistantId(selectedAssistant.id)
      ).files
      allFiles = [...assistantFiles]
      const assistantCollections = (
        await getAssistantCollectionsByAssistantId(selectedAssistant.id)
      ).collections
      for (const collection of assistantCollections) {
        const collectionFiles = (
          await getCollectionFilesByCollectionId(collection.id)
        ).files
        allFiles = [...allFiles, ...collectionFiles]
      }
      const assistantTools = (
        await getAssistantToolsByAssistantId(selectedAssistant.id)
      ).tools

      setSelectedTools(assistantTools)
      setChatFiles(
        allFiles.map(file => ({
          id: file.id,
          name: file.name,
          type: file.type,
          file: null
        }))
      )

      if (allFiles.length > 0) setShowFilesDisplay(true)
    } else if (selectedPreset) {
      setChatSettings({
        model: selectedPreset.model as LLMID,
        prompt: selectedPreset.prompt,
        temperature: selectedPreset.temperature,
        contextLength: selectedPreset.context_length,
        includeProfileContext: selectedPreset.include_profile_context,
        includeWorkspaceInstructions:
          selectedPreset.include_workspace_instructions,
        embeddingsProvider: selectedPreset.embeddings_provider as
          | "jina"
          | "openai"
          | "local"
      })
    }

    return router.push(redirectTo || `/chat`)
  }

  const handleFocusChatInput = () => {
    if (isMobileScreen()) {
      return
    }
    chatInputRef.current?.focus()
  }

  const handleStopMessage = () => {
    if (abortController) {
      abortController.abort()
    }
  }

  const handleSendMessage = async (
    messageContent: string,
    chatMessages: ChatMessage[],
    isRegeneration: boolean
  ) => {
    const startingInput = messageContent
    console.log("startingInput", startingInput)

    try {
      // Add this check at the beginning of the function
      if (profile?.plan.split("_")[0] === "free") {
        throw new Error("This feature is only available for paid plans.")
      }

      setUserInput("")
      setIsGenerating(true)
      setIsPromptPickerOpen(false)
      setIsFilePickerOpen(false)
      setNewMessageImages([])
      setSelectedHtmlElements([])

      const newAbortController = new AbortController()
      setAbortController(newAbortController)

      const modelData = allModels.find(
        llm =>
          llm.modelId === chatSettings?.model ||
          llm.hostedId === chatSettings?.model
      )

      validateChatSettings(
        chatSettings,
        modelData,
        profile,
        selectedWorkspace,
        messageContent,
        selectedAssistant,
        selectedTools
      )

      let currentChat = selectedChat ? { ...selectedChat } : null

      const b64Images = newMessageImages.map(image => image.base64)

      let retrievedFileItems: Tables<"file_items">[] = []

      if (
        (newMessageFiles.length > 0 || chatFiles.length > 0) &&
        useRetrieval
      ) {
        setToolInUse("retrieval")

        retrievedFileItems = await handleRetrieval(
          userInput,
          newMessageFiles,
          chatFiles,
          chatSettings!.embeddingsProvider,
          sourceCount
        )
      }

      const { tempUserChatMessage, tempAssistantChatMessage } =
        createTempMessages(
          messageContent,
          chatMessages,
          chatSettings!,
          b64Images,
          isRegeneration,
          setChatMessages,
          selectedAssistant,
          selectedHtmlElements.length > 0
            ? [{ selected_html_elements: selectedHtmlElements }]
            : []
        )

      let payload: ChatPayload = {
        chatSettings: chatSettings!,
        // workspaceInstructions: selectedWorkspace!.instructions || "",
        chatMessages: isRegeneration
          ? [...chatMessages]
          : [...chatMessages, tempUserChatMessage],
        assistant: selectedChat?.assistant_id ? selectedAssistant : null,
        messageFileItems: retrievedFileItems,
        chatFileItems: chatFileItems,
        messageHtmlElements: selectedHtmlElements
      }

      let generatedText = ""
      let data = null

      if (selectedTools.length > 0 && modelData!.tools) {
        ;({ generatedText, data } = await handleToolsChat(
          payload,
          profile!,
          tempAssistantChatMessage,
          isRegeneration,
          newAbortController,
          chatImages,
          setIsGenerating,
          setFirstTokenReceived,
          setChatMessages,
          setToolInUse,
          selectedTools,
          modelData!.supportsStreaming
        ))
      } else {
        if (modelData!.provider === "ollama") {
          ;({ generatedText, data } = await handleLocalChat(
            payload,
            profile!,
            chatSettings!,
            tempAssistantChatMessage,
            isRegeneration,
            newAbortController,
            setIsGenerating,
            setFirstTokenReceived,
            setChatMessages,
            setToolInUse
          ))
        } else {
          ;({ generatedText } = await handleHostedChat(
            payload,
            profile!,
            modelData!,
            tempAssistantChatMessage,
            isRegeneration,
            newAbortController,
            newMessageImages,
            chatImages,
            setIsGenerating,
            setFirstTokenReceived,
            setChatMessages,
            setToolInUse,
            setResponseTimeToFirstToken,
            setResponseTimeTotal,
            setResponseTokensTotal,
            setRequestTokensTotal
          ))
        }
      }

      if (!currentChat) {
        currentChat = await handleCreateChat(
          chatSettings!,
          profile!,
          selectedWorkspace!,
          messageContent,
          selectedAssistant!,
          newMessageFiles,
          selectedTools,
          setSelectedChat,
          setChats,
          setChatFiles,
          setSelectedTools
        )
      } else {
        const updatedChat = await updateChat(currentChat.id, {
          updated_at: new Date().toISOString()
        })

        setChats(prevChats => {
          const updatedChats = prevChats.map(prevChat =>
            prevChat.id === updatedChat.id ? updatedChat : prevChat
          )

          return updatedChats
        })
      }

      await handleCreateMessages(
        chatMessages,
        currentChat,
        profile!,
        modelData!,
        messageContent,
        generatedText,
        newMessageImages,
        isRegeneration,
        retrievedFileItems,
        setChatMessages,
        setChatFileItems,
        setChatImages,
        selectedAssistant,
        {},
        data
      )

      setIsGenerating(false)
      setFirstTokenReceived(false)
      // setUserInput("")
    } catch (error) {
      if (error instanceof SubscriptionRequiredError) {
        setIsPaywallOpen(true)
      } else if (
        error instanceof Error &&
        error.message === "This feature is only available for paid plans."
      ) {
        // Show a prominent dialog to the user
        return (
          <Dialog open={true}>
            <DialogContent>
              <DialogHeader>
                This feature is only available for paid plans. Please upgrade to
                continue.
              </DialogHeader>
            </DialogContent>
          </Dialog>
        )
      }
      console.error(error)
      setUserInput(startingInput)
    } finally {
      setIsGenerating(false)
      setFirstTokenReceived(false)
      setUserInput(startingInput)
    }
  }

  const handleSendEdit = async (
    editedContent: string,
    sequenceNumber: number
  ) => {
    if (!selectedChat) return

    await deleteMessagesIncludingAndAfter(
      selectedChat.user_id,
      selectedChat.id,
      sequenceNumber
    )

    const filteredMessages = chatMessages.filter(
      chatMessage => chatMessage.message.sequence_number < sequenceNumber
    )

    setChatMessages(filteredMessages)

    handleSendMessage(editedContent, filteredMessages, false)
  }

  return {
    chatInputRef,
    // prompt,
    handleNewChat,
    handleSendMessage,
    handleFocusChatInput,
    handleStopMessage,
    handleSendEdit
  }
}
