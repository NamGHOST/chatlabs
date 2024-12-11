import { ImageGenerationParams } from "@/types/image-generation"
import { RecraftStyle } from "@/types/image-generation"
import Replicate from "replicate"
import { aspectRatios } from "@/lib/config/image-generation"
import { ImageModelId } from "@/lib/subscription/image-limits"
import { recraftStyles } from "@/components/image-generation/AdvancedParametersPanel"

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
    output_format?: string
    prompt_upsampling?: boolean
  }
  isImageToImage?: boolean
}

export const MODEL_CONFIGS: Record<ImageModelId, ModelConfig> = {
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
      // Remove default style to allow user selection
      // style: recraftStyles[0].value as RecraftStyle
    }
  },
  "flux-fill-pro": {
    model: "black-forest-labs/flux-fill-pro",
    useAspectRatio: false,
    defaultSteps: 50,
    paramMapping: {
      steps: "steps",
      guidanceScale: "guidance"
    },
    extraParams: {
      output_format: "jpg",
      safety_tolerance: 2,
      prompt_upsampling: true
    },
    isImageToImage: true
  }
} as const

interface ImageToImageParams {
  mode: "image-to-image"
  image: File | null
  mask?: File | null
  prompt: string
  negativePrompt?: string
  guidanceScale?: number
  steps?: number
  style: ImageModelId
  imageUrl?: string
}

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = error => reject(error)
  })
}

function isTextToImageParams(
  params: ImageToImageParams | ImageGenerationParams
): params is ImageGenerationParams {
  return !("mode" in params)
}

export async function generateImage(
  params: ImageGenerationParams | ImageToImageParams
) {
  if (!process.env.REPLICATE_API_TOKEN) {
    throw new Error("Replicate API token is required")
  }

  const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN
  })

  // Handle text-to-image generation
  if (isTextToImageParams(params)) {
    const modelConfig = MODEL_CONFIGS[params.style as ImageModelId]
    if (!modelConfig) {
      throw new Error(`Unsupported model: ${params.style}`)
    }

    // For Flux Schnell model
    if (modelConfig.model === "black-forest-labs/flux-schnell") {
      // Simplify input for Flux Schnell
      const fluxInput = {
        prompt: params.prompt,
        negative_prompt: params.negativePrompt || "",
        safety_tolerance: 2,
        interval: 2
      }

      console.log("Sending to Flux Schnell:", fluxInput)
      try {
        const output = await replicate.run(modelConfig.model, {
          input: fluxInput
        })
        console.log("Flux Schnell response:", output)

        // Flux Schnell returns an array with one image URL
        if (Array.isArray(output) && output.length > 0) {
          return output[0]
        }

        throw new Error("Invalid response format from Flux Schnell")
      } catch (error) {
        console.error("Flux Schnell error:", error)
        throw error
      }
    } else {
      // Handle other models...
      const input: { [key: string]: any } = {
        prompt: params.prompt,
        negative_prompt: params.negativePrompt || "",
        ...modelConfig.extraParams
      }

      // Add model-specific parameters
      if (modelConfig.paramMapping) {
        input[modelConfig.paramMapping.steps] =
          params.steps || modelConfig.defaultSteps
        input[modelConfig.paramMapping.guidanceScale] =
          params.guidanceScale || 7.5
      } else {
        input.num_inference_steps = params.steps || modelConfig.defaultSteps
        input.guidance_scale = params.guidanceScale || 7.5
      }

      // Handle aspect ratio
      if (modelConfig.useAspectRatio) {
        const selectedRatio = aspectRatios.find(
          r => r.value === params.aspectRatio
        )
        if (selectedRatio) {
          if (modelConfig.model === "recraft-ai/recraft-v3") {
            input.size = `${selectedRatio.width}x${selectedRatio.height}`
          } else {
            input.aspect_ratio = params.aspectRatio
          }
        }
      }

      console.log("Sending to Replicate:", { model: modelConfig.model, input })

      try {
        const output = await replicate.run(modelConfig.model, { input })
        console.log("Replicate response:", output)
        return handleReplicateResponse(output)
      } catch (error) {
        console.error("Replicate API error:", error)
        throw error
      }
    }
  }

  // Handle image-to-image generation
  if ("mode" in params && params.mode === "image-to-image") {
    let imageBase64: string | null = null

    if (params.image) {
      imageBase64 = await fileToBase64(params.image)
    } else if (params.imageUrl) {
      const response = await fetch(params.imageUrl)
      const blob = await response.blob()
      imageBase64 = await fileToBase64(
        new File([blob], "image.png", { type: "image/png" })
      )
    }

    if (!imageBase64) {
      throw new Error("Image is required for image-to-image generation")
    }

    const maskBase64 = params.mask ? await fileToBase64(params.mask) : null
    const modelConfig = MODEL_CONFIGS[params.style]

    const output = await replicate.run(modelConfig.model, {
      input: {
        image: imageBase64,
        mask: maskBase64,
        prompt: params.prompt,
        negative_prompt: params.negativePrompt,
        num_inference_steps: params.steps || 20,
        guidance_scale: params.guidanceScale || 7.5,
        scheduler: "K_EULER_ANCESTRAL",
        control_guidance_start: 0,
        control_guidance_end: 1
      }
    })

    return handleReplicateResponse(output)
  }
}

function handleReplicateResponse(output: any) {
  if (!output) throw new Error("Empty response from API")

  if (typeof output === "string") return output
  if (Array.isArray(output)) return output[0]
  if (typeof output === "object") {
    if ("output" in output) return output.output
    if ("image" in output) return output.image
  }

  throw new Error(`Unexpected API response format: ${JSON.stringify(output)}`)
}
