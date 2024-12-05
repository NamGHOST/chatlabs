import { ChatbotUIContext } from "@/context/context"
import { MeetingParticipant, MeetingSetupType } from "@/types/meeting"
import { FC, useContext, useState, useRef, useEffect, useMemo } from "react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Card } from "../ui/card"
import { IconArrowRight, IconX, IconChevronLeft } from "@tabler/icons-react"
import { useTranslation } from "react-i18next"
import { ModelIcon } from "../models/model-icon"
import { LLMID, ModelProvider } from "@/types"
import { toast } from "sonner"
import { v4 as uuidv4 } from "uuid"
import { cn } from "@/lib/utils"
import { MeetingSummaryDialog } from "./meeting-summary-dialog"
import { useDebounce } from "@/lib/hooks/use-debounce"

interface Message {
  role: "user" | "assistant"
  content: string
  participantIndex: number
  senderName: string
}

interface TypingState {
  participantIndex: number
  isTyping: boolean
}

interface MeetingDiscussionProps {
  setup: MeetingSetupType
  onEndMeeting: () => void
}

interface SavedMeeting {
  id: string
  topic: string
  participants: MeetingParticipant[]
  messages: Message[]
  createdAt: string
}

// Add a constant for minimum messages
const MIN_MESSAGES_FOR_SUMMARY = 10

export const MeetingDiscussion: FC<MeetingDiscussionProps> = ({
  setup,
  onEndMeeting
}) => {
  const { t } = useTranslation()
  const { profile } = useContext(ChatbotUIContext)
  const [messages, setMessages] = useState<Message[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [currentTurn, setCurrentTurn] = useState(0)
  const [typingStates, setTypingStates] = useState<TypingState[]>([])
  const [savedMeetings, setSavedMeetings] = useState<SavedMeeting[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [meetingSummary, setMeetingSummary] = useState<string | null>(null)
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false)
  const [userInput, setUserInput] = useState("")
  const [isSummaryDialogOpen, setIsSummaryDialogOpen] = useState(false)

  const currentParticipant = useMemo(
    () => setup.participants[currentTurn % setup.participants.length],
    [setup.participants, currentTurn]
  )
  const nextParticipant =
    setup.participants[(currentTurn + 1) % setup.participants.length]

  // Generate initial topic discussion
  const handleStartDiscussion = async () => {
    setIsGenerating(true)
    try {
      const response = await generateAIResponse(
        currentParticipant,
        setup.topic,
        null
      )

      setMessages([
        {
          role: "assistant",
          content: response,
          participantIndex: 0,
          senderName: currentParticipant.name
        }
      ])
      setCurrentTurn(1)
    } catch (error) {
      console.error("Error starting discussion:", error)
      toast.error("Failed to start discussion")
    } finally {
      setIsGenerating(false)
    }
  }

  // Generate response from next participant
  const handleNextTurn = async () => {
    setIsGenerating(true)
    try {
      const previousMessage = messages[messages.length - 1]

      const response = await generateAIResponse(
        nextParticipant,
        previousMessage.content,
        messages
      )

      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content: response,
          participantIndex: (currentTurn + 1) % setup.participants.length, // Fix: Use next participant's index
          senderName: nextParticipant.name
        }
      ])
      setCurrentTurn(prev => prev + 1)
    } catch (error) {
      console.error("Error generating response:", error)
      toast.error("Failed to generate response")
    } finally {
      setIsGenerating(false)
    }
  }

  // Simulate AI response generation (replace with actual API integration)
  const generateAIResponse = async (
    participant: MeetingParticipant,
    lastMessage: string,
    messageHistory: Message[] | null
  ): Promise<string> => {
    try {
      // Construct the conversation history and context
      let systemPrompt = ""

      if (messageHistory === null || messageHistory.length === 0) {
        systemPrompt = `You are ${participant.name} with the following role/characteristics: ${participant.prompt}
        
You are participating in a discussion about: ${setup.topic}

Provide a natural, conversational response that invites further discussion. Keep your response focused and engaging.
Respond in 2-3 sentences maximum.`
      } else {
        const conversationContext = messageHistory
          .map(msg => `${msg.senderName}: ${msg.content}`)
          .join("\n")

        systemPrompt = `You are ${participant.name} with the following role/characteristics: ${participant.prompt}

Topic of discussion: ${setup.topic}

Previous conversation:
${conversationContext}

Respond naturally to the previous message as your character would. Keep the conversation engaging and on topic.
Add your unique perspective based on your role. Respond in 2-3 sentences maximum.`
      }

      const response = await fetch("/api/chat/openrouter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          chatSettings: {
            model: "openai/gpt-4o-mini",
            temperature: 0.7,
            contextLength: 4096
          },
          messages: [
            {
              role: "system",
              content: systemPrompt
            },
            {
              role: "user",
              content: messageHistory === null ? setup.topic : lastMessage
            }
          ]
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to generate response")
      }

      // Handle streaming response
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let responseText = ""

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          responseText += chunk
        }
      }

      // Remove typing indicator
      setTypingStates(prev =>
        prev.filter(
          state => state.participantIndex !== participant.seatNumber - 1
        )
      )

      return responseText
    } catch (error) {
      if (error instanceof Error) {
        toast.error(`AI Response Error: ${error.message}`)
      } else {
        toast.error("Unknown error occurred")
      }
      throw error
    }
  }

  // Add this function to handle saving the meeting
  const handleSaveMeeting = async () => {
    try {
      const response = await fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: setup.topic,
          participants: setup.participants,
          messages
        })
      })

      if (!response.ok) {
        throw new Error("Failed to save meeting")
      }

      const savedMeeting = await response.json()
      setSavedMeetings(prev => [...prev, savedMeeting])
      toast.success("Meeting saved successfully!")
    } catch (error) {
      console.error("Error saving meeting:", error)
      toast.error("Failed to save meeting")
    }
  }

  const handleExportMeeting = (format: "txt" | "json" | "md") => {
    let content = ""
    const timestamp = new Date().toISOString().split("T")[0]
    let filename = `meeting-${setup.topic}-${timestamp}`

    if (format === "txt") {
      content = `Topic: ${setup.topic}\nDate: ${timestamp}\n\n`
      content += messages
        .map(msg => `${msg.senderName}: ${msg.content}`)
        .join("\n\n")
      filename += ".txt"
    } else if (format === "json") {
      content = JSON.stringify(
        {
          topic: setup.topic,
          date: timestamp,
          participants: setup.participants,
          messages
        },
        null,
        2
      )
      filename += ".json"
    } else if (format === "md") {
      content = `# Meeting: ${setup.topic}\nDate: ${timestamp}\n\n`
      content += setup.participants
        .map(p => `- ${p.name} (${p.llmId})`)
        .join("\n")
      content += "\n\n## Discussion\n\n"
      content += messages
        .map(msg => `### ${msg.senderName}\n${msg.content}\n`)
        .join("\n")
      filename += ".md"
    }

    const blob = new Blob([content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const generateMeetingSummary = async () => {
    if (messages.length === 0) return null

    // Detect language from messages (using the first message as reference)
    const firstMessage = messages[0].content
    const isChineseDiscussion = /[\u4e00-\u9fff]/.test(firstMessage)

    const summaryPrompt = isChineseDiscussion
      ? `請根據以下會議討論內容提供結構化總結：
話題：${setup.topic}

${messages.map(msg => `${msg.senderName}: ${msg.content}`).join("\n")}

請按以下結構組織總結：
# 會議總結

## 討論要點
[列出討論的主要內容]

## 主要結論
[列出達成的關鍵結論]

## 行動項目
[列出確定的任何行動項目或後續步驟]

## 一致/分歧之處
[列出參與者達成一致或存在分歧的觀點]

註：請根據討論內容在每個部分下提供具體要點。`
      : `Please provide a structured summary based on the language of this meeting discussion:
Topic: ${setup.topic}

${messages.map(msg => `${msg.senderName}: ${msg.content}`).join("\n")}

Please structure the summary with the following sections:
# Meeting Summary

## Key Points Discussed
[List the main points that were discussed]

## Main Conclusions
[List the key conclusions reached]

## Action Items
[List any action items or next steps identified]

## Areas of Agreement/Disagreement
[List points where participants agreed or disagreed]

Note: Please provide specific points under each section based on the discussion content.`

    try {
      const response = await fetch("/api/chat/openrouter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatSettings: {
            model: "openai/gpt-4o-mini",
            temperature: 0.7,
            contextLength: 4096
          },
          messages: [
            {
              role: "user",
              content: summaryPrompt
            }
          ]
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to generate summary")
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let summary = ""

      if (!reader) {
        throw new Error("Failed to get response reader")
      }

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        summary += decoder.decode(value)
      }

      return summary
    } catch (error) {
      console.error("Error generating summary:", error)
      toast.error("Failed to generate meeting summary")
      return null
    } finally {
      setIsGeneratingSummary(false)
    }
  }

  const handleUserMessage = async () => {
    if (!userInput.trim()) return

    // Add user message
    setMessages(prev => [
      ...prev,
      {
        role: "user",
        content: userInput,
        participantIndex: -1,
        senderName: "You"
      }
    ])
    setUserInput("")

    // Trigger AI response to user's message
    setIsGenerating(true)
    try {
      const response = await generateAIResponse(
        nextParticipant,
        userInput, // Pass user's input as the last message
        messages
      )

      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content: response,
          participantIndex: currentTurn % setup.participants.length,
          senderName: nextParticipant.name
        }
      ])
      setCurrentTurn(prev => prev + 1)
    } catch (error) {
      console.error("Error generating response:", error)
      toast.error("Failed to generate response")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleFullRound = async () => {
    setIsGenerating(true)
    try {
      // Get the current participant index
      const currentParticipantIndex = currentTurn % setup.participants.length

      // Get all remaining participants for this round
      const remainingParticipants = setup.participants.slice(
        currentParticipantIndex + 1
      ) // Start from next participant

      // Only generate responses for participants who haven't spoken in this round
      for (const participant of remainingParticipants) {
        const previousMessage = messages[messages.length - 1]

        const response = await generateAIResponse(
          participant,
          previousMessage.content,
          messages
        )

        setMessages(prev => [
          ...prev,
          {
            role: "assistant",
            content: response,
            participantIndex: participant.seatNumber - 1,
            senderName: participant.name
          }
        ])
        setCurrentTurn(prev => prev + 1)
      }
    } catch (error) {
      console.error("Error generating full round:", error)
      toast.error("Failed to generate full round of responses")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleViewSavedMeeting = (meeting: SavedMeeting) => {
    setMessages(meeting.messages)
    setCurrentTurn(meeting.messages.length)
    setShowHistory(false)
    toast.success("Loaded saved meeting")
  }

  // Add this function to handle deletion
  const handleDeleteMeeting = (meetingId: string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent triggering the card click
    const existingMeetings = JSON.parse(
      localStorage.getItem("savedMeetings") || "[]"
    ) as SavedMeeting[]
    const updatedMeetings = existingMeetings.filter(m => m.id !== meetingId)
    localStorage.setItem("savedMeetings", JSON.stringify(updatedMeetings))
    setSavedMeetings(updatedMeetings)
    toast.success("Meeting deleted")
  }

  useEffect(() => {
    const savedMeetingsData = localStorage.getItem("savedMeetings")
    if (savedMeetingsData) {
      setSavedMeetings(JSON.parse(savedMeetingsData))
    }
  }, [])

  const debouncedUserInput = useDebounce(userInput, 300)

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b p-4">
        <div className="mx-auto max-w-3xl">
          <div className="relative">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">{setup.topic}</h2>
              <div className="flex gap-2">
                {/* <Button variant="outline" onClick={handleSaveMeeting}>
                  Save Progress
                </Button> */}
                <Button
                  variant="outline"
                  onClick={() => handleExportMeeting("md")}
                >
                  Export
                </Button>
                <Button variant="ghost" onClick={onEndMeeting}>
                  <IconX size={20} />
                </Button>
              </div>
            </div>

            <Button
              variant="outline"
              size="icon"
              className="fixed right-0 top-1/2 -translate-y-1/2 rounded-l-lg rounded-r-none border-r-0"
              onClick={() => setShowHistory(!showHistory)}
            >
              <IconChevronLeft
                size={20}
                className={cn(
                  "transition-transform",
                  showHistory && "rotate-180"
                )}
              />
            </Button>
          </div>

          {/* Participant cards - now in a grid */}
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {setup.participants.map((participant, index) => (
              <Card
                key={index}
                className={`flex items-center gap-2 p-2 ${
                  index === currentTurn % setup.participants.length
                    ? "border-primary"
                    : ""
                }`}
              >
                <ModelIcon
                  modelId={participant.llmId as LLMID}
                  provider={
                    (participant.llmId as string).split("-")[0] as ModelProvider
                  }
                  height={20}
                  width={20}
                />
                <span className="truncate text-sm">{participant.name}</span>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Messages with max width */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="mx-auto max-w-3xl space-y-4">
          {messages.map((message, index) => (
            <div key={index} className="mb-4">
              <div className="bg-muted rounded-lg p-3">
                <div className="text-sm font-semibold">
                  {message.senderName}
                </div>
                <div className="mt-1 whitespace-pre-wrap">
                  {message.content}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="border-t p-4">
        <div className="mx-auto max-w-3xl">
          <div className="flex flex-col gap-4">
            {/* User input */}
            <div className="flex gap-2">
              <Input
                value={userInput}
                onChange={e => setUserInput(e.target.value)}
                placeholder="Join the discussion..."
                onKeyDown={e => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleUserMessage()
                  }
                }}
              />
              <Button
                onClick={handleUserMessage}
                disabled={isGenerating || !userInput.trim()}
              >
                Send
              </Button>
            </div>

            {/* AI Controls */}
            <div className="flex justify-center gap-2">
              {messages.length === 0 ? (
                <Button onClick={handleStartDiscussion} disabled={isGenerating}>
                  {isGenerating ? "Generating..." : "Start Discussion"}
                </Button>
              ) : (
                <>
                  <Button onClick={handleNextTurn} disabled={isGenerating}>
                    {isGenerating ? "Generating..." : "Next Turn"}
                  </Button>
                  <Button onClick={handleFullRound} disabled={isGenerating}>
                    Complete Round
                  </Button>
                  <Button
                    onClick={async () => {
                      if (messages.length < MIN_MESSAGES_FOR_SUMMARY) {
                        toast.error(
                          `At least ${MIN_MESSAGES_FOR_SUMMARY} messages are needed to generate a summary`
                        )
                        return
                      }
                      setIsGeneratingSummary(true)
                      const summary = await generateMeetingSummary()
                      if (summary) {
                        setMeetingSummary(summary)
                        setIsSummaryDialogOpen(true)
                      }
                      setIsGeneratingSummary(false)
                    }}
                    disabled={
                      isGeneratingSummary ||
                      messages.length < MIN_MESSAGES_FOR_SUMMARY
                    }
                  >
                    {isGeneratingSummary
                      ? "Generating Summary..."
                      : "Generate Summary"}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {showHistory && (
        <div className="bg-background fixed right-0 top-0 h-full w-80 border-l p-4 shadow-lg">
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b pb-4">
              <h3 className="text-lg font-semibold">Meeting History</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowHistory(false)}
              >
                <IconX size={16} />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto py-4">
              {savedMeetings.map(meeting => (
                <Card
                  key={meeting.id}
                  className="hover:bg-muted/50 relative mb-4 cursor-pointer p-3"
                  onClick={() => handleViewSavedMeeting(meeting)}
                >
                  <div className="text-sm font-medium">{meeting.topic}</div>
                  <div className="text-muted-foreground text-xs">
                    {new Date(meeting.createdAt).toLocaleString()}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-2 size-6"
                    onClick={e => handleDeleteMeeting(meeting.id, e)}
                  >
                    <IconX size={14} />
                  </Button>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}

      <MeetingSummaryDialog
        isOpen={isSummaryDialogOpen}
        onClose={() => setIsSummaryDialogOpen(false)}
        summary={meetingSummary}
        topic={setup.topic}
      />
    </div>
  )
}
