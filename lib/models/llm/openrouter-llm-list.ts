import { LLM } from "@/types"
import { CATEGORIES } from "../categories"
import { LLMTier } from "@/types"

const OPENROUTER_PLATFORM_LINK = "https://openrouter.ai/api/v1"

const O1_MINI: LLM = {
  modelId: "openai/o1-mini",
  modelName: "O1 Mini",
  provider: "openrouter",
  hostedId: "o1-mini",
  platformLink: OPENROUTER_PLATFORM_LINK,
  imageInput: false,
  tools: false,
  supportsStreaming: true,
  tier: "pro" as LLMTier,
  categories: [CATEGORIES.TECHNOLOGY]
}

const O1_PREVIEW: LLM = {
  modelId: "openai/o1",
  modelName: "O1",
  provider: "openrouter",
  hostedId: "o1",
  platformLink: OPENROUTER_PLATFORM_LINK,
  imageInput: true,
  tools: false,
  supportsStreaming: true,
  tier: "ultimate" as LLMTier
}

const GPT_4O: LLM = {
  modelId: "openai/gpt-4o-2024-11-20",
  modelName: "GPT-4o",
  provider: "openrouter",
  hostedId: "gpt-4o",
  platformLink: OPENROUTER_PLATFORM_LINK,
  imageInput: true,
  tools: true,
  tier: "pro" as LLMTier,
  supportsStreaming: true,
  pricing: {
    currency: "USD",
    unit: "1M tokens",
    inputCost: 2.5,
    outputCost: 10
  }
}

const GPT_4O_MINI: LLM = {
  modelId: "openai/gpt-4o-mini",
  modelName: "GPT-4o mini",
  provider: "openrouter",
  hostedId: "gpt-4o-mini",
  platformLink: OPENROUTER_PLATFORM_LINK,
  imageInput: true,
  tools: true,
  tier: "free" as LLMTier,
  supportsStreaming: true,
  new: false,
  pricing: {
    currency: "USD",
    unit: "1M tokens",
    inputCost: 0.15,
    outputCost: 0.6
  }
}

///google
const GEMINI_PRO_15: LLM = {
  modelId: "google/gemini-pro-1.5",
  modelName: "Gemini 1.5 Pro",
  provider: "openrouter",
  hostedId: "gemini-1.5-pro-latest",
  platformLink: OPENROUTER_PLATFORM_LINK,
  imageInput: true,
  tools: false,
  supportsStreaming: true,
  tier: "pro" as LLMTier
}

const GEMINI_FLASH_20_FLASH_THINKING: LLM = {
  modelId: "google/gemini-2.0-flash-thinking-exp:free",
  modelName: "Gemini 2.0 Flash Thinking Exp",
  provider: "openrouter",
  hostedId: "gemini-2.0-flash-thinking-exp",
  platformLink: OPENROUTER_PLATFORM_LINK,
  imageInput: false,
  tools: true,
  supportsStreaming: true,
  tier: "free" as LLMTier,
  new: true
}

const GEMINI_FLASH_20_FLASH: LLM = {
  modelId: "google/gemini-2.0-flash-exp:free",
  modelName: "Gemini Flash 2.0 Exp",
  provider: "openrouter",
  hostedId: "gemini-flash-2.0-exp",
  platformLink: OPENROUTER_PLATFORM_LINK,
  imageInput: false,
  tools: false,
  supportsStreaming: true,
  tier: "free" as LLMTier,
  new: true
}

///anthropic
const CLAUDE_3_HAIKU: LLM = {
  modelId: "anthropic/claude-3-haiku",
  modelName: "Claude 3 Haiku",
  provider: "openrouter",
  hostedId: "claude-3-haiku",
  platformLink: OPENROUTER_PLATFORM_LINK,
  imageInput: true,
  tools: false,
  supportsStreaming: true,
  tier: "free" as LLMTier
}

const CLAUDE_35_HAIKU: LLM = {
  modelId: "anthropic/claude-3.5-haiku",
  modelName: "Claude 3.5 Haiku",
  provider: "openrouter",
  hostedId: "claude-3.5-haiku-20241022:beta",
  platformLink: OPENROUTER_PLATFORM_LINK,
  imageInput: true,
  tools: false,
  supportsStreaming: true,
  tier: "pro" as LLMTier
}

const CLAUDE_35_SONNET: LLM = {
  modelId: "anthropic/claude-3.5-sonnet",
  modelName: "Claude 3.5 Sonnet",
  provider: "openrouter",
  hostedId: "claude-3.5-sonnet",
  platformLink: OPENROUTER_PLATFORM_LINK,
  imageInput: true,
  tools: true,
  supportsStreaming: true,
  tier: "pro" as LLMTier
}

///other
const DBRX_INSTRUCT: LLM = {
  modelId: "databricks/dbrx-instruct",
  modelName: "DBRX Instruct",
  provider: "openrouter",
  hostedId: "dbrx-instruct",
  platformLink: OPENROUTER_PLATFORM_LINK,
  imageInput: false,
  tools: false,
  supportsStreaming: true,
  tier: "free" as LLMTier
}

const MIXTRAL_8X22B: LLM = {
  modelId: "mistralai/mixtral-8x22b-instruct",
  modelName: "Mixtral 8x22B",
  provider: "openrouter",
  hostedId: "mixtral-8x22b-instruct",
  platformLink: OPENROUTER_PLATFORM_LINK,
  imageInput: false,
  tools: false,
  supportsStreaming: true,
  tier: "free" as LLMTier
}
const WIZARDLM_2_8X22B: LLM = {
  modelId: "microsoft/wizardlm-2-8x22b",
  modelName: "WizardLM 2 8x22B",
  provider: "openrouter",
  hostedId: "wizardlm-2-8x22b",
  platformLink: OPENROUTER_PLATFORM_LINK,
  imageInput: false,
  tools: false,
  supportsStreaming: true,
  tier: "free" as LLMTier
}

const META_LLAMA_3_1_405B: LLM = {
  modelId: "meta-llama/llama-3.1-405b-instruct",
  modelName: "Meta Llama 3.1 405B",
  provider: "openrouter",
  hostedId: "llama-3.1-405b-instruct",
  platformLink: OPENROUTER_PLATFORM_LINK,
  imageInput: false,
  tools: false,
  supportsStreaming: true,
  tier: "free" as LLMTier
}

const LLAMA_3_1_SONAR_HUGE_128K_ONLINE: LLM = {
  modelId: "perplexity/llama-3.1-sonar-huge-128k-online",
  modelName: "Llama 3.1 Sonar 405B Online",
  provider: "openrouter",
  hostedId: "llama-3.1-sonar-405b-online",
  platformLink: OPENROUTER_PLATFORM_LINK,
  imageInput: false,
  tools: false,
  supportsStreaming: true,
  tier: "pro" as LLMTier
}

const DEEPSEEK_CHAT: LLM = {
  modelId: "deepseek/deepseek-chat",
  modelName: "DeepSeek v3",
  provider: "openrouter",
  hostedId: "DeepSeek V3",
  platformLink: OPENROUTER_PLATFORM_LINK,
  imageInput: false,
  tools: true,
  supportsStreaming: true,
  tier: "free" as LLMTier,
  new: false
}

const DEEPSEEK_CHAT_R1: LLM = {
  modelId: "deepseek/deepseek-r1",
  modelName: "DeepSeek R1",
  provider: "openrouter",
  hostedId: "DeepSeek R1",
  platformLink: OPENROUTER_PLATFORM_LINK,
  imageInput: false,
  tools: false,
  supportsStreaming: true,
  tier: "pro" as LLMTier,
  new: true
}

const DEEPSEEK_CHAT_R1_DISTILL_LLAMA_70B: LLM = {
  modelId: "deepseek/deepseek-r1-distill-llama-70b",
  modelName: "DeepSeek R1 Distill Llama 70B",
  provider: "openrouter",
  hostedId: "DeepSeek: DeepSeek R1 Distill Llama 70B",
  platformLink: OPENROUTER_PLATFORM_LINK,
  imageInput: false,
  tools: false,
  supportsStreaming: true,
  tier: "free" as LLMTier,
  new: true
}

const LLAMA_32_90B_VISION: LLM = {
  modelId: "meta-llama/llama-3.2-90b-vision-instruct",
  modelName: "Llama 3.2 90B Vision",
  provider: "openrouter",
  hostedId: "llama-3.2-90b-vision-instruct",
  platformLink: OPENROUTER_PLATFORM_LINK,
  imageInput: true,
  tools: false,
  supportsStreaming: true,
  tier: "free" as LLMTier
}

const LLAMA_32_11B_VISION: LLM = {
  modelId: "meta-llama/llama-3.2-11b-vision-instruct",
  modelName: "Llama 3.2 11B Vision",
  provider: "openrouter",
  hostedId: "llama-3.2-11b-vision-instruct",
  platformLink: OPENROUTER_PLATFORM_LINK,
  imageInput: true,
  tools: false,
  supportsStreaming: true,
  tier: "free" as LLMTier
}

const QWEN_25_72B: LLM = {
  modelId: "qwen/qwen-2.5-72b-instruct",
  modelName: "Qwen 2.5 72B",
  provider: "openrouter",
  hostedId: "qwen-2.5-72b-instruct",
  platformLink: OPENROUTER_PLATFORM_LINK,
  imageInput: false,
  tools: false,
  supportsStreaming: true,
  tier: "free" as LLMTier
}

const QWEN_2_VL_72B: LLM = {
  modelId: "qwen/qwen-2-vl-72b-instruct",
  modelName: "Qwen 2 VL 72B",
  provider: "openrouter",
  hostedId: "qwen-2-vl-72b-instruct",
  platformLink: OPENROUTER_PLATFORM_LINK,
  imageInput: true,
  tools: false,
  supportsStreaming: true,
  tier: "free" as LLMTier
}

const COHERE_COMMAND_R_PLUS: LLM = {
  modelId: "cohere/command-r-plus-08-2024",
  modelName: "Command-R Plus (08/2024)",
  provider: "openrouter",
  hostedId: "command-r-plus-08-2024",
  platformLink: OPENROUTER_PLATFORM_LINK,
  imageInput: false,
  tools: true,
  supportsStreaming: true,
  tier: "pro" as LLMTier
}

const COHERE_COMMAND_R: LLM = {
  modelId: "cohere/command-r-08-2024",
  modelName: "Command-R (08/2024)",
  provider: "openrouter",
  hostedId: "command-r-08-2024",
  platformLink: OPENROUTER_PLATFORM_LINK,
  imageInput: false,
  tools: true,
  supportsStreaming: true,
  tier: "free" as LLMTier
}

const GEMINI_FLASH_15_8B: LLM = {
  modelId: "google/gemini-flash-1.5-8b",
  modelName: "Gemini Flash 1.5 8B",
  provider: "openrouter",
  hostedId: "gemini-flash-1.5-8b",
  platformLink: OPENROUTER_PLATFORM_LINK,
  imageInput: true,
  tools: false,
  supportsStreaming: true,
  tier: "free" as LLMTier
}

const LLAMA_31_SONAR_LARGE_128K_ONLINE: LLM = {
  modelId: "perplexity/llama-3.1-sonar-large-128k-online",
  modelName: "Llama 3.1 Sonar Large 70B Online",
  provider: "openrouter",
  hostedId: "llama-3.1-sonar-large-70B-online",
  platformLink: OPENROUTER_PLATFORM_LINK,
  imageInput: false,
  tools: false,
  supportsStreaming: true,
  tier: "free" as LLMTier
}

const GROK: LLM = {
  modelId: "x-ai/grok-2-1212",
  modelName: "Grok 2",
  provider: "openrouter",
  hostedId: "grok",
  platformLink: OPENROUTER_PLATFORM_LINK,
  imageInput: false,
  tools: true,
  supportsStreaming: true,
  tier: "pro" as LLMTier,
  new: true
}

const NVIDIA_LLAMA_31_NEMOTRON_70B: LLM = {
  modelId: "nvidia/llama-3.1-nemotron-70b-instruct",
  modelName: "Nvidia Llama 3.1 Nemotron 70B",
  provider: "openrouter",
  hostedId: "nvidia-llama-3.1-nemotron-70b-instruct",
  platformLink: OPENROUTER_PLATFORM_LINK,
  imageInput: false,
  tools: false,
  supportsStreaming: true,
  tier: "free" as LLMTier
}

const GEMINI_EXP_1114: LLM = {
  modelId: "google/gemini-exp-1114",
  modelName: "Gemini Exp 1114",
  provider: "openrouter",
  hostedId: "gemini-exp-1114",
  platformLink: OPENROUTER_PLATFORM_LINK,
  imageInput: false,
  tools: false,
  supportsStreaming: true,
  tier: "free" as LLMTier
}

const QWEN_25_CODER_32B: LLM = {
  modelId: "qwen/qwen-2.5-coder-32b-instruct",
  modelName: "Qwen 2.5 Coder 32B",
  provider: "openrouter",
  hostedId: "qwen-2.5-coder-32b-instruct",
  platformLink: OPENROUTER_PLATFORM_LINK,
  imageInput: false,
  tools: false,
  supportsStreaming: true,
  tier: "free" as LLMTier
}

const PIXTRAL_LARGE_2411: LLM = {
  modelId: "mistralai/pixtral-large-2411",
  modelName: "PixTral Large 2411",
  provider: "openrouter",
  hostedId: "pixtral-large-2411",
  platformLink: OPENROUTER_PLATFORM_LINK,
  imageInput: true,
  tools: false,
  supportsStreaming: true,
  tier: "pro" as LLMTier
}

const META_LLAMA_3_3_70B_INSTRUCT: LLM = {
  modelId: "meta-llama/llama-3.3-70b-instruct",
  modelName: "Meta Llama 3.3 70B Instruct",
  provider: "openrouter",
  hostedId: "llama-3.3-70b-instruct",
  platformLink: OPENROUTER_PLATFORM_LINK,
  imageInput: false,
  tools: true,
  supportsStreaming: true,
  tier: "free" as LLMTier,
  new: true
}

const AMAZON_NOVA_LITE_V1: LLM = {
  modelId: "amazon/nova-lite-v1",
  modelName: "Amazon Nova Lite v1",
  provider: "openrouter",
  hostedId: "nova-lite-v1",
  platformLink: OPENROUTER_PLATFORM_LINK,
  imageInput: true,
  tools: true,
  supportsStreaming: true,
  tier: "free" as LLMTier
}

const AMAZON_NOVA_MICRO_V1: LLM = {
  modelId: "amazon/nova-micro-v1",
  modelName: "Amazon Nova Micro v1",
  provider: "openrouter",
  hostedId: "nova-micro-v1",
  platformLink: OPENROUTER_PLATFORM_LINK,
  imageInput: false,
  tools: true,
  supportsStreaming: true,
  tier: "free" as LLMTier
}

const AMAZON_NOVA_PRO_V1: LLM = {
  modelId: "amazon/nova-pro-v1",
  modelName: "Amazon Nova Pro v1",
  provider: "openrouter",
  hostedId: "nova-pro-v1",
  platformLink: OPENROUTER_PLATFORM_LINK,
  imageInput: true,
  tools: true,
  supportsStreaming: true,
  tier: "pro" as LLMTier
}

const EVA_QWEN_2_5_72B: LLM = {
  modelId: "eva-unit-01/eva-qwen-2.5-72b",
  modelName: "Eva Qwen 2.5 72B",
  provider: "openrouter",
  hostedId: "eva-qwen-2.5-72b",
  platformLink: OPENROUTER_PLATFORM_LINK,
  imageInput: false,
  tools: false,
  supportsStreaming: true,
  tier: "free" as LLMTier
}

export const OPENROUTER_LLM_LIST: LLM[] = [
  O1_MINI,
  O1_PREVIEW,
  GPT_4O,
  GPT_4O_MINI,
  GEMINI_PRO_15,
  GEMINI_FLASH_20_FLASH_THINKING,
  GEMINI_FLASH_20_FLASH,
  GEMINI_FLASH_15_8B,
  CLAUDE_3_HAIKU,
  CLAUDE_35_HAIKU,
  CLAUDE_35_SONNET,
  LLAMA_3_1_SONAR_HUGE_128K_ONLINE,
  META_LLAMA_3_1_405B,
  LLAMA_32_90B_VISION,
  LLAMA_32_11B_VISION,
  DEEPSEEK_CHAT,
  DEEPSEEK_CHAT_R1,
  DEEPSEEK_CHAT_R1_DISTILL_LLAMA_70B,

  QWEN_25_72B,
  QWEN_2_VL_72B,
  COHERE_COMMAND_R_PLUS,
  COHERE_COMMAND_R,
  DBRX_INSTRUCT,
  MIXTRAL_8X22B,
  WIZARDLM_2_8X22B,
  LLAMA_31_SONAR_LARGE_128K_ONLINE,
  GROK,
  NVIDIA_LLAMA_31_NEMOTRON_70B,
  GEMINI_EXP_1114,
  QWEN_25_CODER_32B,
  PIXTRAL_LARGE_2411,
  META_LLAMA_3_3_70B_INSTRUCT,
  AMAZON_NOVA_LITE_V1,
  AMAZON_NOVA_MICRO_V1,
  AMAZON_NOVA_PRO_V1,
  EVA_QWEN_2_5_72B
]

//- openai/gpt-4o-2024-11-20
//- openai/gpt-4o-mini
//- google/gemini-pro-1.5
//- google/gemini-2.0-flash-thinking-exp:free
//- google/gemini-2.0-flash-exp:free
//- google/gemini-pro-vision
//- anthropic/claude-3-haiku
//- anthropic/claude-3-5-haiku
//- anthropic/claude-3.5-sonnet
//- meta-llama/llama-3.1-405b-instruct
//- deepseek/deepseek-chat
//- openai/o1-mini
//- openai/o1
//- google/gemini-2.0-flash-thinking-exp:free
//- google/gemini-2.0-flash-exp:free
