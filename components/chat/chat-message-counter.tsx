import { ChatbotUIContext } from "@/context/context"
import { useContext, useEffect, useState } from "react"
import {
  FREE_MESSAGE_DAILY_LIMIT,
  LITE_MESSAGE_DAILY_LIMIT,
  LITE_PRO_WHITELIST_DAILY_LIMIT,
  LITE_MESSAGE_MONTHLY_LIMIT,
  LITE_PRO_MONTHLY_LIMIT,
  PRO_MESSAGE_MONTHLY_LIMIT,
  PRO_ULTIMATE_MESSAGE_DAILY_LIMIT,
  PRO_ULTIMATE_MESSAGE_MONTHLY_LIMIT,
  ULTIMATE_MESSAGE_DAILY_LIMIT,
  ULTIMATE_MESSAGE_MONTHLY_LIMIT,
  isUsingOwnKey
} from "@/lib/subscription"
import { getMessageCountForTier } from "@/db/messages"
import { Button } from "@/components/ui/button"
import { ChatbotUIChatContext } from "@/context/chat"
import { LLM_LIST } from "@/lib/models/llm/llm-list"
import { tr } from "date-fns/locale"
import { useTranslation } from "react-i18next"
import { Zap } from "lucide-react"

interface ChatMessageCounterProps {}

const ChatMessageCounter: React.FC<ChatMessageCounterProps> = () => {
  const { profile, setIsPaywallOpen } = useContext(ChatbotUIContext)
  const { isGenerating, chatSettings } = useContext(ChatbotUIChatContext)
  const [messageCount, setMessageCount] = useState(0)
  const { t } = useTranslation()

  useEffect(() => {
    if (!profile || !chatSettings?.model) {
      return
    }

    const fetchMessageCount = async () => {
      try {
        const modelData = LLM_LIST.find(
          x =>
            x.modelId === chatSettings.model ||
            x.hostedId === chatSettings.model
        )
        const tier = modelData?.tier || "free"
        const provider = modelData?.provider

        const count = await getMessageCountForTier(
          profile.user_id,
          tier,
          userPlan,
          provider,
          profile.subscription_start_date || undefined
        )
        setMessageCount(count)
      } catch (error) {
        console.error(error)
      }
    }
    fetchMessageCount()
  }, [profile, isGenerating, chatSettings])

  if (!profile || !chatSettings?.model) {
    return null
  }

  const userPlan = profile.plan.split("_")[0]
  const modelData = LLM_LIST.find(
    x => x.modelId === chatSettings.model || x.hostedId === chatSettings.model
  )
  const modelTier = modelData?.tier

  let limit = process.env.NEXT_PUBLIC_FREE_MESSAGE_DAILY_LIMIT
    ? parseInt(process.env.NEXT_PUBLIC_FREE_MESSAGE_DAILY_LIMIT)
    : FREE_MESSAGE_DAILY_LIMIT

  let showCounter = true

  // we should not show the counter for pro users created before 2024-09-16 and using opus models
  const isProGrandfathered =
    userPlan === "pro" &&
    profile.created_at < "2024-09-16" &&
    modelData?.modelId?.includes("opus")

  if (userPlan === "ultimate") {
    if (modelTier === "ultimate") {
      limit = ULTIMATE_MESSAGE_MONTHLY_LIMIT
    }
  } else if (userPlan === "pro") {
    if (modelTier === "ultimate") {
      limit = PRO_ULTIMATE_MESSAGE_MONTHLY_LIMIT
    }
  }

  if (userPlan === "pro") {
    if (modelTier === "pro") {
      limit = PRO_MESSAGE_MONTHLY_LIMIT
    }
    showCounter = false
  }
  if (modelTier === "free") {
    showCounter = false
  }
  if (modelTier === "ultimate") {
    showCounter = true
  }

  if (userPlan === "lite") {
    if (modelTier === "pro") {
      limit = LITE_PRO_MONTHLY_LIMIT
    } else {
      showCounter = false
    }
    if (modelTier === "free") {
      limit = LITE_MESSAGE_MONTHLY_LIMIT
      showCounter = false
    }
  }

  if (userPlan === "free") {
    if (modelTier === "free") {
      limit = FREE_MESSAGE_DAILY_LIMIT
      showCounter = true
    }
  }

  // BYOK users have unlimited messages
  if (userPlan === "byok") {
    showCounter = false
    return null
  }

  if (!showCounter) {
    return null
  }

  return (
    <div className="variant-outline flex justify-end p-2">
      <button
        className="relative flex h-8 w-auto items-center justify-center rounded-full border border-purple-200 bg-gradient-to-r from-purple-300 to-blue-500 px-1.5 transition-all hover:border-pink-200 hover:from-purple-100 hover:to-pink-100"
        onClick={() => setIsPaywallOpen(true)}
      >
        <span className="mr-1 font-light text-black">
          <span className="text-xs">{limit - messageCount}</span>
          <span className="text-[10px]">/{limit}</span>
        </span>
        <Zap
          className="h-6 w-4 text-yellow-400"
          fill="currentColor"
          strokeWidth={0}
        />
      </button>
    </div>
  )
}

export { ChatMessageCounter }
///<Badge variant="outline" className="relative overflow-hidden">
//<span className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-600 opacity-10"></span>
//<span className="relative bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
//{model.tier}
///</span>
///</Badge>
