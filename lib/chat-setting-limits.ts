import { LLMID } from "@/types"

type ChatSettingLimits = {
  MIN_TEMPERATURE: number
  MAX_TEMPERATURE: number
  MAX_TOKEN_OUTPUT_LENGTH: number
  MAX_CONTEXT_LENGTH: number
}

export const CHAT_SETTING_LIMITS: Record<LLMID, ChatSettingLimits> = {
  // ANTHROPIC MODELS
  "claude-2.1": {
    MIN_TEMPERATURE: 0.0,
    MAX_TEMPERATURE: 1.0,
    MAX_TOKEN_OUTPUT_LENGTH: 4096,
    MAX_CONTEXT_LENGTH: 200000
  },
  "claude-instant-1.2": {
    MIN_TEMPERATURE: 0.0,
    MAX_TEMPERATURE: 1.0,
    MAX_TOKEN_OUTPUT_LENGTH: 4096,
    MAX_CONTEXT_LENGTH: 100000
  },
  "claude-3-haiku-20240307": {
    MIN_TEMPERATURE: 0.0,
    MAX_TEMPERATURE: 1.0,
    MAX_TOKEN_OUTPUT_LENGTH: 4096,
    MAX_CONTEXT_LENGTH: 200000
  },
  "claude-3-sonnet-20240229": {
    MIN_TEMPERATURE: 0.0,
    MAX_TEMPERATURE: 1.0,
    MAX_TOKEN_OUTPUT_LENGTH: 4096,
    MAX_CONTEXT_LENGTH: 200000
  },
  "claude-3-opus-20240229": {
    MIN_TEMPERATURE: 0.0,
    MAX_TEMPERATURE: 1.0,
    MAX_TOKEN_OUTPUT_LENGTH: 4096,
    MAX_CONTEXT_LENGTH: 200000
  },
  "claude-3-5-sonnet-20240620": {
    MIN_TEMPERATURE: 0.0,
    MAX_TEMPERATURE: 1.0,
    MAX_TOKEN_OUTPUT_LENGTH: 8192,
    MAX_CONTEXT_LENGTH: 200000
  },

  // GOOGLE MODELS
  "gemini-pro": {
    MIN_TEMPERATURE: 0.0,
    MAX_TEMPERATURE: 1.0,
    MAX_TOKEN_OUTPUT_LENGTH: 2048,
    MAX_CONTEXT_LENGTH: 30720
  },
  "gemini-pro-vision": {
    MIN_TEMPERATURE: 0.0,
    MAX_TEMPERATURE: 1.0,
    MAX_TOKEN_OUTPUT_LENGTH: 4096,
    MAX_CONTEXT_LENGTH: 12288
  },
  "gemini-1.5-pro-latest": {
    MIN_TEMPERATURE: 0.0,
    MAX_TEMPERATURE: 1.0,
    MAX_TOKEN_OUTPUT_LENGTH: 4096,
    MAX_CONTEXT_LENGTH: 1000000
  },
  "gemini-1.5-flash-latest": {
    MIN_TEMPERATURE: 0.0,
    MAX_TEMPERATURE: 1.0,
    MAX_TOKEN_OUTPUT_LENGTH: 4096,
    MAX_CONTEXT_LENGTH: 1000000
  },
  // MISTRAL MODELS
  "mistral-tiny": {
    MIN_TEMPERATURE: 0.0,
    MAX_TEMPERATURE: 1.0,
    MAX_TOKEN_OUTPUT_LENGTH: 2000,
    MAX_CONTEXT_LENGTH: 8000
  },
  "mistral-small": {
    MIN_TEMPERATURE: 0.0,
    MAX_TEMPERATURE: 1.0,
    MAX_TOKEN_OUTPUT_LENGTH: 2000,
    MAX_CONTEXT_LENGTH: 32000
  },
  "mistral-medium": {
    MIN_TEMPERATURE: 0.0,
    MAX_TEMPERATURE: 1.0,
    MAX_TOKEN_OUTPUT_LENGTH: 2000,
    MAX_CONTEXT_LENGTH: 32000
  },
  "mistral-large-latest": {
    MIN_TEMPERATURE: 0.0,
    MAX_TEMPERATURE: 1.0,
    MAX_TOKEN_OUTPUT_LENGTH: 2000,
    MAX_CONTEXT_LENGTH: 32000
  },

  // GROQ MODELS
  // "llama2-70b-4096": {
  //   MIN_TEMPERATURE: 0.0,
  //   MAX_TEMPERATURE: 1.0,
  //   MAX_TOKEN_OUTPUT_LENGTH: 4096,
  //   MAX_CONTEXT_LENGTH: 4096
  // },
  "mixtral-8x7b-32768": {
    MIN_TEMPERATURE: 0.0,
    MAX_TEMPERATURE: 1.0,
    MAX_TOKEN_OUTPUT_LENGTH: 4096,
    MAX_CONTEXT_LENGTH: 32768
  },
  "llama3-70b-8192": {
    MIN_TEMPERATURE: 0.0,
    MAX_TEMPERATURE: 1.0,
    MAX_TOKEN_OUTPUT_LENGTH: 8192,
    MAX_CONTEXT_LENGTH: 8192
  },
  "llama-3.1-70b-versatile": {
    MIN_TEMPERATURE: 0.0,
    MAX_TEMPERATURE: 1.0,
    MAX_TOKEN_OUTPUT_LENGTH: 8192,
    MAX_CONTEXT_LENGTH: 128000
  },
  "llama3-8b-8192": {
    MIN_TEMPERATURE: 0.0,
    MAX_TEMPERATURE: 1.0,
    MAX_TOKEN_OUTPUT_LENGTH: 8192,
    MAX_CONTEXT_LENGTH: 8192
  },
  "llama3-groq-70b-8192-tool-use-preview": {
    MIN_TEMPERATURE: 0.0,
    MAX_TEMPERATURE: 1.0,
    MAX_TOKEN_OUTPUT_LENGTH: 8192,
    MAX_CONTEXT_LENGTH: 8192
  },

  // OPENAI MODELS
  "gpt-3.5-turbo": {
    MIN_TEMPERATURE: 0.0,
    MAX_TEMPERATURE: 2.0,
    MAX_TOKEN_OUTPUT_LENGTH: 4096,
    MAX_CONTEXT_LENGTH: 4096
    // MAX_CONTEXT_LENGTH: 16385 (TODO: Change this back to 16385 when OpenAI bumps the model)
  },
  "gpt-3.5-turbo-0125": {
    MIN_TEMPERATURE: 0.0,
    MAX_TEMPERATURE: 2.0,
    MAX_TOKEN_OUTPUT_LENGTH: 4096,
    // MAX_CONTEXT_LENGTH: 4096
    MAX_CONTEXT_LENGTH: 16385
  },
  "gpt-4-turbo-preview": {
    MIN_TEMPERATURE: 0.0,
    MAX_TEMPERATURE: 2.0,
    MAX_TOKEN_OUTPUT_LENGTH: 4096,
    MAX_CONTEXT_LENGTH: 128000
  },
  "gpt-4-turbo": {
    MIN_TEMPERATURE: 0.0,
    MAX_TEMPERATURE: 2.0,
    MAX_TOKEN_OUTPUT_LENGTH: 4096,
    MAX_CONTEXT_LENGTH: 128000
  },
  "gpt-4o": {
    MIN_TEMPERATURE: 0.0,
    MAX_TEMPERATURE: 2.0,
    MAX_TOKEN_OUTPUT_LENGTH: 16384,
    MAX_CONTEXT_LENGTH: 128000
  },
  "gpt-4o-2024-08-06": {
    MIN_TEMPERATURE: 0.0,
    MAX_TEMPERATURE: 2.0,
    MAX_TOKEN_OUTPUT_LENGTH: 16384,
    MAX_CONTEXT_LENGTH: 128000
  },
  "gpt-4o-mini": {
    MIN_TEMPERATURE: 0.0,
    MAX_TEMPERATURE: 2.0,
    MAX_TOKEN_OUTPUT_LENGTH: 16384,
    MAX_CONTEXT_LENGTH: 128000
  },
  "gpt-4-vision-preview": {
    MIN_TEMPERATURE: 0.0,
    MAX_TEMPERATURE: 2.0,
    MAX_TOKEN_OUTPUT_LENGTH: 4096,
    MAX_CONTEXT_LENGTH: 128000
  },
  "gpt-4": {
    MIN_TEMPERATURE: 0.0,
    MAX_TEMPERATURE: 2.0,
    MAX_TOKEN_OUTPUT_LENGTH: 4096,
    MAX_CONTEXT_LENGTH: 8192
  },

  // PERPLEXITY MODELS
  "pplx-7b-online": {
    MIN_TEMPERATURE: 0.0,
    MAX_TEMPERATURE: 1.99,
    MAX_TOKEN_OUTPUT_LENGTH: 4096,
    MAX_CONTEXT_LENGTH: 4096
  },
  "pplx-70b-online": {
    MIN_TEMPERATURE: 0.0,
    MAX_TEMPERATURE: 1.99,
    MAX_TOKEN_OUTPUT_LENGTH: 4096,
    MAX_CONTEXT_LENGTH: 4096
  },
  "pplx-7b-chat": {
    MIN_TEMPERATURE: 0.0,
    MAX_TEMPERATURE: 1.0,
    MAX_TOKEN_OUTPUT_LENGTH: 4096,
    MAX_CONTEXT_LENGTH: 8192
  },
  "pplx-70b-chat": {
    MIN_TEMPERATURE: 0.0,
    MAX_TEMPERATURE: 1.0,
    MAX_TOKEN_OUTPUT_LENGTH: 4096,
    MAX_CONTEXT_LENGTH: 4096
  },
  "mixtral-8x7b-instruct": {
    MIN_TEMPERATURE: 0.0,
    MAX_TEMPERATURE: 1.0,
    MAX_TOKEN_OUTPUT_LENGTH: 16384,
    MAX_CONTEXT_LENGTH: 16384
  },
  "mistral-7b-instruct": {
    MIN_TEMPERATURE: 0.0,
    MAX_TEMPERATURE: 1.0,
    MAX_TOKEN_OUTPUT_LENGTH: 16384,
    MAX_CONTEXT_LENGTH: 16384
  },
  "llama-2-70b-chat": {
    MIN_TEMPERATURE: 0.0,
    MAX_TEMPERATURE: 2.0,
    MAX_TOKEN_OUTPUT_LENGTH: 4096,
    MAX_CONTEXT_LENGTH: 4096
  },
  "codellama-34b-instruct": {
    MIN_TEMPERATURE: 0.0,
    MAX_TEMPERATURE: 1.0,
    MAX_TOKEN_OUTPUT_LENGTH: 4096,
    MAX_CONTEXT_LENGTH: 16384
  },
  "codellama-70b-instruct": {
    MIN_TEMPERATURE: 0.0,
    MAX_TEMPERATURE: 1.0,
    MAX_TOKEN_OUTPUT_LENGTH: 16384,
    MAX_CONTEXT_LENGTH: 16384
  },
  "llama-3-sonar-small-32k-chat": {
    MIN_TEMPERATURE: 0.0,
    MAX_TEMPERATURE: 1.0,
    MAX_TOKEN_OUTPUT_LENGTH: 16384,
    MAX_CONTEXT_LENGTH: 16384
  },
  "llama-3-sonar-small-32k-online": {
    MIN_TEMPERATURE: 0.0,
    MAX_TEMPERATURE: 1.0,
    MAX_TOKEN_OUTPUT_LENGTH: 12000,
    MAX_CONTEXT_LENGTH: 12000
  },
  "llama-3-sonar-large-32k-chat": {
    MIN_TEMPERATURE: 0.0,
    MAX_TEMPERATURE: 1.0,
    MAX_TOKEN_OUTPUT_LENGTH: 16384,
    MAX_CONTEXT_LENGTH: 16384
  },
  "llama-3-sonar-large-32k-online": {
    MIN_TEMPERATURE: 0.0,
    MAX_TEMPERATURE: 1.0,
    MAX_TOKEN_OUTPUT_LENGTH: 12000,
    MAX_CONTEXT_LENGTH: 12000
  },

  //openrouter models

  // OPENAI MODELS
  "openai/o1-mini": {
    MIN_TEMPERATURE: 0,
    MAX_TEMPERATURE: 1,
    MAX_TOKEN_OUTPUT_LENGTH: 65536,
    MAX_CONTEXT_LENGTH: 128000
  },
  "openai/o1-preview": {
    MIN_TEMPERATURE: 0,
    MAX_TEMPERATURE: 1,
    MAX_TOKEN_OUTPUT_LENGTH: 32768,
    MAX_CONTEXT_LENGTH: 128000
  },
  "openai/gpt-4o-2024-08-06": {
    MIN_TEMPERATURE: 0,
    MAX_TEMPERATURE: 1,
    MAX_TOKEN_OUTPUT_LENGTH: 16384,
    MAX_CONTEXT_LENGTH: 128000
  },
  "openai/gpt-4-vision-preview": {
    MIN_TEMPERATURE: 0,
    MAX_TEMPERATURE: 0,
    MAX_TOKEN_OUTPUT_LENGTH: 0,
    MAX_CONTEXT_LENGTH: 0
  },
  "openai/gpt-4o-mini": {
    MIN_TEMPERATURE: 0,
    MAX_TEMPERATURE: 1,
    MAX_TOKEN_OUTPUT_LENGTH: 16384,
    MAX_CONTEXT_LENGTH: 128000
  },

  // ANTHROPIC MODELS
  "anthropic/claude-3.5-sonnet": {
    MIN_TEMPERATURE: 0,
    MAX_TEMPERATURE: 1,
    MAX_TOKEN_OUTPUT_LENGTH: 8192,
    MAX_CONTEXT_LENGTH: 200000
  },
  "anthropic/claude-3-haiku": {
    MIN_TEMPERATURE: 0,
    MAX_TEMPERATURE: 1,
    MAX_TOKEN_OUTPUT_LENGTH: 4096,
    MAX_CONTEXT_LENGTH: 200000
  },

  // GOOGLE MODELS
  "google/gemini-pro-1.5-exp": {
    MIN_TEMPERATURE: 0,
    MAX_TEMPERATURE: 1,
    MAX_TOKEN_OUTPUT_LENGTH: 32768,
    MAX_CONTEXT_LENGTH: 4000000
  },
  "google/gemini-flash-1.5-exp": {
    MIN_TEMPERATURE: 0,
    MAX_TEMPERATURE: 1,
    MAX_TOKEN_OUTPUT_LENGTH: 32768,
    MAX_CONTEXT_LENGTH: 4000000
  },
  "google/gemini-pro-1.5": {
    MIN_TEMPERATURE: 0,
    MAX_TEMPERATURE: 1,
    MAX_TOKEN_OUTPUT_LENGTH: 32768,
    MAX_CONTEXT_LENGTH: 4000000
  },
  "google/gemini-pro-vision": {
    MIN_TEMPERATURE: 0,
    MAX_TEMPERATURE: 0,
    MAX_TOKEN_OUTPUT_LENGTH: 0,
    MAX_CONTEXT_LENGTH: 0
  },

  "databricks/dbrx-instruct": {
    MIN_TEMPERATURE: 0,
    MAX_TEMPERATURE: 1,
    MAX_TOKEN_OUTPUT_LENGTH: 0,
    MAX_CONTEXT_LENGTH: 0
  },
  "cohere/command-r-plus-08-2024": {
    MIN_TEMPERATURE: 0,
    MAX_TEMPERATURE: 1,
    MAX_TOKEN_OUTPUT_LENGTH: 4000,
    MAX_CONTEXT_LENGTH: 128000
  },
  "mistralai/mixtral-8x22b-instruct": {
    MIN_TEMPERATURE: 0,
    MAX_TEMPERATURE: 1,
    MAX_TOKEN_OUTPUT_LENGTH: 0,
    MAX_CONTEXT_LENGTH: 0
  },
  "meta-llama/llama-3-70b-instruct": {
    MIN_TEMPERATURE: 0,
    MAX_TEMPERATURE: 1,
    MAX_TOKEN_OUTPUT_LENGTH: 0,
    MAX_CONTEXT_LENGTH: 0
  },
  "microsoft/wizardlm-2-8x22b": {
    MIN_TEMPERATURE: 0,
    MAX_TEMPERATURE: 1,
    MAX_TOKEN_OUTPUT_LENGTH: 0,
    MAX_CONTEXT_LENGTH: 0
  },

  "liuhaotian/llava-yi-34b": {
    MIN_TEMPERATURE: 0,
    MAX_TEMPERATURE: 1,
    MAX_TOKEN_OUTPUT_LENGTH: 0,
    MAX_CONTEXT_LENGTH: 0
  },
  "fireworks/firellava-13b": {
    MIN_TEMPERATURE: 0,
    MAX_TEMPERATURE: 1,
    MAX_TOKEN_OUTPUT_LENGTH: 0,
    MAX_CONTEXT_LENGTH: 0
  },

  "perplexity/llama-3.1-sonar-huge-128k-online": {
    MIN_TEMPERATURE: 0,
    MAX_TEMPERATURE: 1,
    MAX_TOKEN_OUTPUT_LENGTH: 0,
    MAX_CONTEXT_LENGTH: 0
  },
  "mattshumer/reflection-70b": {
    MIN_TEMPERATURE: 0,
    MAX_TEMPERATURE: 1,
    MAX_TOKEN_OUTPUT_LENGTH: 0,
    MAX_CONTEXT_LENGTH: 0
  },
  "deepseek/deepseek-chat": {
    MIN_TEMPERATURE: 0,
    MAX_TEMPERATURE: 1,
    MAX_TOKEN_OUTPUT_LENGTH: 4096,
    MAX_CONTEXT_LENGTH: 128000
  }
}
