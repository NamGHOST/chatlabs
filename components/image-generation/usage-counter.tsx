import { useImageGenerationLimits } from "@/hooks/useImageGenerationLimits"
import {
  PlanType,
  IMAGE_GENERATION_LIMITS
} from "@/lib/subscription/image-limits"

interface UsageCounterProps {
  userId: string
  userPlan: PlanType
}

export function UsageCounter({ userId, userPlan }: UsageCounterProps) {
  const { counts, loading } = useImageGenerationLimits(userId, userPlan)

  if (loading) return <div>Loading usage...</div>

  const limits = IMAGE_GENERATION_LIMITS[userPlan]
  const period = userPlan === "FREE" ? "day" : "month"

  return (
    <div className="space-y-2 rounded-lg border p-4">
      <h3 className="font-semibold">Generation Limits</h3>
      <div className="space-y-1 text-sm">
        <div>
          Standard Models: {counts.standard} / {limits.DAILY || limits.MONTHLY}{" "}
          per {period}
        </div>
        {limits.PRO_MONTHLY && (
          <div>
            Pro Models: {counts.pro} / {limits.PRO_MONTHLY} per month
          </div>
        )}
      </div>
    </div>
  )
}
