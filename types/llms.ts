import { ModelProvider } from "."

export type LLMID =
  | OpenAILLMID
  | GoogleLLMID
  | AnthropicLLMID
  | MistralLLMID
  | GroqLLMID
  | PerplexityLLMID
  | OpenRouterLLMID

// OpenAI Models (UPDATED 1/29/24)
export type OpenAILLMID =
  | "gpt-4-turbo-preview" // GPT-4 Turbo
  | "gpt-4-vision-preview" // GPT-4 Vision
  | "gpt-4" // GPT-4
  | "gpt-3.5-turbo" // Updated GPT-3.5 Turbo
  // | "gpt-3.5-turbo-1106" // GPT-3.5
  | "gpt-3.5-turbo-0125" // GPT-3.5
  | "gpt-4-turbo" // GPT-4 Turbo
  | "gpt-4o" // GPT-4o
  | "gpt-4o-mini" // GPT-4 Vision
  | "gpt-4o-2024-11-20" // GPT-4o (updated 8/6/24)
  | "o1-mini" // O1 Mini
  | "o1" // O1

// Google Models
export type GoogleLLMID =
  | "gemini-pro" // Gemini Pro
  | "gemini-pro-vision" // Gemini Pro Vision
  | "gemini-1.5-pro-latest" // Gemini 1.5 Pro
  | "gemini-1.5-flash-latest" // Gemini 1.5 Latest

// Anthropic Models
export type AnthropicLLMID =
  | "claude-3-5-sonnet-20240620"
  | "claude-2.1" // Claude 2
  | "claude-instant-1.2" // Claude Instant
  | "claude-3-haiku-20240307" // Claude 3 Haiku
  | "claude-3-sonnet-20240229" // Claude 3 Sonnet
  | "claude-3-5-haiku-20241022" // Claude 3.5 HAIKU
// Mistral Models
export type MistralLLMID =
  | "mistral-tiny" // Mistral Tiny
  | "mistral-small" // Mistral Small
  | "mistral-medium" // Mistral Medium
  | "mistral-large-latest" // Mistral Large

export type GroqLLMID =
  | "mixtral-8x7b-32768" // Mixtral-8x7b
  | "gemma-7b-it" // Gemma 7B
  | "gemma2-9b-it" // Gemma 2 9B
  | "llama-3.3-70b-versatile" // Llama 3.3 70B
  | "llama-3.1-70b-versatile" // Llama 3.1 70B (DEPRECATED)
  | "llama-3.1-8b-instant" // Llama 3.1 8B Instant
  | "llama-guard-3-8b" // Llama Guard 3 8B
  | "llama3-70b-8192" // LLaMA3 70B
  | "llama3-8b-8192" // LLaMA3 8B
  | "deepseek-r1-distill-llama-70b" // LLaMA3 70B Tool Use Preview
  | "llama3-groq-8b-8192-tool-use-preview" // LLaMA3 8B Tool Use Preview
  | "llama-3.2-1b-preview" // Llama 3.2 1B Preview
  | "llama-3.2-3b-preview" // Llama 3.2 3B Preview
  | "llama-3.2-11b-vision-preview" // Llama 3.2 11B Vision Preview
  | "llama-3.2-90b-vision-preview" // Llama 3.2 90B Vision Preview

// Perplexity Models (UPDATED 1/31/24)

export type PerplexityLLMID =
  | "pplx-7b-online" // Perplexity Online 7B
  | "pplx-70b-online" // Perplexity Online 70B
  | "pplx-7b-chat" // Perplexity Chat 7B
  | "pplx-70b-chat" // Perplexity Chat 70B
  | "mixtral-8x7b-instruct" // Mixtral 8x7B Instruct
  | "mistral-7b-instruct" // Mistral 7B Instruct
  | "llama-2-70b-chat" // Llama2 70B Chat
  | "codellama-34b-instruct" // CodeLlama 34B Instruct
  | "codellama-70b-instruct" // CodeLlama 70B Instruct
  | "llama-3-sonar-small-32k-chat" // Sonar Small Chat
  | "llama-3-sonar-small-32k-online" // Sonar Small Online
  | "llama-3-sonar-large-32k-chat" // Sonar Medium Chat
  | "llama-3-sonar-large-32k-online" // Sonar Medium Online

// Add this new type definition
export type Category = {
  category: string
  description?: string
  color?: string
}

export type LLMTier = "free" | "pro" | "ultimate"
// Update the LLM interface to include categories
export type OpenRouterLLMID =
  | "openai/o3-mini"
  | "openai/o1"
  | "openai/gpt-4o-2024-11-20"
  | "openai/gpt-4o-mini"
  | "google/gemini-pro-1.5"
  | "google/gemini-pro-vision"
  | "google/gemini-2.0-flash-exp:free"
  | "google/gemini-2.0-flash-thinking-exp:free"
  | "google/gemini-flash-1.5-8b"
  | "anthropic/claude-3-haiku"
  | "anthropic/claude-3.5-haiku"
  | "anthropic/claude-3.5-sonnet"
  | "databricks/dbrx-instruct"
  | "mistralai/mixtral-8x22b-instruct"
  | "microsoft/wizardlm-2-8x22b"
  | "meta-llama/llama-3.1-405b-instruct"
  | "meta-llama/llama-3.2-90b-vision-instruct"
  | "meta-llama/llama-3.2-11b-vision-instruct"
  | "perplexity/sonar-reasoning"
  | "deepseek/deepseek-chat"
  | "deepseek/deepseek-r1"
  | "deepseek/deepseek-r1-distill-llama-70b"
  | "deepseek/deepseek-r1-distill-qwen-32b"
  | "deepseek/deepseek-r1-distill-qwen-14b"
  | "qwen/qwen-2.5-72b-instruct"
  | "qwen/qwen-2-vl-72b-instruct"
  | "cohere/command-r-plus-08-2024"
  | "cohere/command-r-08-2024"
  | "perplexity/sonar"
  | "x-ai/grok-2-1212"
  | "nvidia/llama-3.1-nemotron-70b-instruct"
  | "google/gemini-exp-1114"
  | "qwen/qwen-2.5-coder-32b-instruct"
  | "mistralai/pixtral-large-2411"
  | "meta-llama/llama-3.3-70b-instruct"
  | "amazon/nova-lite-v1"
  | "amazon/nova-micro-v1"
  | "amazon/nova-pro-v1"
  | "eva-unit-01/eva-qwen-2.5-72b"

export interface LLM {
  modelId: LLMID
  modelName: string
  provider: ModelProvider
  hostedId: string
  platformLink: string
  imageInput: boolean
  tools?: boolean
  supportsStreaming?: boolean
  description?: string
  tags?: string[]
  pricing?: {
    currency: string
    unit: string
    inputCost: number
    outputCost?: number
  }
  new?: boolean
  tier?: "free" | "pro" | "ultimate" | undefined
  categories?: Category[]
  include_reasoning?: boolean
}

export interface OpenRouterLLM extends LLM {
  modelId: LLMID
  modelName: string
  maxContext: number
  tools: boolean
  supportsStreaming: boolean
  imageInput: boolean
  description?: string
  tags?: string[]
  new?: boolean
  tier?: "free" | "pro" | "ultimate" | undefined
  categories?: Category[]
  include_reasoning?: boolean
}
