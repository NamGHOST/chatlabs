import { ChatSettings } from "@/types"
import { OpenAIStream, StreamingTextResponse } from "ai"
import { ServerRuntime } from "next"
import OpenAI from "openai"
import { ChatCompletionCreateParamsBase } from "openai/resources/chat/completions.mjs"
import Anthropic from "@anthropic-ai/sdk"
import { GoogleGenerativeAI } from "@google/generative-ai"
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

    // Check for API keys
    if (
      (profile.openrouter_api_key === null ||
        profile.openrouter_api_key === "") &&
      !process.env.OPENROUTER_API_KEY_ADMIN
    ) {
      throw new Error(`OpenRouter API Key not found`)
    }

    await validateModelAndMessageCount(chatSettings.model, new Date())

    let response

    if (
      image &&
      (chatSettings.model.startsWith("anthropic/") ||
        chatSettings.model.startsWith("google/"))
    ) {
      // Handle image processing for Anthropic and Google models
      if (chatSettings.model.startsWith("anthropic/")) {
        response = await handleAnthropicWithImage(
          chatSettings,
          messages,
          image,
          profile
        )
      } else if (chatSettings.model.startsWith("google/")) {
        response = await handleGoogleWithImage(
          chatSettings,
          messages,
          image,
          profile
        )
      }
    } else {
      // Use OpenRouter for text-based interactions or other models
      response = await handleOpenRouter(chatSettings, messages, profile)
    }

    const stream = OpenAIStream(response)
    return new StreamingTextResponse(stream)
  } catch (error: any) {
    // Error handling (unchanged)
    // ...
  }
}

async function handleOpenRouter(
  chatSettings: ChatSettings,
  messages: any[],
  profile: any
) {
  const openai = new OpenAI({
    apiKey: profile.openrouter_api_key || process.env.OPENROUTER_API_KEY_ADMIN,
    baseURL: "https://openrouter.ai/api/v1",
    defaultHeaders: {
      "HTTP-Referer": `https://Imogenai.app`,
      "X-Title": `ImogenAI`,
      "X-Description": `Chat with all best AI models in one place`
    }
  })

  return await openai.chat.completions.create({
    model: chatSettings.model as ChatCompletionCreateParamsBase["model"],
    messages: messages as ChatCompletionCreateParamsBase["messages"],
    temperature: chatSettings.temperature,
    max_tokens: undefined,
    stream: true
  })
}

async function handleAnthropicWithImage(
  chatSettings: ChatSettings,
  messages: any[],
  image: string,
  profile: any
) {
  const anthropic = new Anthropic({
    apiKey: profile.anthropic_api_key || process.env.ANTHROPIC_API_KEY
  })

  const formattedMessages = messages.map(msg => ({
    role: msg.role,
    content:
      msg.role === "user" && messages.indexOf(msg) === messages.length - 1
        ? [
            {
              type: "image",
              source: { type: "base64", media_type: "image/jpeg", data: image }
            },
            { type: "text", text: msg.content }
          ]
        : [{ type: "text", text: msg.content }]
  }))

  return await anthropic.messages.create({
    model: chatSettings.model.replace("anthropic/", ""),
    max_tokens: 1024,
    messages: formattedMessages,
    temperature: chatSettings.temperature,
    stream: true
  })
}

async function handleGoogleWithImage(
  chatSettings: ChatSettings,
  messages: any[],
  image: string,
  profile: any
) {
  const genAI = new GoogleGenerativeAI(
    profile.google_api_key || process.env.GOOGLE_API_KEY
  )
  const model = genAI.getGenerativeModel({
    model: chatSettings.model.replace("google/", "")
  })

  const formattedPrompt = [
    ...messages.map(msg => msg.content),
    {
      inlineData: {
        mimeType: "image/jpeg",
        data: image
      }
    }
  ]

  return await model.generateContentStream(formattedPrompt)
}
