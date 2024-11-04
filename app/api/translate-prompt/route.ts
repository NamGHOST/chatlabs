import { NextResponse } from "next/server"
import { buildOpenRouterFinalMessages } from "@/lib/build-prompt"

export async function POST(req: Request) {
  try {
    const { text } = await req.json()

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "HTTP-Referer":
            process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
        },
        body: JSON.stringify({
          model: "google/gemini-flash-1.5-8b",
          messages: [
            {
              role: "system",
              content:
                "You are a creative prompt engineer. Transform the given text into a detailed, creative image generation prompt. Enhance the description while maintaining the original intent. Focus on visual details, artistic style, lighting, and atmosphere. Whatever the languange input is you will always output in English. Not more than 5 sentences."
            },
            {
              role: "user",
              content: text
            }
          ]
        })
      }
    )

    if (!response.ok) {
      throw new Error("Translation failed")
    }

    const data = await response.json()
    const enhancedPrompt = data.choices[0].message.content

    return NextResponse.json({ enhancedPrompt })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
