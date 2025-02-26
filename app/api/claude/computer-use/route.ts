import { LLM_LIST } from "@/lib/models/llm/llm-list"
import { ChatSettings } from "@/types"
import { AnthropicStream, StreamingTextResponse } from "ai"
import { ServerRuntime } from "next"
import OpenAI from "openai"
import { ChatCompletionCreateParamsBase } from "openai/resources/chat/completions.mjs"
import { OpenAIStream } from "ai"
import { ChatCompletionTool } from "openai/resources/chat/completions"

export const runtime: ServerRuntime = "edge"

export async function POST(request: Request) {
  const json = await request.json()
  const {
    chatSettings,
    messages,
    provider = "openrouter"
  } = json as {
    chatSettings: ChatSettings
    messages: any[]
    provider?: "openrouter" | "anthropic"
  }

  try {
    // Initialize appropriate client based on provider
    let client: OpenAI

    if (provider === "openrouter") {
      client = new OpenAI({
        apiKey: process.env.OPENROUTER_API_KEY || "",
        baseURL: "https://openrouter.ai/api/v1",
        defaultHeaders: {
          "HTTP-Referer":
            process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
          "X-Title": "Chrome Extension Agent",
          "X-Description": "AI Assistant for computer automation"
        }
      })
    } else {
      // Direct Anthropic integration if needed
      client = new OpenAI({
        apiKey: process.env.ANTHROPIC_API_KEY || "",
        baseURL: "https://api.anthropic.com/v1"
      })
    }

    const computerUseTools: ChatCompletionTool[] = [
      {
        type: "function",
        function: {
          name: "bash_20241022",
          description: "Execute bash commands in a secure environment",
          parameters: {
            type: "object",
            properties: {
              command: {
                type: "string",
                description: "The bash command to execute"
              }
            },
            required: ["command"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "text_editor_20241022",
          description: "Create or edit text files",
          parameters: {
            type: "object",
            properties: {
              action: { type: "string", enum: ["read", "write", "append"] },
              path: { type: "string" },
              content: { type: "string" }
            },
            required: ["action", "path"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "computer_20241022",
          description:
            "Perform computer operations like clicking, typing, or navigating",
          parameters: {
            type: "object",
            properties: {
              action: {
                type: "string",
                enum: ["click", "type", "press_key", "move_mouse"]
              },
              x: { type: "number" },
              y: { type: "number" },
              text: { type: "string" }
            },
            required: ["action"]
          }
        }
      }
    ]

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
              model: chatSettings.model || "anthropic/claude-3.7-sonnet",
              messages: messages,
              temperature: chatSettings.temperature || 0.7,
              tools: computerUseTools,
              tool_choice: "auto",
              stream: true
            })
          }
        )

        if (!completion.ok) {
          const error = await completion.text()
          throw new Error(
            `OpenRouter API error: ${completion.status} - ${error}`
          )
        }

        return new StreamingTextResponse(completion.body!)
      } catch (error) {
        console.error("OpenRouter error:", error)
        throw error
      }
    } else {
      // Direct Anthropic API call if needed
      const response = await client.chat.completions.create({
        model: "claude-3.5-sonnet",
        messages: messages,
        tools: computerUseTools,
        tool_choice: "auto",
        temperature: chatSettings.temperature || 0.7,
        stream: true
      })

      const stream = OpenAIStream(response)
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
          : "Anthropic API Key not found. Please check your environment variables."
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
