import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const params = await req.json()

    // Here you would integrate with your preferred image generation service
    // For example, OpenAI DALL-E, Stable Diffusion, etc.

    // Example using OpenAI's DALL-E (you'll need to add your API key to env)
    const response = await fetch(
      "https://api.openai.com/v1/images/generations",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          prompt: params.prompt,
          n: params.batchSize || 1,
          size: getImageSize(params.aspectRatio),
          response_format: "url"
        })
      }
    )

    if (!response.ok) {
      const error = await response.json()
      return NextResponse.json(
        { message: error.error?.message || "Failed to generate image" },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json({ imageUrl: data.data[0].url })
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

function getImageSize(aspectRatio?: string) {
  // Default to 1024x1024 if no aspect ratio specified
  if (!aspectRatio) return "1024x1024"

  // Map common aspect ratios to DALL-E supported sizes
  const sizeMap: Record<string, string> = {
    "1:1": "1024x1024",
    "16:9": "1792x1024",
    "9:16": "1024x1792"
  }

  return sizeMap[aspectRatio] || "1024x1024"
}
