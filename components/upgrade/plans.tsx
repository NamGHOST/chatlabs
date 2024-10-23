import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  IconX,
  IconSparkles,
  IconKey,
  IconRobot,
  IconLayout2,
  IconBooks,
  IconFileDescription,
  IconCircleDashed,
  IconGlobe,
  IconPhoto,
  IconShield,
  IconChevronDown,
  IconChevronUp
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { PlanFeature } from "@/components/upgrade/plan-picker"
import { useContext, useState, useRef, useEffect, useCallback } from "react"
import { ChatbotUIContext } from "@/context/context"
import { supabase } from "@/lib/supabase/browser-client"
import { createCheckoutSession } from "@/actions/stripe"
import { Badge } from "@/components/ui/badge"
import { useTranslation } from "react-i18next"
import Link from "next/link"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const BYOK_PLAN_PREFIX = "byok"
const PRO_PLAN_PREFIX = "pro"
const LITE_PLAN_PREFIX = "lite"
const ULTIMATE_PLAN_PREFIX = "ultimate"
const BILLING_CYCLE_YEARLY = "yearly"
const BILLING_CYCLE_MONTHLY = "monthly"

type BILLING_CYCLE = typeof BILLING_CYCLE_YEARLY | typeof BILLING_CYCLE_MONTHLY

interface PlansProps {
  onClose: () => void
  showCloseIcon: boolean
}

export default function Plans({ onClose, showCloseIcon }: PlansProps) {
  const { profile } = useContext(ChatbotUIContext)

  const [billingCycle, setBillingCycle] =
    useState<BILLING_CYCLE>(BILLING_CYCLE_YEARLY)

  const handleBillingCycleChange = (value: string) => {
    if (value === BILLING_CYCLE_YEARLY || value === BILLING_CYCLE_MONTHLY) {
      setBillingCycle(value)
    } else {
      console.error("Invalid billing cycle selected:", value)
      setBillingCycle(BILLING_CYCLE_YEARLY)
    }
  }

  const [loading, setLoading] = useState("")
  const [isDialogVisible, setIsDialogVisible] = useState(true)
  const [isCollapsibleOpen, setIsCollapsibleOpen] = useState(false)

  const [expandedFeatures, setExpandedFeatures] = useState<
    Record<string, boolean>
  >({})

  const toggleFeatureExpansion = useCallback(
    (planPrefix: string, featureTitle: string) => {
      setExpandedFeatures(prev => ({
        ...prev,
        [`${planPrefix}-${featureTitle}`]:
          !prev[`${planPrefix}-${featureTitle}`]
      }))
    },
    []
  )

  const formAction = async (data: FormData): Promise<void> => {
    try {
      const user = (await supabase.auth.getUser()).data.user

      if (!user) {
        return window.location.assign("/login")
      }

      data.set("email", user?.email as string)
      data.set("userId", user?.id)

      const { url } = await createCheckoutSession(data)

      window.location.assign(url as string)
    } catch (error) {
      setLoading("")
      toast.error(
        "Failed to upgrade plan. Something went wrong. Please try again."
      )
      console.error(error)
    }
  }

  function createFormAction(plan_prefix: string) {
    return async (data: FormData) => {
      const plan = `${plan_prefix}_${billingCycle}`
      console.log("Selected plan:", plan)
      data.set("plan", plan)
      await formAction(data)
      setLoading("") // Clear loading state after form action completes
    }
  }

  const handleClick = useCallback(
    (plan: string) => {
      const event = `click_${plan}_${billingCycle}`
      window.gtag?.("event", event)
      window.dataLayer?.push({ event })
      setLoading(plan)
    },
    [billingCycle]
  )

  const closeDialog = useCallback(() => {
    setIsDialogVisible(false)
    onClose()
  }, [onClose])

  const toggleCollapsible = useCallback(() => {
    setIsCollapsibleOpen(prev => !prev)
  }, [])

  const [isAdvancedFeaturesExpanded, setIsAdvancedFeaturesExpanded] =
    useState(false)

  const toggleAdvancedFeatures = useCallback(() => {
    setIsAdvancedFeaturesExpanded(prev => !prev)
  }, [])

  const FeatureGroup = ({
    icon,
    className,
    title,
    children
  }: {
    icon: React.ReactNode
    className?: string
    title: string
    children: React.ReactNode
  }) => {
    return (
      <div className={cn("mb-2", className)}>
        <div className="mb-2 flex items-center">
          {icon}
          <span className="ml-2 font-semibold">{title}</span>
        </div>
        {children}
      </div>
    )
  }
  const { t } = useTranslation()

  const PlanColumn = ({
    title,
    monthlyPrice,
    yearlyPrice,
    features,
    planPrefix
  }: {
    title: string
    monthlyPrice: string
    yearlyPrice: string
    features: any[]
    planPrefix: string
  }) => (
    <div className="border-token-border-light relative flex flex-1 flex-col gap-5 border-t p-4 text-sm last:border-r-0 md:max-w-xs md:border-r md:border-t-0">
      <div className="bg-token-main-surface-primary relative flex flex-col">
        <div className="flex flex-col gap-1">
          <p className="text-xl font-semibold">{title}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-xl font-semibold">
              {billingCycle === "yearly" ? yearlyPrice : monthlyPrice} HKD
            </p>
            {billingCycle === "yearly" && (
              <p className="text-foreground/50 line-through">
                {monthlyPrice} HKD
              </p>
            )}
          </div>
          <p className="text-foreground/50 text-sm">
            {billingCycle === "yearly"
              ? `per month, billed annually (${parseFloat(yearlyPrice) * 12} HKD/year)`
              : "per month"}
          </p>
        </div>
      </div>
      <Button
        disabled={loading !== "" && loading !== planPrefix}
        loading={loading === planPrefix}
        onClick={async () => {
          handleClick(planPrefix)
          const formData = new FormData()
          await createFormAction(planPrefix)(formData)
        }}
        data-testid={`select-plan-button-${planPrefix}-create`}
        className="bg-violet-700 text-white hover:bg-white hover:text-violet-700 hover:outline hover:outline-violet-700"
      >
        {t("Upgrade NOW")}
      </Button>
      <div className="flex grow flex-col gap-2">
        <FeatureGroup icon={<IconRobot size={20} />} title={t("AI Models")}>
          {features
            .find(f => f.title === t("AI Models"))
            ?.items.map((item: string, index: number) => (
              <PlanFeature key={index} title={item} />
            ))}
        </FeatureGroup>
        <FeatureGroup
          icon={<IconPhoto size={20} />}
          title={t("Image Generation")}
        >
          {features
            .find(f => f.title === t("Image Generation"))
            ?.items.map((item: string, index: number) => (
              <PlanFeature key={index} title={item} />
            ))}
        </FeatureGroup>
        <FeatureGroup
          icon={<IconKey size={20} />}
          title={t("ImogenAI API Key Hub")}
        >
          {features
            .find(f => f.title === t("ImogenAI API Key Hub"))
            ?.items.map((item: string, index: number) => (
              <PlanFeature key={index} title={item} />
            ))}
        </FeatureGroup>
        <div className="mb-2">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center">
              <IconSparkles size={20} />
              <span className="ml-2 font-semibold">
                {t("Advanced Features")}
              </span>
            </div>
            <button
              onClick={toggleAdvancedFeatures}
              className="text-gray-500 hover:text-gray-700"
            >
              {isAdvancedFeaturesExpanded ? (
                <IconChevronUp size={20} />
              ) : (
                <IconChevronDown size={20} />
              )}
            </button>
          </div>
          {isAdvancedFeaturesExpanded && (
            <>
              {features
                .filter(
                  f =>
                    ![
                      t("AI Models"),
                      t("Image Generation"),
                      t("ImogenAI API Key Hub")
                    ].includes(f.title)
                )
                .map((feature, index) => (
                  <FeatureGroup
                    key={index}
                    icon={feature.icon}
                    title={feature.title}
                  >
                    {feature.items.map((item: string, itemIndex: number) => (
                      <PlanFeature key={itemIndex} title={item} />
                    ))}
                  </FeatureGroup>
                ))}
            </>
          )}
        </div>
      </div>
    </div>
  )

  const liteFeatures = [
    {
      icon: <IconRobot size={20} />,
      title: t("AI Models"),
      items: [
        t("Standard models: 5000 requests"),
        t("GPT-4o mini, Claude 3 Haiku and more"),
        t("Pro models: 250 requests"),
        t("Limited time offer: Access to OpenAI: O1mini, GPT 4o ,X-AI Grok2")
      ]
    },
    {
      icon: <IconPhoto size={20} />,
      title: t("Image Generation"),
      items: [t("Powered by Stable Diffusion")]
    },
    {
      icon: <IconKey size={20} />,
      title: t("ImogenAI API Key Hub"),
      items: [t("Connect to OpenAI, Anthropic, Google Gemini, and more")]
    },
    {
      items: [
        t("Artifact side by side code editor"),
        t("Share generated app online"),
        t("AI-powered customizable assistant"),
        t("AI model Arena"),
        t("Translation, email replies, reports, grammar checks"),
        t("AI web search"),
        t("Support for specified search sources"),
        t("Unlimited AI summaries"),
        t("Scan webpages, YouTube videos, or files")
      ]
    },
    {
      icon: <IconFileDescription size={20} />,
      title: t("ChatFiles"),
      items: [
        t(
          "File summaries, smart Q&A, file translation, multi-language translation, extended PDF reading, batch translation, etc."
        )
      ]
    },
    {
      icon: <IconShield size={20} />,
      title: t("Supported Devices"),
      items: [
        t("Chrome / Edge / Safari, iOS, Mac, Android and Windows"),
        t("Optimized for all devices")
      ]
    },
    {
      icon: <IconSparkles size={20} />,
      title: t("Other Benefits"),
      items: [t("Priority CS support"), t("VIP group access")]
    }
  ]

  const proFeatures = [
    {
      icon: <IconRobot size={20} />,
      title: t("AI Models"),
      items: [
        t("Standard models: Unlimited requests"),
        t("GPT-4o mini, Claude 3 Haiku and more"),
        t("Pro models: 500 requests"),
        t("Ultimate models: Limited access to OpenAI: O1")
      ]
    },
    {
      icon: <IconPhoto size={20} />,
      title: t("Image Generation"),
      items: [t("Powered by Flux Pro 1.1")]
    },
    {
      icon: <IconKey size={20} />,
      title: t("ImogenAI API Key Hub"),
      items: [t("Connect to OpenAI, Anthropic, Google Gemini, and more")]
    },
    {
      items: [
        t("Artifact side by side code editor"),
        t("Share generated app online"),
        t("AI-powered customizable assistant"),
        t("AI model Arena"),
        t("Translation, email replies, reports, grammar checks"),
        t("AI web search"),
        t("Unlimited AI summaries"),
        t("Scan webpages, YouTube videos, or files")
      ]
    },
    {
      icon: <IconFileDescription size={20} />,
      title: t("ChatFiles"),
      items: [
        t(
          "File summaries, smart Q&A, file translation, multi-language translation, extended PDF reading, batch translation, etc."
        )
      ]
    },
    {
      icon: <IconShield size={20} />,
      title: t("Supported Devices"),
      items: [
        t("Chrome / Edge / Safari, iOS, Mac, Android and Windows"),
        t("Optimized for all devices")
      ]
    },
    {
      icon: <IconSparkles size={20} />,
      title: t("Other Benefits"),
      items: [t("Priority CS support"), t("VIP group access")]
    }
  ]

  return (
    <>
      <div
        className={`dialog-container ${isDialogVisible ? "visible" : "hidden"} relative`}
      >
        <div className="absolute right-0 top-4">
          {showCloseIcon && (
            <button onClick={closeDialog}>
              <IconX size={24} />
            </button>
          )}
        </div>
        <div className="my-2">
          <form method={"POST"}>
            <input type={"hidden"} value={billingCycle} name={"billingCycle"} />
            <div className="mx-auto my-2 flex justify-center">
              <ToggleGroup
                type="single"
                className="w-auto rounded-full bg-gray-200 p-1"
                value={billingCycle}
                onValueChange={handleBillingCycleChange}
              >
                <ToggleGroupItem
                  value={BILLING_CYCLE_MONTHLY}
                  className={`rounded-full px-4 py-2 transition-all duration-200 ${
                    billingCycle === BILLING_CYCLE_MONTHLY
                      ? "bg-violet-700 text-white shadow-lg"
                      : "bg-transparent text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {t("Monthly")}
                </ToggleGroupItem>
                <ToggleGroupItem
                  value={BILLING_CYCLE_YEARLY}
                  className={`rounded-full px-4 py-2 transition-all duration-200 ${
                    billingCycle === BILLING_CYCLE_YEARLY
                      ? "bg-violet-700 text-white shadow-lg"
                      : "bg-transparent text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {t("Yearly")}
                  <span className="ml-2 line-clamp-1 text-nowrap rounded bg-green-500 px-2 py-1 text-xs text-white">
                    {t("2 months free")}
                  </span>
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
            <div className="flex flex-col-reverse md:flex-row">
              <PlanColumn
                title="Lite Plan"
                monthlyPrice="85"
                yearlyPrice="71"
                features={liteFeatures}
                planPrefix={LITE_PLAN_PREFIX}
              />

              <PlanColumn
                title={t("Pro Plan")}
                monthlyPrice="180"
                yearlyPrice="150"
                features={proFeatures}
                planPrefix={PRO_PLAN_PREFIX}
              />
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
