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
  IconChevronUp,
  IconUsers,
  IconPhotoAi
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
    <div className="relative flex flex-1 flex-col gap-4 rounded-lg border border-gray-800/10 bg-black/5 p-4 backdrop-blur-sm dark:border-white/10">
      <div className="bg-token-main-surface-primary relative flex flex-col">
        <div className="flex flex-col gap-2">
          <p className="text-lg font-semibold">{title}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-semibold">
              {billingCycle === "yearly" ? yearlyPrice : monthlyPrice} USD
            </p>
            {billingCycle === "yearly" && (
              <p className="text-foreground/50 line-through">
                {monthlyPrice} USD
              </p>
            )}
          </div>
          <p className="text-foreground/50 text-sm">
            {billingCycle === "yearly"
              ? `per month, billed annually (${parseFloat(monthlyPrice) * 10} USD/year)`
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
        className="w-full bg-violet-700 text-white hover:bg-white hover:text-violet-700 hover:outline hover:outline-violet-700"
      >
        {t("Upgrade NOW")}
      </Button>
      <div className="flex grow flex-col gap-2 text-sm">
        <FeatureGroup icon={<IconRobot size={18} />} title={t("AI Models")}>
          {features
            .find(f => f.title === t("AI Models"))
            ?.items.map((item: string, index: number) => (
              <PlanFeature key={index} title={item} />
            ))}
        </FeatureGroup>
        <FeatureGroup
          icon={<IconPhotoAi size={18} />}
          title={t("Image Generation")}
          className={planPrefix === LITE_PLAN_PREFIX ? "mb-4" : undefined}
        >
          {features
            .find(f => f.title === t("Image Generation"))
            ?.items.map((item: string, index: number) => (
              <PlanFeature key={index} title={item} />
            ))}
        </FeatureGroup>
        <FeatureGroup icon={<IconUsers size={18} />} title={t("AI Meeting")}>
          {features
            .find(f => f.title === t("AI Meeting"))
            ?.items.map((item: string, index: number) => (
              <PlanFeature key={index} title={item} />
            ))}
        </FeatureGroup>
        <FeatureGroup
          icon={<IconKey size={18} />}
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
              <IconSparkles size={18} />
              <span className="ml-2 font-semibold">
                {t("Advanced Features")}
              </span>
            </div>
            <button
              onClick={toggleAdvancedFeatures}
              className="text-gray-500 hover:text-gray-700"
            >
              {isAdvancedFeaturesExpanded ? (
                <IconChevronUp size={18} />
              ) : (
                <IconChevronDown size={18} />
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
                      t("ImogenAI API Key Hub"),
                      t("AI Meeting")
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
        t("Standard models: 1500 requests"),
        t("GPT-4o mini, Claude 3 Haiku and more"),
        t("Pro models: 120 requests"),
        t("Limited time offer: Access to OpenAI: O1mini, GPT 4o ,X-AI Grok2")
      ]
    },
    {
      icon: <IconUsers size={20} />,
      title: t("AI Meeting"),
      items: [t("Brainstorming, idea generation, and more")]
    },
    {
      icon: <IconPhotoAi size={20} />,
      title: t("Image Generation"),
      items: [t("Powered by Flux Family"), t("150 times fast generation")]
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
        t("AI summaries"),
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
      icon: <IconUsers size={20} />,
      title: t("AI Meeting"),
      items: [t("Brainstorming, idea generation, and more")]
    },
    {
      icon: <IconPhotoAi size={20} />,
      title: t("Image Generation"),
      items: [
        t("Powered by Flux Family, Stable Diffusion and Recraft"),
        t("300 times fast generation"),
        t("50 times Pro quality generation")
      ]
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
        t("AI summaries"),
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
        className={`dialog-container ${isDialogVisible ? "visible" : "hidden"} fixed inset-0 z-50 flex items-center justify-center bg-black/5 p-4 backdrop-blur-sm`}
      >
        <div className="relative size-full max-h-[90vh] max-w-screen-lg">
          <div className="bg-background relative h-full overflow-hidden rounded-xl border border-gray-800/10 shadow-sm dark:border-white/10">
            <div className="absolute right-4 top-4 z-10">
              {showCloseIcon && (
                <button
                  onClick={closeDialog}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <IconX size={24} />
                </button>
              )}
            </div>

            <div className="grid h-full grid-cols-1 md:grid-cols-1 lg:grid-cols-[1fr_1fr]">
              {/* Left side - Image and Text */}
              <div className="relative h-[30vh] lg:h-full">
                <div className="h-full">
                  <div className="relative size-full bg-black">
                    <img
                      src="/images/upgrade-hero.png"
                      alt="Upgrade to Pro"
                      className="size-full object-cover"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-8 text-white">
                      <h2 className="text-4xl font-bold">
                        {t("Unlock Full Potential")}
                      </h2>
                      <p className="mt-3 text-xl text-white/90">
                        {t(
                          "Access premium features and enhance your AI experience"
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right side - Plan Details */}
              <div className="flex flex-col overflow-hidden px-4 pb-4 pt-6 md:p-6">
                <form method={"POST"} className="flex h-full flex-col">
                  <input
                    type={"hidden"}
                    value={billingCycle}
                    name={"billingCycle"}
                  />
                  <div className="mb-6 flex justify-center">
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
                  <div className="min-h-0 flex-1 overflow-y-auto">
                    <div className="grid grid-cols-1 gap-4 pb-6">
                      <PlanColumn
                        title="Lite Plan"
                        monthlyPrice="11"
                        yearlyPrice="9.2"
                        features={liteFeatures}
                        planPrefix={LITE_PLAN_PREFIX}
                      />

                      <PlanColumn
                        title={t("Pro Plan")}
                        monthlyPrice="24"
                        yearlyPrice="20"
                        features={proFeatures}
                        planPrefix={PRO_PLAN_PREFIX}
                      />
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
