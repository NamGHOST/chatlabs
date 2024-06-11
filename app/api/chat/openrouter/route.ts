import {
  checkApiKey,
  getServerProfile,
  validateModelAndMessageCount
} from "@/lib/server/server-chat-helpers"
import { ChatSettings } from "@/types"
import { OpenAIStream, StreamingTextResponse } from "ai"
import { ServerRuntime } from "next"
import OpenAI from "openai"
import { ChatCompletionCreateParamsBase } from "openai/resources/chat/completions.mjs"

export const runtime: ServerRuntime = "edge"

export async function POST(request: Request) {
  const json = await request.json()
  const { chatSettings, messages } = json as {
    chatSettings: ChatSettings
    messages: any[]
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

    const openai = new OpenAI({
      apiKey:
        profile.openrouter_api_key || process.env.OPENROUTER_API_KEY_ADMIN,
      baseURL: "https://openrouter.ai/api/v1",
      defaultHeaders: {
        "HTTP-Referer": `https://writingmate.ai/labs`,
        "X-Title": `ChatLabs`,
        "X-Description": `Chat with all best AI models in one place`
      }
    })

    const response = await openai.chat.completions.create({
      model: chatSettings.model as ChatCompletionCreateParamsBase["model"],
      messages: messages as ChatCompletionCreateParamsBase["messages"],
      temperature: chatSettings.temperature,
      max_tokens: undefined,
      stream: true
    })

    const stream = OpenAIStream(response)

    return new StreamingTextResponse(stream)
  } catch (error: any) {
    let errorMessage = error.message || "An unexpected error occurred"
    const errorCode = error.status || 500

    if (errorMessage.toLowerCase().includes("api key not found")) {
      errorMessage =
        "OpenRouter API Key not found. Please set it in your profile settings."
    }

    return new Response(JSON.stringify({ message: errorMessage }), {
      status: errorCode
    })
  }
}
