import { SupabaseClient } from "@supabase/supabase-js"
import {
  ModelTier,
  PlanType,
  IMAGE_MODEL_TIERS,
  ImageModelId
} from "./image-limits"

interface ImageGenerationCount {
  standard: number
  pro: number
  periodStart: Date
}

export async function getImageGenerationCounts(
  userId: string,
  userPlan: PlanType,
  supabase: SupabaseClient
): Promise<ImageGenerationCount> {
  // Calculate period start date
  const periodStart = new Date()
  if (userPlan === "FREE") {
    // For FREE plan, count daily
    periodStart.setUTCHours(0, 0, 0, 0)
  } else {
    // For paid plans, count monthly
    periodStart.setUTCDate(1)
    periodStart.setUTCHours(0, 0, 0, 0)
  }

  // Query image_history table instead and use params.style to determine tier
  const { data: images } = await supabase
    .from("image_history")
    .select("params")
    .eq("user_id", userId)
    .gte("timestamp", periodStart.getTime())

  let standardCount = 0
  let proCount = 0

  // Count based on the model tier from the params
  images?.forEach(record => {
    const style = record.params?.style as ImageModelId
    if (style && IMAGE_MODEL_TIERS[style] === "standard") {
      standardCount++
    } else if (style && IMAGE_MODEL_TIERS[style] === "pro") {
      proCount++
    }
  })

  return {
    standard: standardCount,
    pro: proCount,
    periodStart
  }
}
