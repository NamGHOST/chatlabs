import { NextResponse } from "next/server"
import { generateImage } from "@/lib/services/image-generation"
import { aspectRatios } from "@/lib/config/image-generation"

export async function POST(req: Request) {
  try {
    const { prompt, ...params } = await req.json()

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    // Find the correct dimensions for the selected aspect ratio
    const selectedRatio = aspectRatios.find(r => r.value === params.aspectRatio)

    const imageUrl = await generateImage({
      prompt,
      aspectRatio: params.aspectRatio,
      style: params.style,
      recraftStyle: params.recraftStyle,
      guidanceScale: params.guidanceScale,
      steps: params.steps
    })

    return NextResponse.json({ imageUrl })
  } catch (error: any) {
    console.error("Image Generation Error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to generate image" },
      { status: 500 }
    )
  }
}
