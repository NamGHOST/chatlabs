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

  // Validate input data
  if (!chatSettings || !messages || !Array.isArray(messages)) {
    return new Response(JSON.stringify({ message: "Invalid input data" }), {
      status: 400
    })
  }

  try {
    const profile = await getServerProfile()

    checkApiKey(profile.openrouter_api_key, "OpenRouter")

    await validateModelAndMessageCount(chatSettings.model, new Date())

    const openai = new OpenAI({
      apiKey: profile.openrouter_api_key || "",
      baseURL: "https://openrouter.ai/api/v1",
      defaultHeaders: {
        "HTTP-Referer": `https://imogenai.app`,
        "X-Title": `ImogenAI`,
        "X-Description": `Chat with all best AI models in one place`
      }
    })

    const isAnthropicModel = chatSettings.model.startsWith("anthropic/")

    const processedMessages = isAnthropicModel
      ? messages.map(message => ({
          ...message,
          content: Array.isArray(message.content)
            ? message.content.map((part: any) => {
                if (part.type === "text" && part.text.length > 1000) {
                  return {
                    ...part,
                    cache_control: { type: "ephemeral" }
                  }
                }
                return part
              })
            : message.content
        }))
      : messages

    const response = await openai.chat.completions.create({
      model: chatSettings.model as ChatCompletionCreateParamsBase["model"],
      messages: processedMessages as ChatCompletionCreateParamsBase["messages"],
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
