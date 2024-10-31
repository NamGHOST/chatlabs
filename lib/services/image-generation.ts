import OpenAI from "openai"
import { ImageGenerationParams } from "@/types/image-generation"
import Replicate from "replicate"
import { aspectRatios } from "@/lib/config/image-generation"

export async function generateImage(params: ImageGenerationParams) {
  const { prompt, style, aspectRatio } = params

  switch (style) {
    case "dall-e":
      if (!process.env.OPENAI_API_KEY) {
        throw new Error("OpenAI API key is required for DALL-E generation")
      }

      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      })

      const response = await openai.images.generate({
        prompt,
        model: "dall-e-3",
        size: aspectRatio as
          | "256x256"
          | "512x512"
          | "1024x1024"
          | "1792x1024"
          | "1024x1792",
        n: 1
      })
      return response.data[0].url

    case "flux-schnell":
      if (!process.env.REPLICATE_API_TOKEN) {
        throw new Error("Replicate API token is required for Flux generation")
      }

      const replicate = new Replicate({
        auth: process.env.REPLICATE_API_TOKEN
      })

      // Get width and height from aspectRatio config
      const selectedRatio = aspectRatios.find(r => r.value === aspectRatio)
      if (!selectedRatio) {
        throw new Error("Invalid aspect ratio")
      }

      // Clamp guidance scale between 1 and 5 for Flux
      const guidanceScale = Math.min(Math.max(params.guidanceScale || 3, 1), 5)

      const result = await replicate.run("black-forest-labs/flux-schnell", {
        input: {
          prompt,
          steps: params.steps || 25,
          guidance: guidanceScale,
          aspect_ratio: selectedRatio.value,
          safety_tolerance: 2,
          interval: 2
        }
      })

      return result as unknown as string

    default:
      throw new Error(`Unsupported model: ${style}`)
  }
}
