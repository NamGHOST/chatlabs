import { useState, useEffect } from 'react'
import { PlanType, IMAGE_GENERATION_LIMITS } from '@/lib/subscription/image-limits'
import { getImageGenerationCounts } from '@/lib/subscription/image-counts'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export function useImageGenerationLimits(userId: string, userPlan: PlanType) {
  const [counts, setCounts] = useState({ standard: 0, pro: 0 })
  const [loading, setLoading] = useState(true)
  const limits = IMAGE_GENERATION_LIMITS[userPlan]

  const fetchCounts = async () => {
    const counts = await getImageGenerationCounts(userId, userPlan, supabase)
    setCounts(counts)
    setLoading(false)
  }

  const hasReachedLimit = (modelTier: 'standard' | 'pro') => {
    if (modelTier === 'standard') {
      return counts.standard >= (limits.DAILY || limits.MONTHLY || 0)
    }
    return counts.pro >= (limits.PRO_MONTHLY || 0)
  }

  useEffect(() => {
    fetchCounts()
  }, [userId, userPlan])

  return {
    counts,
    loading,
    hasReachedLimit,
    refreshCounts: fetchCounts
  }
}