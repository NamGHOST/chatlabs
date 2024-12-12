import { RecraftStyle } from "@/types/image-generation"

export interface GenerateImageParams {
  prompt: string
  style: string
  aspectRatio?: string
  recraftStyle?: RecraftStyle
  guidanceScale?: number
  negativePrompt?: string
  steps?: number
  seed?: number
  samplerName?: string
  batchSize?: number
  batchCount?: number
  clipSkip?: number
  tiling?: boolean
  mode?: "image-to-image"
  image?: File | null
  mask?: File | null
  imageUrl?: string
  maskUrl?: string
}

export const generateImage = async (
  params: GenerateImageParams
): Promise<string> => {
  try {
    const response = await fetch("/api/generate-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Image generation failed")
    }

    const data = await response.json()
    return data.imageUrl
  } catch (error: any) {
    console.error("Error in generateImage:", error)
    throw error
  }
}
