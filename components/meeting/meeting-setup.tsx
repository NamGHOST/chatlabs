import { ChatbotUIContext } from "@/context/context"
import { LLMID } from "@/types"
import { MeetingParticipant, MeetingSetupType } from "@/types/meeting"
import { FC, useContext, useState, useEffect } from "react"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Button } from "../ui/button"
import { ModelIcon } from "../models/model-icon"
import { Card } from "../ui/card"
import { IconTrash, IconUserPlus } from "@tabler/icons-react"
import { useTranslation } from "react-i18next"
import { Textarea } from "../ui/textarea"
import { toast } from "sonner"
import { fetchOpenRouterModels } from "@/lib/models/fetch-models"
import { OpenRouterLLM } from "@/types"

const RECOMMENDED_MODELS = [
  "anthropic/claude-3.5-sonnet",
  "openai/gpt-4o-mini",
  "mistralai/mixtral-8x22b-instruct",
  "google/gemini-pro-1.5"
]

interface MeetingSetupProps {
  onStartMeeting: (setup: MeetingSetupType) => void
}

export const MeetingSetup: FC<MeetingSetupProps> = ({ onStartMeeting }) => {
  const { t } = useTranslation()
  const { profile, allModels } = useContext(ChatbotUIContext)

  const [topic, setTopic] = useState("")
  const [participants, setParticipants] = useState<MeetingParticipant[]>([])
  const [availableModels, setAvailableModels] = useState<OpenRouterLLM[]>([])

  useEffect(() => {
    let mounted = true

    const loadModels = async () => {
      try {
        const models = await fetchOpenRouterModels()
        if (mounted) {
          setAvailableModels(models)
        }
      } catch (error) {
        if (mounted) {
          console.error("Error loading models:", error)
          toast.error(t("Failed to load available models"))
        }
      }
    }

    loadModels()

    // Cleanup function
    return () => {
      mounted = false
    }
  }, [])

  const getDefaultPrompt = (seatNumber: number) => {
    if (seatNumber === 1) {
      return "You are an AI expert with a focus on current developments. Be informative but conversational. Engage with others' viewpoints while maintaining a balanced and knowledgeable perspective about AI technology and its current state."
    }
    if (seatNumber === 2) {
      return "You are a technology ethicist who considers the societal implications of AI. Provide thoughtful responses that focus on ethical considerations, potential impacts on society, and the importance of responsible AI development."
    }
    return "You are an AI researcher with unique perspectives. Share insights about AI development while considering both technical and practical implications."
  }

  const handleAddParticipant = () => {
    if (participants.length < 6) {
      const seatNumber = participants.length + 1
      setParticipants([
        ...participants,
        {
          seatNumber,
          llmId: null,
          name: `AI Participant ${seatNumber}`,
          prompt: getDefaultPrompt(seatNumber)
        }
      ])
    }
  }

  const handleRemoveParticipant = (index: number) => {
    setParticipants(participants.filter((_, i) => i !== index))
  }

  const handleStartMeeting = () => {
    // Validate that we have at least 2 participants with models selected
    if (participants.length < 2 || participants.some(p => !p.llmId)) {
      toast.error(t("Please add at least 2 participants with models selected"))
      return
    }

    // Sort participants by seat number to ensure proper turn order
    const sortedParticipants = [...participants].sort(
      (a, b) => a.seatNumber - b.seatNumber
    )

    onStartMeeting({
      topic,
      participants: sortedParticipants, // Use sorted participants
      currentTurn: 0,
      isActive: true
    })
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4">
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">{t("Setup AI Meeting")}</h1>

        <div className="space-y-2">
          <Label>{t("Meeting Topic")}</Label>
          <Input
            value={topic}
            onChange={e => setTopic(e.target.value)}
            placeholder={t("Enter meeting topic...")}
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>{t("Participants")}</Label>
          <Button
            onClick={handleAddParticipant}
            disabled={participants.length >= 6}
            variant="outline"
            size="sm"
          >
            <IconUserPlus className="mr-2" size={16} />
            {t("Add Participant")}
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {participants.map((participant, index) => (
            <Card key={index} className="p-4">
              <div className="flex justify-between">
                <Label>Seat {participant.seatNumber}</Label>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveParticipant(index)}
                >
                  <IconTrash size={16} />
                </Button>
              </div>

              <div className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label>{t("AI Model")}</Label>
                  <select
                    className="w-full rounded-md border p-2"
                    value={participant.llmId || ""}
                    onChange={e => {
                      const newParticipants = [...participants]
                      newParticipants[index].llmId = e.target.value as LLMID
                      setParticipants(newParticipants)
                    }}
                  >
                    <option value="">{t("Select Model")}</option>
                    {availableModels
                      .sort((a, b) => {
                        // Put recommended models first
                        const aRecommended = RECOMMENDED_MODELS.includes(
                          a.modelId
                        )
                        const bRecommended = RECOMMENDED_MODELS.includes(
                          b.modelId
                        )
                        if (aRecommended && !bRecommended) return -1
                        if (!aRecommended && bRecommended) return 1
                        return 0
                      })
                      .map(model => (
                        <option key={model.modelId} value={model.modelId}>
                          {RECOMMENDED_MODELS.includes(model.modelId)
                            ? "⭐ "
                            : ""}
                          {model.modelName}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>{t("Name")}</Label>
                  <Input
                    value={participant.name}
                    onChange={e => {
                      const newParticipants = [...participants]
                      newParticipants[index].name = e.target.value
                      setParticipants(newParticipants)
                    }}
                    placeholder={t("Enter name...")}
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t("Role/Prompt")}</Label>
                  <Textarea
                    value={participant.prompt}
                    onChange={e => {
                      const newParticipants = [...participants]
                      newParticipants[index].prompt = e.target.value
                      setParticipants(newParticipants)
                    }}
                    placeholder={t("Describe the role...")}
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <Button
        className="w-full"
        onClick={handleStartMeeting}
        disabled={
          !topic || participants.length < 2 || participants.some(p => !p.llmId)
        }
      >
        {t("Start Meeting")}
      </Button>
    </div>
  )
}
