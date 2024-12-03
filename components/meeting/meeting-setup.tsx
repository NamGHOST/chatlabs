import { ChatbotUIContext } from "@/context/context"
import { LLMID } from "@/types"
import { MeetingParticipant, MeetingSetupType } from "@/types/meeting"
import { FC, useContext, useState, useEffect } from "react"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Button } from "../ui/button"
import { ModelIcon } from "../models/model-icon"
import { Card } from "../ui/card"
import {
  IconTrash,
  IconUserPlus,
  IconBook,
  IconClick,
  IconHistory,
  IconChevronLeft,
  IconX
} from "@tabler/icons-react"
import { useTranslation } from "react-i18next"
import { Textarea } from "../ui/textarea"
import { toast } from "sonner"
import { fetchOpenRouterModels } from "@/lib/models/fetch-models"
import { OpenRouterLLM } from "@/types"
import { ScrollArea } from "../ui/scroll-area"
import { cn } from "@/lib/utils"

const RECOMMENDED_MODELS = ["openai/gpt-4o-mini", "google/gemini-flash-1.5-8b"]
const DEFAULT_MODEL = "openai/gpt-4o-mini"

const PARTICIPANT_ROLES = {
  STRATEGIST: 1, // Strategic planning & analysis
  ETHICIST: 2, // Moral & ethical considerations
  EXPERT: 3, // Domain-specific knowledge
  ADVOCATE: 4, // Human-centric perspective
  RISK_ANALYST: 5, // Risk assessment & mitigation
  POLICY_ADVISOR: 6 // Regulatory & practical advice
} as const

const PRESET_SCENARIOS = [
  {
    id: "default",
    title: "Default",
    description: "A general purpose preset for any meeting scenario.",
    topic: "General Meeting Discussion",
    suggestedParticipants: []
  },
  {
    id: "brainstorming",
    title: "Brainstorming Session",
    description:
      "Encourage creative thinking and idea generation on a specific topic.",
    topic: "Brainstorming Session",
    suggestedParticipants: [
      PARTICIPANT_ROLES.ADVOCATE, // Leads creative thinking
      PARTICIPANT_ROLES.EXPERT, // Domain expertise
      PARTICIPANT_ROLES.STRATEGIST, // Strategic planning
      PARTICIPANT_ROLES.ETHICIST // Ethical considerations
    ]
  },
  {
    id: "startup-planning",
    title: "Startup Planning",
    description:
      "Develop a comprehensive plan for a new business, considering market analysis, financial projections, and operational strategies.",
    topic: "Startup Strategy & Market Analysis",
    suggestedParticipants: [
      PARTICIPANT_ROLES.STRATEGIST, // Leads strategic planning
      PARTICIPANT_ROLES.EXPERT, // Domain expertise
      PARTICIPANT_ROLES.RISK_ANALYST, // Risk assessment
      PARTICIPANT_ROLES.ADVOCATE // Human-centric perspective
    ]
  },
  {
    id: "financial-planning",
    title: "Financial Life Planning",
    description:
      "Develop comprehensive financial strategies considering investment, retirement, tax planning, and life goals.",
    topic: "Personal Financial Strategy & Life Goals",
    suggestedParticipants: [
      PARTICIPANT_ROLES.STRATEGIST, // Leads financial strategy
      PARTICIPANT_ROLES.RISK_ANALYST, // Risk management
      PARTICIPANT_ROLES.EXPERT, // Financial expertise
      PARTICIPANT_ROLES.ADVOCATE // Personal life balance
    ]
  },
  {
    id: "career-development",
    title: "Career Development",
    description:
      "Plan career growth, skill development, and work-life balance strategies for long-term success.",
    topic: "Career Growth & Professional Development Strategy",
    suggestedParticipants: [
      PARTICIPANT_ROLES.ADVOCATE, // Leads personal development
      PARTICIPANT_ROLES.STRATEGIST, // Career strategy
      PARTICIPANT_ROLES.EXPERT, // Industry insights
      PARTICIPANT_ROLES.POLICY_ADVISOR // Market trends
    ]
  },
  {
    id: "policy-debate",
    title: "Policy Analysis Forum",
    description:
      "Analyze complex policy issues from multiple perspectives, considering social, economic, and ethical implications.",
    topic: "Policy Impact Analysis & Recommendations",
    suggestedParticipants: [
      PARTICIPANT_ROLES.POLICY_ADVISOR, // Leads policy discussion
      PARTICIPANT_ROLES.ETHICIST, // Ethical implications
      PARTICIPANT_ROLES.EXPERT, // Domain expertise
      PARTICIPANT_ROLES.ADVOCATE // Social impact
    ]
  },
  {
    id: "life-decisions",
    title: "Life Decisions Council",
    description:
      "Navigate major life decisions with balanced perspectives on personal, professional, and social impacts.",
    topic: "Life Decision Analysis & Planning",
    suggestedParticipants: [
      PARTICIPANT_ROLES.ADVOCATE, // Leads personal perspective
      PARTICIPANT_ROLES.ETHICIST, // Values alignment
      PARTICIPANT_ROLES.STRATEGIST, // Practical planning
      PARTICIPANT_ROLES.RISK_ANALYST // Risk consideration
    ]
  },
  {
    id: "business-venture",
    title: "Business Venture Planning",
    description:
      "Evaluate and plan business opportunities considering market, financial, and operational aspects.",
    topic: "Business Opportunity Analysis & Strategy",
    suggestedParticipants: [
      PARTICIPANT_ROLES.STRATEGIST, // Leads business strategy
      PARTICIPANT_ROLES.EXPERT, // Market knowledge
      PARTICIPANT_ROLES.RISK_ANALYST, // Risk assessment
      PARTICIPANT_ROLES.POLICY_ADVISOR // Regulatory guidance
    ]
  },
  {
    id: "social-impact",
    title: "Social Impact Initiative",
    description:
      "Design and evaluate initiatives for positive social change and community impact.",
    topic: "Social Impact Strategy & Implementation",
    suggestedParticipants: [
      PARTICIPANT_ROLES.ETHICIST, // Leads impact discussion
      PARTICIPANT_ROLES.ADVOCATE, // Community perspective
      PARTICIPANT_ROLES.STRATEGIST, // Implementation strategy
      PARTICIPANT_ROLES.POLICY_ADVISOR // Policy alignment
    ]
  }
]

interface MeetingSetupProps {
  onStartMeeting: (setup: MeetingSetupType) => void
}

interface SavedMeeting {
  id: string
  topic: string
  participants: MeetingParticipant[]
  messages: Array<{
    role: "user" | "assistant"
    content: string
    participantIndex: number
    senderName: string
  }>
  createdAt: string
}

const getRoleName = (seatNumber: number): string => {
  switch (seatNumber) {
    case PARTICIPANT_ROLES.STRATEGIST:
      return "Strategic Planner"
    case PARTICIPANT_ROLES.ETHICIST:
      return "Ethics Advisor"
    case PARTICIPANT_ROLES.EXPERT:
      return "Domain Expert"
    case PARTICIPANT_ROLES.ADVOCATE:
      return "Human Advocate"
    case PARTICIPANT_ROLES.RISK_ANALYST:
      return "Risk Analyst"
    case PARTICIPANT_ROLES.POLICY_ADVISOR:
      return "Policy Advisor"
    default:
      return "Advisor"
  }
}

const sanitizeInput = (input: string) => {
  return input.trim().replace(/[<>]/g, "").replace(/[&'"]/g, "")
}

export const MeetingSetup: FC<MeetingSetupProps> = ({ onStartMeeting }) => {
  const { t } = useTranslation()
  const { profile, allModels } = useContext(ChatbotUIContext)

  const [topic, setTopic] = useState("")
  const [participants, setParticipants] = useState<MeetingParticipant[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [savedMeetings, setSavedMeetings] = useState<SavedMeeting[]>([])

  useEffect(() => {
    const savedMeetingsData = localStorage.getItem("savedMeetings")
    if (savedMeetingsData) {
      setSavedMeetings(JSON.parse(savedMeetingsData))
    }
  }, [])

  const getDefaultPrompt = (seatNumber: number) => {
    switch (seatNumber) {
      case 1: // STRATEGIST
        return "You are a strategic planning expert specializing in both organizational and personal strategy. Your role is to lead discussions on planning and execution, break down complex goals into actionable steps, and identify key opportunities and challenges. Focus on creating practical roadmaps that balance short-term achievements with long-term objectives. Always maintain a structured approach while considering resource allocation and timeline planning."

      case 2: // ETHICIST
        return "You are an ethics and values specialist who ensures decisions align with moral principles and stakeholder interests. Your role is to examine ethical implications, challenge assumptions, and promote sustainable, responsible choices. Consider societal impact, fairness, and long-term consequences while helping to balance competing values and interests. Guide discussions toward ethically sound solutions that respect all stakeholders."

      case 3: // EXPERT
        return "You are a versatile domain specialist who adapts expertise to the specific context (whether financial, business, career, or policy). Provide detailed technical knowledge and industry-specific insights while making complex concepts accessible. Share relevant case studies, best practices, and emerging trends. Focus on evidence-based approaches and practical applications of expert knowledge."

      case 4: // ADVOCATE
        return "You are a human-centered perspective champion who prioritizes individual and community wellbeing. Your role is to represent personal, emotional, and social considerations in decision-making. Ensure discussions maintain focus on human impact, quality of life, and sustainable relationships. Promote solutions that enhance personal growth and social harmony while considering practical implementation."

      case 5: // RISK_ANALYST
        return "You are a comprehensive risk assessment specialist focusing on identifying and evaluating potential challenges across multiple dimensions (financial, operational, personal, social). Analyze uncertainties, develop mitigation strategies, and propose contingency plans. Help balance opportunities with risks while ensuring robust decision-making through scenario planning and systematic risk evaluation."

      case 6: // POLICY_ADVISOR
        return "You are a practical implementation expert with deep understanding of systems, regulations, and real-world constraints. Your role is to ensure solutions are feasible within existing frameworks while identifying potential policy or regulatory challenges. Provide guidance on navigating institutional requirements and suggest practical approaches to implementation that consider both compliance and efficiency."

      default:
        return "You are a thoughtful advisor with broad experience. Share balanced perspectives while considering practical, personal, and social implications of decisions."
    }
  }

  const handleAddParticipant = () => {
    if (participants.length < 6) {
      const seatNumber = participants.length + 1
      const roleName = getRoleName(seatNumber)
      setParticipants([
        ...participants,
        {
          seatNumber,
          llmId: DEFAULT_MODEL,
          name: roleName,
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

  const handleSelectPreset = (preset: (typeof PRESET_SCENARIOS)[0]) => {
    setTopic(preset.topic)

    // Create participants based on suggested seats
    const newParticipants = preset.suggestedParticipants.map(seatNumber => ({
      seatNumber,
      llmId: DEFAULT_MODEL,
      name: getRoleName(seatNumber),
      prompt: getDefaultPrompt(seatNumber)
    }))

    setParticipants(newParticipants as MeetingParticipant[])
  }

  const handleLoadMeeting = (meeting: SavedMeeting) => {
    setTopic(meeting.topic)
    setParticipants(meeting.participants)
    setShowHistory(false)
    toast.success("Loaded saved meeting configuration")
  }

  const handleDeleteMeeting = (meetingId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const existingMeetings = JSON.parse(
      localStorage.getItem("savedMeetings") || "[]"
    ) as SavedMeeting[]
    const updatedMeetings = existingMeetings.filter(m => m.id !== meetingId)
    localStorage.setItem("savedMeetings", JSON.stringify(updatedMeetings))
    setSavedMeetings(updatedMeetings)
    toast.success("Meeting deleted")
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b p-4">
        <div className="mx-auto max-w-3xl">
          <div className="relative">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">{t("Setup AI Meeting")}</h2>
              <Button
                variant="ghost"
                onClick={() => setShowHistory(!showHistory)}
              >
                <IconHistory size={20} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex h-full">
        {/* Preset scenarios sidebar */}
        <div className="w-72 border-r p-4">
          <div className="mb-4">
            <h2 className="flex items-center text-lg font-semibold">
              <IconBook className="mr-2" size={20} />
              {t("Preset Scenarios")}
            </h2>
          </div>

          <ScrollArea className="h-[calc(100vh-200px)]">
            <div className="space-y-3">
              {PRESET_SCENARIOS.map(preset => (
                <Card
                  key={preset.id}
                  className="hover:bg-accent cursor-pointer transition-colors"
                  onClick={() => handleSelectPreset(preset)}
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">{preset.title}</h3>
                      <IconClick size={16} className="text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground mt-2 text-sm">
                      {preset.description}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {preset.suggestedParticipants.map(seat => (
                        <span
                          key={seat}
                          className="bg-primary/10 rounded-full px-2 py-1 text-xs"
                        >
                          {getRoleName(seat)}
                        </span>
                      ))}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Setup form */}
        <div className="flex-1 p-4">
          <div className="mx-auto max-w-4xl space-y-6 p-4">
            <div className="space-y-4">
              <h1 className="text-2xl font-bold">{t("Setup AI Meeting")}</h1>

              <div className="space-y-2">
                <Label>{t("Meeting Topic")}</Label>
                <Input
                  value={topic}
                  onChange={e => setTopic(sanitizeInput(e.target.value))}
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
                      <Label>{participant.name}</Label>
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
                          value={participant.llmId || DEFAULT_MODEL}
                          onChange={e => {
                            const newParticipants = [...participants]
                            newParticipants[index].llmId = e.target
                              .value as LLMID
                            setParticipants(newParticipants)
                          }}
                        >
                          <option value="openai/gpt-4o-mini">
                            ⭐ GPT-4o Mini
                          </option>
                          <option value="google/gemini-flash-1.5-8b">
                            ⚡ Gemini Flash
                          </option>
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
                !topic ||
                participants.length < 2 ||
                participants.some(p => !p.llmId)
              }
            >
              {t("Start Meeting")}
            </Button>
          </div>
        </div>

        {/* History sidebar */}
        {showHistory && (
          <div className="bg-background fixed right-0 top-0 h-full w-80 border-l p-4 shadow-lg">
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between border-b pb-4">
                <h3 className="text-lg font-semibold">
                  {t("Meeting History")}
                </h3>
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
                    onClick={() => handleLoadMeeting(meeting)}
                  >
                    <div className="text-sm font-medium">{meeting.topic}</div>
                    <div className="text-muted-foreground text-xs">
                      {new Date(meeting.createdAt).toLocaleString()}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-2 size-6"
                      onClick={(e: React.MouseEvent) =>
                        handleDeleteMeeting(meeting.id, e)
                      }
                    >
                      <IconX size={14} />
                    </Button>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
