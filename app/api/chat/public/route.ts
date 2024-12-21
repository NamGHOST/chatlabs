import { LLM_LIST } from "@/lib/models/llm/llm-list"
import { ChatSettings } from "@/types"
import { OpenAIStream, StreamingTextResponse } from "ai"
import { ServerRuntime } from "next"
import OpenAI from "openai"
import { ChatCompletionCreateParamsBase } from "openai/resources/chat/completions.mjs"

export const runtime: ServerRuntime = "edge"

export async function POST(request: Request) {
  const json = await request.json()
  const {
    chatSettings,
    messages,
    response_format,
    provider = "openai"
  } = json as {
    chatSettings: ChatSettings
    messages: any[]
    response_format: any
    provider?: "openai" | "openrouter"
  }

  try {
    // Initialize appropriate client based on provider
    let openai: OpenAI

    if (provider === "openrouter") {
      openai = new OpenAI({
        apiKey: process.env.OPENROUTER_API_KEY || "",
        baseURL: "https://openrouter.ai/api/v1",
        defaultHeaders: {
          "HTTP-Referer":
            process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
          "X-Title": "Chrome Extension Agent",
          "X-Description": "AI Assistant for web automation and research"
        }
      })
    } else {
      openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY || "",
        baseURL: process.env.OPENAI_BASE_URL || undefined
      })
    }

    const supportsStreaming = LLM_LIST.find(model =>
      [model.modelId, model.hostedId].includes(chatSettings.model)
    )?.supportsStreaming

    // Prepare completion request based on provider
    const completionRequest =
      provider === "openrouter"
        ? {
            model: chatSettings.model,
            messages: messages,
            temperature: chatSettings.temperature || 0.7,
            stream: false, // Force non-streaming for extension
            max_tokens: 2000,
            presence_penalty: 0.1,
            frequency_penalty: 0.1
          }
        : {
            model: "gpt-4o-mini",
            messages: messages as ChatCompletionCreateParamsBase["messages"],
            response_format: response_format as any,
            stream: supportsStreaming || false
          }

    const response = await openai.chat.completions.create(completionRequest)

    if (provider === "openrouter") {
      try {
        const completion = await fetch(
          "https://openrouter.ai/api/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
              "HTTP-Referer":
                process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
              "X-Title": "Chrome Extension Agent"
            },
            body: JSON.stringify({
              model: chatSettings.model || "openai/gpt-4o-mini",
              messages: messages,
              temperature: chatSettings.temperature || 0.7,
              max_tokens: 2000
            })
          }
        )

        if (!completion.ok) {
          const error = await completion.text()
          console.error("OpenRouter error:", error)
          throw new Error(
            `OpenRouter API error: ${completion.status} - ${error}`
          )
        }

        const result = await completion.json()
        console.log("OpenRouter response:", result)

        // Format response for extension
        const responseData = {
          message: {
            role: "assistant",
            content:
              result.choices?.[0]?.message?.content || "No response generated"
          }
        }

        return new Response(JSON.stringify(responseData), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization"
          }
        })
      } catch (error) {
        console.error("OpenRouter error:", error)
        throw error
      }
    } else {
      // Handle OpenAI response as before
      if (!supportsStreaming) {
        return new Response((response as any).choices[0].message.content || "")
      }

      const stream = OpenAIStream(response as any)
      return new StreamingTextResponse(stream)
    }
  } catch (error: any) {
    console.error("API error:", error)

    let errorMessage = error.message || "An unexpected error occurred"
    const errorCode = error.status || 500

    // Handle provider-specific errors
    if (error.message?.toLowerCase().includes("api key not found")) {
      errorMessage =
        provider === "openrouter"
          ? "OpenRouter API Key not found. Please check your environment variables."
          : "OpenAI API Key not found. Please set it in your profile settings."
    } else if (error.message?.toLowerCase().includes("incorrect api key")) {
      errorMessage =
        provider === "openrouter"
          ? "OpenRouter API Key is incorrect. Please check your environment variables."
          : "OpenAI API Key is incorrect. Please fix it in your profile settings."
    }

    return new Response(
      JSON.stringify({
        error: errorMessage,
        provider,
        timestamp: new Date().toISOString()
      }),
      {
        status: errorCode,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      }
    )
  }
}

// Handle OPTIONS requests for CORS
export async function OPTIONS(request: Request) {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400" // 24 hours
    }
  })
}
