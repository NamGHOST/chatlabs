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
import { OPENAI_LLM_LIST } from "@/lib/models/llm/openai-llm-list"
import { CHAT_SETTING_LIMITS } from "@/lib/chat-setting-limits"
import axios from "axios"

export const runtime: ServerRuntime = "edge"

export async function POST(request: Request) {
  const json = await request.json()
  const { chatSettings, messages } = json as {
    chatSettings: ChatSettings
    messages: any[]
  }

  try {
    const profile = await getServerProfile()

    checkApiKey(profile.openai_api_key, "OpenAI")

    await validateModelAndMessageCount(chatSettings.model, new Date())

    const params = {
      api_key: process.env.GOOGLE_API_KEY || "08467AECD4454E2BAD025E48B5E23FC3",
      search_type: "images",
      q: messages[messages.length - 1].content
    }
    console.log(params)

    const image_url: any[] = []

    const res = await axios.get("https://api.scaleserp.com/search", { params })

    for (let i = 0; i < 5; i++) {
      image_url.push(res.data.image_results[i].image)
    }

    const prompt = `
      Since the provided URLs are directly associated with the results, ensure to include them accurately in your response.
      ${image_url}

      User's Qeustion: ${messages[messages.length - 1].content}
    `
    console.log(image_url)
    messages[messages.length - 1].content = prompt

    const openai = new OpenAI({
      apiKey: profile.openai_api_key || "",
      organization: profile.openai_organization_id,
      baseURL: process.env.OPENAI_BASE_URL || undefined
    })

    const supportsVision =
      OPENAI_LLM_LIST.find(x =>
        [x.modelId, x.hostedId].includes(chatSettings.model)
      )?.imageInput || false

    const response = await openai.chat.completions.create({
      model: chatSettings.model as ChatCompletionCreateParamsBase["model"],
      messages: messages as ChatCompletionCreateParamsBase["messages"],
      temperature: chatSettings.temperature,
      max_tokens: supportsVision
        ? CHAT_SETTING_LIMITS[chatSettings.model].MAX_TOKEN_OUTPUT_LENGTH
        : null,
      stream: true
    })

    const stream = OpenAIStream(response)

    return new StreamingTextResponse(stream)
  } catch (error: any) {
    let errorMessage = error.message || "An unexpected error occurred"
    const errorCode = error.status || 500

    if (errorMessage.toLowerCase().includes("api key not found")) {
      errorMessage =
        "OpenAI API Key not found. Please set it in your profile settings."
    } else if (errorMessage.toLowerCase().includes("incorrect api key")) {
      errorMessage =
        "OpenAI API Key is incorrect. Please fix it in your profile settings."
    }

    return new Response(JSON.stringify({ message: errorMessage }), {
      status: errorCode
    })
  }
}
