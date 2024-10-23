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

export function UsageChart() {
  const { profile } = useContext(ChatbotUIContext)
  const { isGenerating, chatSettings } = useContext(ChatbotUIChatContext)
  const [usageData, setUsageData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDataWithDelay = setTimeout(() => {
      async function fetchUsageData() {
        if (!profile || !chatSettings?.model) {
          setLoading(false)
          return
        }

        const userPlan = profile.plan ? profile.plan.split("_")[0] : PLAN_FREE
        const modelData = LLM_LIST.find(
          x =>
            x.modelId === chatSettings.model ||
            x.hostedId === chatSettings.model
        )
        const modelTier = modelData?.tier || "free"

        try {
          let usageDataArray = []

          const freeDailyLimit = process.env
            .NEXT_PUBLIC_FREE_MESSAGE_DAILY_LIMIT
            ? parseInt(process.env.NEXT_PUBLIC_FREE_MESSAGE_DAILY_LIMIT)
            : FREE_MESSAGE_DAILY_LIMIT

          if (userPlan === PLAN_FREE) {
            const usage = await getMessageCountForTier(
              profile.user_id,
              "free",
              userPlan
            )
            usageDataArray.push({
              tier: "Free",
              usage: usage,
              limit: freeDailyLimit,
              fill: "hsl(215, 100%, 50%)",
              resetPeriod: "daily"
            })
          } else if (userPlan === PLAN_LITE) {
            const freeUsage = await getMessageCountForTier(
              profile.user_id,
              "free",
              userPlan
            )
            const proUsage = await getMessageCountForTier(
              profile.user_id,
              "pro",
              userPlan
            )
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
            const usage = await getMessageCountForTier(
              profile.user_id,
              "pro",
              userPlan
            )
            usageDataArray.push({
              tier: "Pro",
              usage: usage,
              limit: PRO_MESSAGE_MONTHLY_LIMIT,
              fill: "hsl(280, 100%, 50%)",
              resetPeriod: "monthly"
            })
          } else {
            const usage = await getMessageCountForTier(
              profile.user_id,
              modelTier,
              userPlan,
              profile.subscription_start_date || undefined
            )
            usageDataArray.push({
              tier: userPlan,
              usage: usage,
              limit: getLimitForPlan(userPlan, modelTier),
              fill: "hsl(280, 100%, 50%)",
              resetPeriod: "monthly"
            })
          }

          setUsageData(usageDataArray)
          setLoading(false)
        } catch (err) {
          console.error("Error fetching usage data:", err)
          setError("Failed to fetch usage data")
          setLoading(false)
        }
      }

      fetchUsageData()
    }, 1000) // 1 second delay

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
          <div key={index} className="mb-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>
                {data.tier} Tier: {data.usage} / {data.limit}
              </span>
              <span>{((data.usage / data.limit) * 100).toFixed(1)}%</span>
            </div>
            <Progress value={(data.usage / data.limit) * 100} className="h-2" />
            <p className="text-muted-foreground text-sm">
              You have used {data.usage} requests out of your {data.limit}{" "}
              {data.tier.toLowerCase()} tier {data.resetPeriod} requests quota.
            </p>
          </div>
        ))}
      </CardContent>
      <CardFooter className="text-muted-foreground text-sm">
        Usage resets {usageData[0]?.resetPeriod}
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
