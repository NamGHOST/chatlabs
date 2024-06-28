import { Tables } from "@/supabase/types"
import { LLM, LLMID, OpenRouterLLM } from "@/types"
import { toast } from "sonner"
import { LLM_LIST_MAP } from "./llm/llm-list"
import { GROQ_LLM_LIST } from "./llm/groq-llm-list"

const KNOWN_MODEL_NAMES: {
  [key: string]: {
    modelProvider: string
    modelName: string
  }
} = {
  "openai/gpt-4o-2024-05-13": {
    modelProvider: "openai",
    modelName: "GPT-4o"
  },
  "openai/gpt-4-vision-preview": {
    modelProvider: "openai",
    modelName: "GPT-4 Vision Preview"
  },
  "google/gemini-pro-1.5": {
    modelProvider: "google",
    modelName: "Gemini Pro 1.5"
  },
  "google/gemini-pro-vision": {
    modelProvider: "google",
    modelName: "Gemini Pro Vision"
  },
  "liuhaotian/llava-yi-34b": {
    modelProvider: "liuhaotian",
    modelName: "Llava Yi 34b"
  },
  "fireworks/firellava-13b": {
    modelProvider: "fireworks",
    modelName: "Firellava 13b"
  },
  "anthropic/claude-3-haiku": {
    modelProvider: "anthropic",
    modelName: "Claude 3 Haiku"
  },
  "anthropic/claude-3-sonnet": {
    modelProvider: "anthropic",
    modelName: "Claude 3 Sonnet"
  },
  "qwen/qwen-2-72b-instruct": {
    modelProvider: "qwen",
    modelName: "Qwen 2 72b Instruct"
  },
  "cognitivecomputations/dolphin-mixtral-8x22b": {
    modelProvider: "cognitivecomputations",
    modelName: "Dolphin Mixtral 8x22b"
  },
  "meta-llama/llama-3-70b": {
    modelProvider: "meta-llama",
    modelName: "Llama 3 70b"
  },
  "cohere/command-r-plus": {
    modelProvider: "cohere",
    modelName: "Command R Plus"
  },
  "01-ai/yi-34b-chat": {
    modelProvider: "01-ai",
    modelName: "Yi 34b Chat"
  },
  "openai/gpt-3.5-turbo-16k": {
    modelProvider: "openai",
    modelName: "GPT-3.5 Turbo 16k"
  },
  "mistralai/mistral-medium": {
    modelProvider: "mistralai",
    modelName: "Mistral Medium"
  },
  "perplexity/llama-3-sonar-large-32k-online": {
    modelProvider: "perplexity",
    modelName: "Llama 3 Sonar Large 32k Online"
  },
  "perplexity/llama-3-sonar-large-32k-chat": {
    modelProvider: "perplexity",
    modelName: "Llama 3 Sonar Large 32k Chat"
  },
  "google/gemini-flash-1.5": {
    modelProvider: "google",
    modelName: "Gemini Flash 1.5"
  }
}

export function parseOpenRouterModelName(modelId: string) {
  if (Object.keys(KNOWN_MODEL_NAMES).includes(modelId)) {
    return KNOWN_MODEL_NAMES[modelId]
  }

  const openRouterModelRegex = /^(.+)\/(.+)(:+)?$/
  const match = modelId?.match(openRouterModelRegex)
  const modelProvider = match ? match[1] : "openrouter"
  const modelName = match ? humanize(match[2]) : modelId

  return {
    modelProvider: modelProvider,
    modelName
  }
}

function parseSupportedModelsFromEnv() {
  let SUPPORTED_OPENROUTER_MODELS = [
    "databricks/dbrx-instruct",
    "cohere/command-r-plus",
    "mistralai/mixtral-8x22b-instruct",
    "microsoft/wizardlm-2-8x22b",
    "meta-llama/llama-3-70b-instruct"
  ]

  if (process.env.NEXT_PUBLIC_OPENROUTER_MODELS) {
    SUPPORTED_OPENROUTER_MODELS = (
      process.env.NEXT_PUBLIC_OPENROUTER_MODELS + ""
    )
      .split(",")
      .map(model => model.trim())
  }

  return SUPPORTED_OPENROUTER_MODELS
}

function humanize(str: string) {
  str = str.replace(/-/g, " ")
  // Capitalize first letter of each word
  return str.replace(/\b\w/g, l => l.toUpperCase())
}

export const fetchHostedModels = async (
  profile: Tables<"profiles"> | null | undefined
) => {
  try {
    const providers = ["google", "anthropic", "mistral", "perplexity"]

    if (profile?.use_azure_openai) {
      providers.push("azure")
    } else {
      providers.push("openai")
    }

    const response = await fetch("/api/keys")

    if (!response.ok) {
      throw new Error(`Server is not responding.`)
    }

    const data = await response.json()

    let modelsToAdd: LLM[] = []

    for (const provider of providers) {
      const models = LLM_LIST_MAP[provider]

      if (!Array.isArray(models)) {
        continue
      }

      if (profile) {
        let providerKey: keyof typeof profile

        if (provider === "google") {
          providerKey = "google_gemini_api_key"
        } else if (provider === "azure") {
          providerKey = "azure_openai_api_key"
        } else {
          providerKey = `${provider}_api_key` as keyof typeof profile
        }

        if (!profile?.[providerKey]) {
          modelsToAdd.push(...models)
          continue
        }
      }

      if (data.isUsingEnvKeyMap[provider]) {
        modelsToAdd.push(...models)
      }
    }

    return {
      envKeyMap: data.isUsingEnvKeyMap,
      hostedModels: modelsToAdd
    }
  } catch (error) {
    console.warn("Error fetching hosted models: " + error)
  }
}

export const fetchOllamaModels = async () => {
  try {
    const response = await fetch(
      process.env.NEXT_PUBLIC_OLLAMA_URL + "/api/tags"
    )

    if (!response.ok) {
      throw new Error(`Ollama server is not responding.`)
    }

    const data = await response.json()

    const localModels: LLM[] = data.models.map((model: any) => ({
      modelId: model.name as LLMID,
      modelName: model.name,
      provider: "ollama",
      hostedId: model.name,
      platformLink: "https://ollama.ai/library",
      imageInput: false
    }))

    return localModels
  } catch (error) {
    console.warn("Error fetching Ollama models: " + error)
  }
}

export const fetchOpenRouterModels = async (plan: string) => {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/models")

    if (!response.ok) {
      throw new Error(`OpenRouter server is not responding.`)
    }

    const { data } = await response.json()

    const byokModel = [
      "openai/gpt-4o-2024-05-13",
      "openai/gpt-4-vision-preview",
      "google/gemini-pro-1.5",
      "google/gemini-pro-vision",
      "liuhaotian/llava-yi-34b",
      "fireworks/firellava-13b",
      "anthropic/claude-3-haiku",
      "anthropic/claude-3.5-sonnet",
      "qwen/qwen-2-72b-instruct",
      "cognitivecomputations/dolphin-mixtral-8x22b",
      "meta-llama/llama-3-70b",
      "cohere/command-r-plus",
      "01-ai/yi-34b-chat",
      "openai/gpt-3.5-turbo-16k",
      "mistralai/mistral-medium",
      "perplexity/llama-3-sonar-large-32k-online",
      "perplexity/llama-3-sonar-large-32k-chat",
      "google/gemini-flash-1.5",
      "deepseek/deepseek-coder",
      "nvidia/nemotron-4-340b-instruct"
    ]

    const proModel = ["meta-llama/llama-3-70b-instruct"]

    const openRouterModels = data
      .map(
        (model: {
          id: string
          name: string
          context_length: number
          description: string
          pricing: {
            completion: string
            image: string
            prompt: string
          }
        }): OpenRouterLLM => ({
          modelId: model.id as LLMID,
          modelName: model.name,
          provider: "openrouter",
          hostedId: model.id,
          platformLink: "https://openrouter.dev",
          imageInput: true,
          maxContext: model.context_length,
          description: model.description,
          pricing: {
            currency: "USD",
            inputCost: parseFloat(model.pricing.prompt) * 1000000,
            outputCost: parseFloat(model.pricing.completion) * 1000000,
            unit: "1M tokens"
          }
        })
      )
      .filter(({ modelId }: { modelId: string }) => {
        if (plan.includes("byok")) {
          return byokModel.includes(modelId)
        }
        if (plan.includes("pro")) {
          return [...byokModel, ...proModel].includes(modelId)
        }
        return []
      })
      .map((model: any) => {
        const { modelName } = parseOpenRouterModelName(model.modelId)
        return {
          ...model,
          modelName
        }
      })

    return openRouterModels
  } catch (error) {
    console.error("Error fetching Open Router models: " + error)
    toast.error("Error fetching Open Router models: " + error)
  }
}

export const fetchGroqModels = async () => {
  return GROQ_LLM_LIST
}
