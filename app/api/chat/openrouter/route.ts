import { ChatSettings } from "@/types"
import { OpenAIStream, StreamingTextResponse } from "ai"
import { ServerRuntime } from "next"
import OpenAI from "openai"
import { ChatCompletionCreateParamsBase } from "openai/resources/chat/completions.mjs"
import {
  getServerProfile,
  validateModelAndMessageCount
} from "@/lib/server/server-chat-helpers"

export const runtime: ServerRuntime = "edge"

export async function POST(request: Request) {
  const json = await request.json()
  const { chatSettings, messages, image } = json as {
    chatSettings: ChatSettings
    messages: any[]
    image?: string // Base64 encoded image data
  }

  try {
    const profile = await getServerProfile()

    if (
      (profile.openrouter_api_key === null ||
        profile.openrouter_api_key === "") &&
      !process.env.OPENROUTER_API_KEY_ADMIN
    ) {
      throw new Error(`OpenRouter API Key not found`)
    }

    await validateModelAndMessageCount(chatSettings.model, new Date())

    const response = await handleOpenRouter(
      chatSettings,
      messages,
      image,
      profile
    )

    return response
  } catch (error: any) {
    let errorMessage = error.message || "An unexpected error occurred"
    const errorCode = error.status || 500

    if (errorMessage.toLowerCase().includes("api key not found")) {
      errorMessage =
        "API Key not found. Please set it in your profile settings."
    } else if (errorMessage.toLowerCase().includes("api key not valid")) {
      errorMessage =
        "API Key is incorrect. Please fix it in your profile settings."
    }

    return new Response(JSON.stringify({ message: errorMessage }), {
      status: errorCode
    })
  }
}

async function handleOpenRouter(
  chatSettings: ChatSettings,
  messages: any[],
  image: string | undefined,
  profile: any
): Promise<Response> {
  const openai = new OpenAI({
    apiKey: profile.openrouter_api_key || process.env.OPENROUTER_API_KEY_ADMIN,
    baseURL: "https://openrouter.ai/api/v1",
    defaultHeaders: {
      "HTTP-Referer": `https://Imogenai.app`,
      "X-Title": `ImogenAI`,
      "X-Description": `Chat with all best AI models in one place`
    }
  })

  const formattedMessages = messages.map(msg => {
    if (
      msg.role === "user" &&
      messages.indexOf(msg) === messages.length - 1 &&
      image
    ) {
      return {
        role: msg.role,
        content: [
          {
            type: "image_url",
            image_url: { url: `data:image/jpeg;base64,${image}` }
          },
          { type: "text", text: msg.content }
        ]
      }
    }
    return msg
  })

  const response = await openai.chat.completions.create({
    model: chatSettings.model as ChatCompletionCreateParamsBase["model"],
    messages: formattedMessages,
    temperature: chatSettings.temperature,
    max_tokens: undefined,
    stream: true
  })

  const stream = OpenAIStream(response)
  return new StreamingTextResponse(stream)
}
