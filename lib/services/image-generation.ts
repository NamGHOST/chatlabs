import { ImageGenerationParams } from "@/types/image-generation"
import Replicate from "replicate"
import { aspectRatios } from "@/lib/config/image-generation"
import { ImageModelId } from "@/lib/subscription/image-limits"
import { recraftStyles } from "@/components/image-generation/AdvancedParametersPanel"

type RecraftStyle =
  | "any"
  | "realistic_image"
  | "digital_illustration"
  | "digital_illustration/pixel_art"
  | "digital_illustration/hand_drawn"
  | "digital_illustration/grain"
  | "digital_illustration/infantile_sketch"
  | "digital_illustration/2d_art_poster"
  | "digital_illustration/handmade_3d"
  | "digital_illustration/hand_drawn_outline"
  | "digital_illustration/engraving_color"
  | "digital_illustration/2d_art_poster_2"
  | "realistic_image/b_and_w"
  | "realistic_image/hard_flash"
  | "realistic_image/hdr"
  | "realistic_image/natural_light"
  | "realistic_image/studio_portrait"
  | "realistic_image/enterprise"
  | "realistic_image/motion_blur"

interface ModelConfig {
  model: `${string}/${string}` | `${string}/${string}:${string}`
  useAspectRatio: boolean
  defaultSteps: number
  paramMapping?: {
    steps: string
    guidanceScale: string
  }
  extraParams?: {
    [key: string]: number | string | boolean | undefined
    safety_tolerance?: number
    interval?: number
    style?: RecraftStyle
  }
}

const MODEL_CONFIGS: Record<ImageModelId, ModelConfig> = {
  "flux-schnell": {
    model: "black-forest-labs/flux-schnell",
    useAspectRatio: true,
    defaultSteps: 4,
    extraParams: {
      safety_tolerance: 2,
      interval: 2
    }
  },
  "flux-1.1-pro": {
    model: "black-forest-labs/flux-1.1-pro",
    useAspectRatio: true,
    defaultSteps: 25,
    extraParams: {
      output_format: "webp",
      output_quality: 80,
      safety_tolerance: 2,
      prompt_upsampling: true
    }
  },
  "flux-1.1-pro-ultra": {
    model: "black-forest-labs/flux-1.1-pro-ultra",
    useAspectRatio: true,
    defaultSteps: 25
  },
  "stable-diffusion-3.5-large-turbo": {
    model: "stability-ai/stable-diffusion-3.5-large-turbo",
    useAspectRatio: true,
    defaultSteps: 40,
    paramMapping: {
      steps: "num_inference_steps",
      guidanceScale: "guidance_scale"
    }
  },
  "recraft-v3": {
    model: "recraft-ai/recraft-v3",
    useAspectRatio: true,
    defaultSteps: 25,
    paramMapping: {
      steps: "num_steps",
      guidanceScale: "guidance_scale"
    },
    extraParams: {
      style: recraftStyles[0].value as RecraftStyle
    }
  }
} as const

export async function generateImage(params: ImageGenerationParams) {
  const { prompt, style, aspectRatio } = params

  if (!process.env.REPLICATE_API_TOKEN) {
    throw new Error("Replicate API token is required")
  }

  const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN
  })

  const modelConfig = MODEL_CONFIGS[style as ImageModelId]
  if (!modelConfig) {
    throw new Error(`Unsupported model: ${style}`)
  }

  const input: {
    prompt: string
    width?: number
    height?: number
    size?: string
    aspect_ratio?: string
    style?: RecraftStyle
    [key: string]: number | string | boolean | undefined
  } = {
    prompt,
    ...modelConfig.extraParams
  }

  // Handle aspect ratio for different models
  if (modelConfig.useAspectRatio) {
    const selectedRatio = aspectRatios.find(r => r.value === aspectRatio)
    if (selectedRatio) {
      if (modelConfig.model === "recraft-ai/recraft-v3") {
        // Recraft uses a size parameter in format "WxH"
        input.size = `${selectedRatio.width}x${selectedRatio.height}`
        input.style = params.recraftStyle as RecraftStyle
        delete input.width
        delete input.height
      } else {
        // Other models use aspect_ratio parameter
        input.aspect_ratio = selectedRatio.value
      }
    }
  }

  try {
    console.log("Sending request with input:", input)
    const output = await replicate.run(modelConfig.model, { input })
    console.log("Received response:", output)

    // Handle different response formats
    if (output === null || output === undefined) {
      throw new Error("Empty response from API")
    }

    if (typeof output === "string") {
      return output
    }

    if (Array.isArray(output)) {
      return output[0]
    }

    if (typeof output === "object") {
      if ("output" in output) {
        return output.output
      }
      if ("image" in output) {
        return output.image
      }
    }

    throw new Error(`Unexpected API response format: ${JSON.stringify(output)}`)
  } catch (error) {
    console.error("Replicate API error:", error)
    throw error
  }
}
