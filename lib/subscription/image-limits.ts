export type ImageModelId =
  | "flux-schnell"
  | "flux-1.1-pro"
  | "flux-1.1-pro-ultra"
  | "stable-diffusion-3.5-large-turbo"
  | "recraft-v3"

export type ModelTier = "standard" | "pro"

export type PlanType = "FREE" | "LITE" | "PRO"

interface PlanLimits {
  DAILY?: number
  MONTHLY?: number
  PRO_MONTHLY?: number
  MODELS: ImageModelId[]
}

export const IMAGE_GENERATION_LIMITS: Record<PlanType, PlanLimits> = {
  FREE: {
    DAILY: 5,
    MODELS: ["flux-schnell"]
  },
  LITE: {
    MONTHLY: 150,
    PRO_MONTHLY: 15,
    MODELS: ["flux-schnell", "flux-1.1-pro"]
  },
  PRO: {
    MONTHLY: 300,
    PRO_MONTHLY: 50,
    MODELS: [
      "flux-schnell",
      "flux-1.1-pro",
      "flux-1.1-pro-ultra",
      "stable-diffusion-3.5-large-turbo",
      "recraft-v3"
    ]
  }
} as const

export const IMAGE_MODEL_TIERS: Record<ImageModelId, ModelTier> = {
  "flux-schnell": "standard",
  "flux-1.1-pro": "pro",
  "flux-1.1-pro-ultra": "pro",
  "stable-diffusion-3.5-large-turbo": "pro",
  "recraft-v3": "pro"
} as const

export const MODEL_DISPLAY_NAMES: Record<ImageModelId, string> = {
  "flux-schnell": "FLUX Schnell (Fast)",
  "flux-1.1-pro": "FLUX 1.1 Pro (Quality)",
  "flux-1.1-pro-ultra": "FLUX 1.1 Pro Ultra (Realistic)",
  "stable-diffusion-3.5-large-turbo": "Stable Diffusion 3.5 Turbo (Realistic)",
  "recraft-v3": "Recraft v3 (Realistic)"
} as const
