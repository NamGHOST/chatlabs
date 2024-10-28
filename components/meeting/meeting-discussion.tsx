import { ChatbotUIContext } from "@/context/context"
import { MeetingParticipant, MeetingSetupType } from "@/types/meeting"
import { FC, useContext, useState, useRef } from "react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Card } from "../ui/card"
import { IconArrowRight, IconX } from "@tabler/icons-react"
import { useTranslation } from "react-i18next"
import { ModelIcon } from "../models/model-icon"
import { LLMID, ModelProvider } from "@/types"
import { toast } from "react-toastify"

interface Message {
  role: "user" | "assistant"
  content: string
  participantIndex: number
  senderName: string
}

interface MeetingDiscussionProps {
  setup: MeetingSetupType
  onEndMeeting: () => void
}

export const MeetingDiscussion: FC<MeetingDiscussionProps> = ({
  setup,
  onEndMeeting
}) => {
  const { t } = useTranslation()
  const { profile } = useContext(ChatbotUIContext)
  const [messages, setMessages] = useState<Message[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [currentTurn, setCurrentTurn] = useState(0)

  const currentParticipant =
    setup.participants[currentTurn % setup.participants.length]
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
            model: participant.llmId,
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

      return responseText
    } catch (error) {
      console.error("Error generating response:", error)
      toast.error("Failed to generate AI response")
      throw error
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">{setup.topic}</h2>
          <Button variant="ghost" onClick={onEndMeeting}>
            <IconX size={20} />
          </Button>
        </div>

        {/* Participant cards */}
        <div className="mt-4 flex gap-2 overflow-x-auto">
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
              <span>{participant.name}</span>
            </Card>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((message, index) => (
          <div key={index} className="mb-4">
            <div className="bg-muted rounded-lg p-3">
              <div className="text-sm font-semibold">{message.senderName}</div>
              <div className="mt-1 whitespace-pre-wrap">{message.content}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="border-t p-4">
        <div className="flex justify-center gap-2">
          {messages.length === 0 ? (
            <Button onClick={handleStartDiscussion} disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <span className="mr-2 animate-pulse">●</span>
                  {t("Generating...")}
                </>
              ) : (
                t("Start Discussion")
              )}
            </Button>
          ) : (
            <Button onClick={handleNextTurn} disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <span className="mr-2 animate-pulse">●</span>
                  {t("Generating...")}
                </>
              ) : (
                t("Next Turn")
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
