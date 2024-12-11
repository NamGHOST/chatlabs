import { NextResponse } from "next/server"
import Replicate from "replicate"
import { GenerateImageParams } from "@/components/image-generation/image-api"
import { MODEL_CONFIGS } from "@/lib/services/image-generation"
import { ImageModelId } from "@/lib/subscription/image-limits"
import { aspectRatios } from "@/lib/config/image-generation"
import sharp from "sharp"

const WHITE_MASK = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=",
  "base64"
)

const fileToBase64 = async (file: File): Promise<string> => {
  const buffer = await file.arrayBuffer()
  const bytes = new Uint8Array(buffer)
  return `data:${file.type};base64,${Buffer.from(bytes).toString("base64")}`
}

// Helper function to convert base64 to URL via upload
const base64ToUrl = async (base64Data: string): Promise<string> => {
  // Remove data:image/...;base64, prefix
  const base64Clean = base64Data.split(",")[1]
  const buffer = Buffer.from(base64Clean, "base64")

  // Upload to a temporary storage service or Replicate's own upload endpoint
  const formData = new FormData()
  formData.append("file", new Blob([buffer]))
  const uploadResponse = await fetch("https://api.replicate.com/v1/uploads", {
    method: "POST",
    headers: {
      Authorization: `Token ${process.env.REPLICATE_API_TOKEN}`
    },
    body: formData
  })

  const { upload_url } = await uploadResponse.json()
  return upload_url
}

export async function POST(req: Request) {
  try {
    const params = (await req.json()) as GenerateImageParams
    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN!
    })
    const modelConfig = MODEL_CONFIGS[params.style as ImageModelId]
    if (!modelConfig) {
      throw new Error(`Unsupported model: ${params.style}`)
    }

    let input: any

    // Handle image-to-image case
    if (params.mode === "image-to-image") {
      try {
        // Get source image
        let imageBlob: Blob
        let imageUrl: string

        if (params.image) {
          imageBlob = new Blob([params.image], { type: "image/png" })
          // Upload image to Replicate
          const formData = new FormData()
          formData.append("file", imageBlob, "image.png")
          const imageUploadResponse = await fetch(
            "https://api.replicate.com/v1/uploads",
            {
              method: "POST",
              headers: {
                Authorization: `Token ${process.env.REPLICATE_API_TOKEN}`
              },
              body: formData
            }
          )
          const { upload_url } = await imageUploadResponse.json()
          imageUrl = upload_url
        } else if (params.imageUrl) {
          imageUrl = params.imageUrl // Use provided URL directly
        } else {
          throw new Error("No image provided")
        }

        // Handle mask if provided
        let maskUrl = null
        if (params.maskUrl) {
          maskUrl = params.maskUrl // Use the stored mask URL directly
        }

        // Create input object with proper structure
        const input = {
          image: imageUrl, // Required field
          prompt: params.prompt,
          steps: Math.max(params.steps || 20, 15),
          guidance: Math.min(params.guidanceScale || 3, 5),
          output_format: "jpg",
          safety_tolerance: 2,
          prompt_upsampling: true,
          seed: Math.floor(Math.random() * 1000000),
          ...(maskUrl && { mask: maskUrl })
        }

        console.log("Debug - Model Input:", input)
        const output = await replicate.run(modelConfig.model, { input })

        // Handle response based on model
        let resultImageUrl: string
        if (Array.isArray(output)) {
          resultImageUrl = output[0]
        } else if (typeof output === "string") {
          resultImageUrl = output
        } else if (typeof output === "object" && output !== null) {
          resultImageUrl =
            (output as { output?: string; image?: string }).output ||
            (output as { output?: string; image?: string }).image ||
            ""
        } else {
          throw new Error("Invalid response from model")
        }

        return NextResponse.json({ imageUrl: resultImageUrl })
      } catch (error) {
        console.error("Image generation error:", error)
        return NextResponse.json(
          { error: (error as Error).message },
          { status: 500 }
        )
      }
    }
    // Handle text-to-image case
    else {
      input = {
        prompt: params.prompt,
        negative_prompt: params.negativePrompt || "",
        aspect_ratio: params.aspectRatio,
        ...modelConfig.extraParams
      }

      if (modelConfig.useAspectRatio) {
        const selectedRatio = aspectRatios.find(
          r => r.value === params.aspectRatio
        )
        if (selectedRatio) {
          if (modelConfig.model === "recraft-ai/recraft-v3") {
            input.size = `${selectedRatio.width}x${selectedRatio.height}`
            if (params.recraftStyle) {
              input.style = params.recraftStyle
            }
          } else {
            input.aspect_ratio = params.aspectRatio
          }
        }
      }
    }

    const output = await replicate.run(modelConfig.model, { input })

    // Handle response based on model
    let resultImageUrl: string
    if (Array.isArray(output)) {
      resultImageUrl = output[0]
    } else if (typeof output === "string") {
      resultImageUrl = output
    } else if (typeof output === "object" && output !== null) {
      resultImageUrl =
        (output as { output?: string; image?: string }).output ||
        (output as { output?: string; image?: string }).image ||
        ""
    } else {
      throw new Error("Invalid response from model")
    }

    return NextResponse.json({ imageUrl: resultImageUrl })
  } catch (error) {
    console.error("Image generation error:", error)
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    )
  }
}
