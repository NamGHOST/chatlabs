"use client"

import React, { useEffect, useState, useContext } from "react"
import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

import { ChatbotUIContext } from "@/context/context"
import { ChatbotUIChatContext } from "@/context/chat"
import { getMessageCountForTier } from "@/db/messages"
import { LLM_LIST } from "@/lib/models/llm/llm-list"
import {
  FREE_MESSAGE_DAILY_LIMIT,
  LITE_MESSAGE_MONTHLY_LIMIT,
  LITE_PRO_MONTHLY_LIMIT,
  PRO_MESSAGE_MONTHLY_LIMIT,
  ULTIMATE_MESSAGE_MONTHLY_LIMIT,
  PLAN_FREE,
  PLAN_LITE,
  PLAN_PRO,
  PLAN_ULTIMATE
} from "@/lib/subscription"
import { isUsingOwnKey } from "@/lib/utils"
import { getImageGenerationCounts } from "@/lib/subscription/image-counts"
import {
  IMAGE_GENERATION_LIMITS,
  PlanType
} from "@/lib/subscription/image-limits"
import { supabase } from "@/lib/supabase/browser-client"

export function UsageChart() {
  const { profile } = useContext(ChatbotUIContext)
  const { isGenerating, chatSettings } = useContext(ChatbotUIChatContext)
  const [usageData, setUsageData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchUsageData() {
      if (!profile) {
        setLoading(false)
        return
      }

      const userPlan = profile.plan ? profile.plan.split("_")[0] : PLAN_FREE
      let usageDataArray = []

      try {
        // Fetch chat usage data
        if (!profile || !chatSettings?.model) {
          setLoading(false)
          return
        }

        const modelData = LLM_LIST.find(
          x =>
            x.modelId === chatSettings.model ||
            x.hostedId === chatSettings.model
        )
        const modelTier = modelData?.tier || "free"

        const freeDailyLimit = process.env.NEXT_PUBLIC_FREE_MESSAGE_DAILY_LIMIT
          ? parseInt(process.env.NEXT_PUBLIC_FREE_MESSAGE_DAILY_LIMIT)
          : FREE_MESSAGE_DAILY_LIMIT

        if (userPlan === PLAN_FREE) {
          const usage = await getMessageCountForTier(
            profile.user_id,
            "free",
            userPlan
          )
          if (usage && usage > 0) {
            usageDataArray.push({
              tier: "Platform",
              usage: usage,
              limit: freeDailyLimit,
              fill: "hsl(215, 100%, 50%)",
              resetPeriod: "daily"
            })
          }
        } else if (userPlan === PLAN_LITE) {
          const freeUsage =
            (await getMessageCountForTier(profile.user_id, "free", userPlan)) ||
            0
          const proUsage =
            (await getMessageCountForTier(profile.user_id, "pro", userPlan)) ||
            0
          usageDataArray.push(
            {
              tier: "Standard",
              usage: freeUsage,
              limit: LITE_MESSAGE_MONTHLY_LIMIT,
              fill: "hsl(215, 100%, 50%)",
              resetPeriod: "monthly"
            },
            {
              tier: "Pro",
              usage: proUsage,
              limit: LITE_PRO_MONTHLY_LIMIT,
              fill: "hsl(280, 100%, 50%)",
              resetPeriod: "monthly"
            }
          )
        } else if (userPlan === PLAN_PRO) {
          const usage =
            (await getMessageCountForTier(profile.user_id, "pro", userPlan)) ||
            0
          usageDataArray.push({
            tier: "Pro",
            usage: usage,
            limit: PRO_MESSAGE_MONTHLY_LIMIT,
            fill: "hsl(280, 100%, 50%)",
            resetPeriod: "monthly"
          })
        } else if (userPlan === PLAN_ULTIMATE) {
          const usage =
            (await getMessageCountForTier(profile.user_id, "pro", userPlan)) ||
            0
          usageDataArray.push({
            tier: "Pro",
            usage: usage,
            limit: ULTIMATE_MESSAGE_MONTHLY_LIMIT,
            fill: "hsl(280, 100%, 50%)",
            resetPeriod: "monthly"
          })
        }

        if (
          profile.openai_api_key ||
          profile.azure_openai_api_key ||
          profile.anthropic_api_key ||
          profile.google_gemini_api_key ||
          profile.mistral_api_key ||
          profile.groq_api_key ||
          profile.perplexity_api_key ||
          profile.openrouter_api_key
        ) {
          usageDataArray.push({
            tier: "Custom API Key",
            usage: "∞",
            limit: "∞",
            fill: "hsl(120, 100%, 50%)",
            resetPeriod: "N/A"
          })
        }

        // Fetch image generation usage data
        const imageGenCounts = await getImageGenerationCounts(
          profile.user_id,
          userPlan.toUpperCase() as PlanType,
          supabase
        )

        const imageLimits =
          IMAGE_GENERATION_LIMITS[userPlan.toUpperCase() as PlanType]

        // Add standard image generation usage
        usageDataArray.push({
          tier: "Standard Image Generation",
          usage: imageGenCounts.standard,
          limit: imageLimits.DAILY || imageLimits.MONTHLY,
          fill: "hsl(215, 100%, 50%)",
          resetPeriod: userPlan === PLAN_FREE ? "daily" : "monthly"
        })

        // Add pro image generation usage if applicable
        if (imageLimits.PRO_MONTHLY) {
          usageDataArray.push({
            tier: "Pro Image Generation",
            usage: imageGenCounts.pro,
            limit: imageLimits.PRO_MONTHLY,
            fill: "hsl(280, 100%, 50%)",
            resetPeriod: "monthly"
          })
        }

        setUsageData(usageDataArray)
        setLoading(false)
      } catch (error) {
        console.error("Error fetching usage data:", error)
        setError("Failed to fetch usage data")
        setLoading(false)
      }
    }

    const fetchDataWithDelay = setTimeout(() => {
      fetchUsageData()
    }, 1000)

    return () => clearTimeout(fetchDataWithDelay)
  }, [profile, isGenerating, chatSettings])

  if (loading) {
    return <p>Loading usage data...</p>
  }

  if (error) {
    return <p>Error loading usage data: {error}</p>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Usage</CardTitle>
      </CardHeader>
      <CardContent>
        {usageData.map((data, index) => (
          <div key={index} className="mb-4 space-y-4">
            <div>
              <h3 className="font-semibold">{data.tier}</h3>
              {data.usage === "∞" ? (
                <p className="text-muted-foreground text-sm">
                  Unlimited requests using your own API key
                </p>
              ) : (
                <>
                  <p className="text-muted-foreground text-sm">
                    You have used {data.usage} requests out of your {data.limit}{" "}
                    {data.tier.toLowerCase()} tier {data.resetPeriod} requests
                    quota.
                  </p>
                  <Progress
                    value={(data.usage / data.limit) * 100}
                    className="mt-2"
                  />
                </>
              )}
            </div>
          </div>
        ))}
      </CardContent>
      <CardFooter className="text-muted-foreground text-sm">
        {usageData.some(d => d.usage !== "∞") &&
          `Usage resets ${usageData.find(d => d.usage !== "∞")?.resetPeriod}`}
      </CardFooter>
    </Card>
  )
}

function getLimitForPlan(plan: string, tier: string) {
  switch (plan) {
    case PLAN_LITE:
      return tier === "pro"
        ? LITE_PRO_MONTHLY_LIMIT
        : LITE_MESSAGE_MONTHLY_LIMIT
    case PLAN_PRO:
      return PRO_MESSAGE_MONTHLY_LIMIT
    case PLAN_ULTIMATE:
      return ULTIMATE_MESSAGE_MONTHLY_LIMIT
    default:
      return FREE_MESSAGE_DAILY_LIMIT
  }
}
