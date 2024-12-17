import { LLM_LIST } from "@/lib/models/llm/llm-list"
import { ChatSettings } from "@/types"
import { OpenAIStream, StreamingTextResponse } from "ai"
import { ServerRuntime } from "next"
import OpenAI from "openai"
import { ChatCompletionCreateParamsBase } from "openai/resources/chat/completions.mjs"

export const runtime: ServerRuntime = "edge"

export async function POST(request: Request) {
  const json = await request.json()
  const { chatSettings, messages, response_format } = json as {
    chatSettings: ChatSettings
    messages: any[]
    response_format: any
  }

  try {
    const isOpenRouter = chatSettings.model.includes("/") // OpenRouter models contain "/" in their names

    const openai = new OpenAI({
      apiKey: isOpenRouter
        ? process.env.OPENROUTER_API_KEY || ""
        : process.env.OPENAI_API_KEY || "",
      baseURL: isOpenRouter
        ? "https://openrouter.ai/api/v1"
        : process.env.OPENAI_BASE_URL || undefined,
      defaultHeaders: isOpenRouter
        ? {
            "HTTP-Referer":
              process.env.NEXT_PUBLIC_APP_URL || "https://imogenai.app",
            "X-Title": "ImogenAI",
            "X-Description": "Chat with all best AI models in one place",
            "Content-Type": "application/json"
          }
        : undefined
    })

    const supportsStreaming = LLM_LIST.find(model =>
      [model.modelId, model.hostedId].includes(chatSettings.model)
    )?.supportsStreaming

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
      model: chatSettings.model,
      messages: processedMessages as ChatCompletionCreateParamsBase["messages"],
      temperature: chatSettings.temperature,
      max_tokens: undefined,
      response_format: response_format as any,
      stream: supportsStreaming || false
    })

    if (!supportsStreaming) {
      return new Response((response as any).choices[0].message.content || "")
    }

    const stream = OpenAIStream(response as any)

    return new StreamingTextResponse(stream)
  } catch (error: any) {
    let errorMessage = error.message || "An unexpected error occurred"
    const errorCode = error.status || 500

    if (errorMessage.toLowerCase().includes("api key not found")) {
      errorMessage =
        "API Key not found. Please check your environment variables."
    } else if (errorMessage.toLowerCase().includes("incorrect api key")) {
      errorMessage =
        "API Key is incorrect. Please check your environment variables."
    }

    return new Response(JSON.stringify({ message: errorMessage }), {
      status: errorCode
    })
  }
}
