import { ChatbotUIContext } from "@/context/context"
import useHotkey from "@/lib/hooks/use-hotkey"
import { LLM_LIST } from "@/lib/models/llm/llm-list"
import { cn } from "@/lib/utils"
import { Tables } from "@/supabase/types"
import { updateProfile } from "@/db/profile"
import {
  IconSearch,
  IconBrain,
  IconCode,
  IconPaperclip,
  IconPlayerStopFilled,
  IconSend,
  IconMicrophone,
  IconPlayerRecordFilled,
  IconX,
  IconTools
} from "@tabler/icons-react"
import { IconAiSVG } from "@/components/icons/AI-icon-svg"
import { FC, useContext, useEffect, useRef, useState } from "react"
import { Input } from "../ui/input"
import { TextareaAutosize } from "../ui/textarea-autosize"
import { ChatCommandInput } from "./chat-command-input"
import { ChatFilesDisplay } from "./chat-files-display"
import { useChatHandler } from "./chat-hooks/use-chat-handler"
import { useChatHistoryHandler } from "./chat-hooks/use-chat-history"
import { usePromptAndCommand } from "./chat-hooks/use-prompt-and-command"
import { useSelectFileHandler } from "./chat-hooks/use-select-file-handler"
import { toast } from "sonner"
import { AssistantIcon } from "@/components/assistants/assistant-icon"
import { ChatbotUIChatContext } from "@/context/chat"
import { ChatSelectedHtmlElements } from "@/components/chat/chat-selected-html-elements"
import { ChatMessage } from "@/types"
import { useTranslation } from "react-i18next"
import { WebBrowseToggle } from "./web-browse-toggle"

interface ChatInputProps {
  showAssistant: boolean
  handleSendMessage?: (
    message: string,
    chatMessages: ChatMessage[],
    isUserMessage: boolean,
    systemPrompt?: string
  ) => void
}

export const ChatInput: FC<ChatInputProps> = ({
  showAssistant = true,
  handleSendMessage
}) => {
  useHotkey("l", () => {
    handleFocusChatInput()
  })

  const [isTyping, setIsTyping] = useState<boolean>(false)
  const [userInputBeforeRecording, setUserInputBeforeRecording] = useState("")
  const [transcript, setTranscript] = useState<string>("")
  const [recognition, setRecognition] = useState<any>(null)
  const [listening, setListening] = useState(false)
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | undefined>()
  const [rowCount, setRowCount] = useState(1)

  const {
    isAssistantPickerOpen,
    setIsAssistantPickerOpen,
    focusAssistant,
    setFocusAssistant,
    selectedPreset,
    selectedAssistant,
    setSelectedAssistant,
    focusPrompt,
    setFocusPrompt,
    focusFile,
    focusTool,
    setFocusTool,
    isToolPickerOpen,
    setIsToolPickerOpen,
    isPromptPickerOpen,
    setIsFilePickerOpen,
    setIsPromptPickerOpen,
    isFilePickerOpen,
    setFocusFile,
    profile,
    setProfile,
    selectedWorkspace,
    tools,
    selectedTools,
    setSelectedTools,
    allModels
  } = useContext(ChatbotUIContext)

  const { userInput, setUserInput, chatMessages, isGenerating, chatSettings } =
    useContext(ChatbotUIChatContext)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    chatInputRef,
    handleSendMessage: handleSendMessageInternal,
    handleStopMessage,
    handleFocusChatInput
  } = useChatHandler()

  if (!handleSendMessage) {
    handleSendMessage = handleSendMessageInternal
  }

  if (!handleSendMessage) {
    handleSendMessage = handleSendMessageInternal
  }

  const { handleInputChange: promptHandleInputChange, handleSelectAssistant } =
    usePromptAndCommand()

  const { filesToAccept, handleSelectDeviceFile, isUploading } =
    useSelectFileHandler()

  const {
    setNewMessageContentToNextUserMessage,
    setNewMessageContentToPreviousUserMessage
  } = useChatHistoryHandler()

  useEffect(() => {
    console.log("Initializing speech recognition...")
    if ("webkitSpeechRecognition" in window) {
      const recognition = new window.webkitSpeechRecognition()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = "en-US"

      recognition.onstart = () => {
        console.log("Speech recognition started")
        setListening(true)
      }

      recognition.onresult = (event: any) => {
        console.log("Speech recognition result received")
        const array: SpeechRecognitionResult[] = Array.from(event.results)
        const transcript = array
          .map((result: SpeechRecognitionResult) => result[0].transcript)
          .join("")
        setTranscript(transcript)
        console.log("Current transcript:", transcript)

        const isSilent = transcript.trim() === ""
        if (isSilent) {
          console.log("Silence detected, setting timeout")
          if (timeoutId) clearTimeout(timeoutId)
          setTimeoutId(
            setTimeout(() => {
              console.log("Stopping recognition due to silence")
              setTranscript("")
              if (recognition) recognition.stop()
            }, 30 * 1000)
          )
        } else {
          console.log("Speech detected, clearing timeout")
          if (timeoutId) clearTimeout(timeoutId)
        }
      }

      recognition.onend = (event: any) => {
        console.log("Speech recognition ended", event)
        setListening(false)
        if (event.error) {
          console.error("Speech recognition error:", event.error)
          toast.error(`Speech recognition error: ${event.error}`)
        } else if (transcript.trim() !== "") {
          console.log("Restarting recognition")
          startListening()
        }
      }

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error)
        toast.error(`Speech recognition error: ${event.error}`)
      }

      setRecognition(recognition)
    } else {
      console.warn("Speech recognition not supported in this browser")
      toast.error("Speech recognition is not supported in your browser")
    }

    setTimeout(() => {
      handleFocusChatInput()
    }, 200)
  }, [selectedPreset, selectedAssistant])

  useEffect(() => {
    if (listening) {
      console.log("Updating user input with transcript")
      setUserInput((userInputBeforeRecording + " " + transcript).trim())
    } else {
      console.log("Updating user input before recording")
      setUserInputBeforeRecording(userInput)
    }
  }, [listening, transcript, userInputBeforeRecording])

  function isSendShortcut(event: React.KeyboardEvent) {
    if (isGenerating) {
      return false
    }
    let shortcutPressed = event.key === "Enter" && !event.shiftKey
    if (profile?.send_message_on_enter === false) {
      shortcutPressed =
        event.key === "Enter" && (event.ctrlKey || event.metaKey)
    }
    return shortcutPressed
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!isTyping && isSendShortcut(event) && !isUploading) {
      event.preventDefault()
      setIsPromptPickerOpen(false)
      setTranscript("")
      setUserInputBeforeRecording("")
      handleSendMessage!(userInput, chatMessages, false)
    }

    if (
      isPromptPickerOpen ||
      isFilePickerOpen ||
      isToolPickerOpen ||
      isAssistantPickerOpen
    ) {
      if (
        event.key === "Tab" ||
        event.key === "ArrowUp" ||
        event.key === "ArrowDown"
      ) {
        event.preventDefault()
        if (isPromptPickerOpen) setFocusPrompt(!focusPrompt)
        if (isFilePickerOpen) setFocusFile(!focusFile)
        if (isToolPickerOpen) setFocusTool(!focusTool)
        if (isAssistantPickerOpen) setFocusAssistant(!focusAssistant)
      }
    }

    if (event.key === "ArrowUp" && event.shiftKey && event.ctrlKey) {
      event.preventDefault()
      setNewMessageContentToPreviousUserMessage()
    }

    if (event.key === "ArrowDown" && event.shiftKey && event.ctrlKey) {
      event.preventDefault()
      setNewMessageContentToNextUserMessage()
    }

    if (
      isAssistantPickerOpen &&
      (event.key === "Tab" ||
        event.key === "ArrowUp" ||
        event.key === "ArrowDown")
    ) {
      event.preventDefault()
      setFocusAssistant(!focusAssistant)
    }
  }

  const handlePaste = (event: React.ClipboardEvent) => {
    const imagesAllowed = LLM_LIST.find(
      llm =>
        llm.modelId === chatSettings?.model ||
        llm.hostedId === chatSettings?.model
    )?.imageInput

    const items = event.clipboardData.items
    for (const item of items) {
      if (item.type.indexOf("image") === 0) {
        if (!imagesAllowed) {
          toast.error(
            `Images are not supported for this model. Use models like GPT-4 Vision instead.`
          )
          return
        }
        const file = item.getAsFile()
        if (!file) return
        handleSelectDeviceFile(file)
      }
    }
  }

  const startListening = () => {
    if (recognition) {
      console.log("Starting speech recognition")
      setListening(true)
      recognition.start()
    } else {
      console.warn("Speech recognition not initialized")
      toast.error("Speech recognition is not initialized")
    }
  }

  const stopListening = () => {
    if (recognition) {
      console.log("Stopping speech recognition")
      if (timeoutId) clearTimeout(timeoutId)
      recognition.stop()
      setTranscript("")
      setListening(false)
    } else {
      console.warn("Speech recognition not initialized")
      toast.error("Speech recognition is not initialized")
    }
  }

  const restartListening = () => {
    if (!listening) {
      startListening()
    } else {
      console.log("Already listening, no need to restart")
    }
  }

  const { t } = useTranslation()

  const handleAiIconClick = () => {
    setIsAssistantPickerOpen(true)
  }

  // Renamed Custom Input Change Handler
  const handleCustomInputChange = (value: string) => {
    setUserInput(value)
    const lines = value.split("\n").length
    setRowCount(lines)
    // Integrate with the existing prompt handler if needed
    promptHandleInputChange(value)
  }

  const handleToggleCodeEditor = async () => {
    if (!profile) return

    const updatedProfile = await updateProfile(profile.id, {
      ...profile,
      experimental_code_editor: !profile.experimental_code_editor
    })

    setProfile(updatedProfile)
  }

  return (
    <div className="relative">
      <ChatFilesDisplay />
      <ChatCommandInput />
      <ChatSelectedHtmlElements />
      <div
        className={cn(
          "border-input bg-background/80 flex w-full flex-col justify-end overflow-hidden rounded-xl border shadow-sm backdrop-blur-sm",
          isGenerating && "animate-rainbow-border"
        )}
      >
        {showAssistant && selectedAssistant && (
          <div className="bg-accent/50 border-input flex items-center justify-between space-x-2 border-b px-4 py-2 backdrop-blur-sm">
            <div className="flex items-center space-x-2">
              <AssistantIcon assistant={selectedAssistant} size={24} />
              <span className="text-sm font-medium">
                {selectedAssistant.name}
              </span>
            </div>
            <IconX
              className="hover:bg-background/10 cursor-pointer rounded p-1 transition-colors"
              size={20}
              onClick={() => setSelectedAssistant(null)}
            />
          </div>
        )}

        <div className="flex w-full flex-col">
          <TextareaAutosize
            textareaRef={chatInputRef}
            className="w-full resize-none bg-transparent px-4 py-3 focus:outline-none"
            placeholder={t("Ask anything...")}
            onValueChange={handleCustomInputChange}
            value={userInput}
            minRows={1}
            maxRows={18}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            onCompositionStart={() => setIsTyping(true)}
            onCompositionEnd={() => setIsTyping(false)}
          />

          <div className="border-border/50 flex items-center justify-between border-t p-2">
            <div className="flex items-center gap-1">
              <button
                className="hover:bg-accent rounded-lg p-2 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <IconPaperclip size={20} className="text-muted-foreground" />
              </button>

              <WebBrowseToggle />

              <button
                className="hover:bg-accent rounded-lg p-2 transition-colors"
                onClick={handleAiIconClick}
              >
                <IconBrain size={20} className="text-muted-foreground" />
              </button>

              <div className="border-border/50 mx-2 h-6 border-l" />

              <button
                className={cn(
                  "hover:bg-accent flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-colors",
                  profile?.experimental_code_editor && "bg-accent"
                )}
                onClick={handleToggleCodeEditor}
              >
                <IconCode size={18} className="text-muted-foreground" />
                <span className="text-muted-foreground text-sm font-medium">
                  Code
                </span>
              </button>

              {recognition && (
                <button
                  onClick={listening ? stopListening : restartListening}
                  className="hover:bg-accent rounded-lg p-2 transition-colors"
                >
                  {listening ? (
                    <IconPlayerRecordFilled
                      size={20}
                      className="text-destructive animate-pulse"
                    />
                  ) : (
                    <IconMicrophone
                      size={20}
                      className="text-muted-foreground"
                    />
                  )}
                </button>
              )}
            </div>

            <button
              className={cn(
                "rounded-lg p-2 transition-colors",
                userInput && !isUploading
                  ? "text-primary hover:bg-primary/10"
                  : "text-muted-foreground/50 cursor-not-allowed"
              )}
              onClick={() => handleSendMessage!(userInput, chatMessages, false)}
            >
              {isGenerating ? (
                <IconPlayerStopFilled size={20} className="animate-pulse" />
              ) : (
                <IconSend size={20} />
              )}
            </button>
          </div>
        </div>

        <Input
          ref={fileInputRef}
          className="hidden"
          type="file"
          onChange={e => {
            if (!e.target.files) return
            handleSelectDeviceFile(e.target.files[0])
          }}
          accept={filesToAccept}
        />
      </div>
    </div>
  )
}
