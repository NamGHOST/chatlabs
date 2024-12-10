import { LLM } from "@/types"
import { CATEGORIES } from "../categories"

const GROQ_PLATORM_LINK = "https://groq.com/"

const MIXTRAL_8X7B: LLM = {
  modelId: "mixtral-8x7b-32768",
  modelName: "Mixtral 8x7b Instruct",
  provider: "groq",
  hostedId: "mixtral-8x7b-32768",
  platformLink: GROQ_PLATORM_LINK,
  imageInput: false,
  pricing: {
    currency: "USD",
    unit: "1M tokens",
    inputCost: 0.24,
    outputCost: 0.24
  },
  categories: [
    CATEGORIES.TECHNOLOGY,
    CATEGORIES.SCIENCE,
    CATEGORIES.ACADEMIA,
    CATEGORIES.PROGRAMMING
  ],
  description:
    "A pretrained generative Sparse Mixture of Experts, by Mistral AI, for chat and instruction use. Incorporates 8 experts (feed-forward networks) for a total of 47 billion parameters."
}

const META_LLAMA_3_8B_8192: LLM = {
  modelId: "llama3-8b-8192",
  modelName: "Meta LLama 3 8B",
  provider: "groq",
  hostedId: "llama3-8b-8192",
  platformLink: GROQ_PLATORM_LINK,
  imageInput: false,
  tools: true,
  supportsStreaming: true,
  pricing: {
    currency: "USD",
    unit: "1M tokens",
    inputCost: 0.05,
    outputCost: 0.1
  },
  categories: [
    CATEGORIES.TECHNOLOGY,
    CATEGORIES.SCIENCE,
    CATEGORIES.PROGRAMMING,
    CATEGORIES.PROGRAMMING_SCRIPTING
  ],
  description:
    "Meta's latest class of model (Llama 3) launched with a variety of sizes & flavors. This 8B instruct-tuned version is fast and efficient."
}

const META_LLAMA_3_70B_8192: LLM = {
  modelId: "llama3-70b-8192",
  modelName: "Meta LLama 3 70B",
  provider: "groq",
  hostedId: "llama3-70b-8192",
  platformLink: GROQ_PLATORM_LINK,
  imageInput: false,
  tools: true,
  supportsStreaming: true,
  pricing: {
    currency: "USD",
    unit: "1M tokens",
    inputCost: 0.59,
    outputCost: 0.79
  },
  categories: [
    CATEGORIES.TECHNOLOGY,
    CATEGORIES.SCIENCE,
    CATEGORIES.ACADEMIA,
    CATEGORIES.LEGAL,
    CATEGORIES.FINANCE,
    CATEGORIES.PROGRAMMING,
    CATEGORIES.PROGRAMMING_SCRIPTING
  ],
  description:
    "Meta's latest class of model (Llama 3) launched with a variety of sizes & flavors. This 8B instruct-tuned version is fast and efficient."
}

const LLAMA3_GROQ_70B_8192_TOOL_USE_PREVIEW: LLM = {
  modelId: "llama3-groq-70b-8192-tool-use-preview",
  modelName: "Meta LLama 3 70B Tool Use Preview",
  provider: "groq",
  hostedId: "llama3-groq-70b-8192-tool-use-preview",
  platformLink: GROQ_PLATORM_LINK,
  imageInput: false,
  tools: true,
  supportsStreaming: true,
  pricing: {
    currency: "USD",
    unit: "1M tokens",
    inputCost: 0.59,
    outputCost: 0.79
  },
  categories: [CATEGORIES.TECHNOLOGY, CATEGORIES.PROGRAMMING, CATEGORIES.TOOLS],
  description: "70B parameter model optimized for tool use and function calling"
}

const LLAMA_3_2_11B_VISION: LLM = {
  modelId: "llama-3.2-11b-vision-preview",
  modelName: "Llama 3.2 11B Vision",
  provider: "groq",
  hostedId: "llama-3.2-11b-vision-preview",
  platformLink: GROQ_PLATORM_LINK,
  imageInput: false,
  tools: false,
  supportsStreaming: true,
  pricing: {
    currency: "USD",
    unit: "1M tokens",
    inputCost: 0.25,
    outputCost: 0.35
  },
  categories: [CATEGORIES.VISION, CATEGORIES.TECHNOLOGY],
  description:
    "Preview of Llama 3.2 11B with vision capabilities(can only read images in links)"
}

const LLAMA_3_2_1B: LLM = {
  modelId: "llama-3.2-1b-preview",
  modelName: "Llama 3.2 1B",
  provider: "groq",
  hostedId: "llama-3.2-1b-preview",
  platformLink: GROQ_PLATORM_LINK,
  imageInput: false,
  tools: false,
  supportsStreaming: true,
  pricing: {
    currency: "USD",
    unit: "1M tokens",
    inputCost: 0.05,
    outputCost: 0.1
  },
  categories: [CATEGORIES.TECHNOLOGY],
  description: "Lightweight 1B parameter preview model from Llama 3.2 series"
}

const LLAMA_3_2_3B: LLM = {
  modelId: "llama-3.2-3b-preview",
  modelName: "Llama 3.2 3B",
  provider: "groq",
  hostedId: "llama-3.2-3b-preview",
  platformLink: GROQ_PLATORM_LINK,
  imageInput: false,
  tools: false,
  supportsStreaming: true,
  pricing: {
    currency: "USD",
    unit: "1M tokens",
    inputCost: 0.05,
    outputCost: 0.1
  },
  categories: [CATEGORIES.TECHNOLOGY],
  description: "Efficient 3B parameter preview model from Llama 3.2 series"
}

const LLAMA_3_2_90B_VISION: LLM = {
  modelId: "llama-3.2-90b-vision-preview",
  modelName: "Llama 3.2 90B Vision",
  provider: "groq",
  hostedId: "llama-3.2-90b-vision-preview",
  platformLink: GROQ_PLATORM_LINK,
  imageInput: false,
  tools: false,
  supportsStreaming: true,
  pricing: {
    currency: "USD",
    unit: "1M tokens",
    inputCost: 0.8,
    outputCost: 1.0
  },
  categories: [CATEGORIES.VISION, CATEGORIES.TECHNOLOGY, CATEGORIES.ANALYSIS],
  description:
    "Large 90B parameter preview model with vision capabilities(can only read images in links)"
}

const GEMMA_2_9B: LLM = {
  modelId: "gemma2-9b-it",
  modelName: "Gemma 2 9B",
  provider: "groq",
  hostedId: "gemma2-9b-it",
  platformLink: GROQ_PLATORM_LINK,
  imageInput: false,
  tools: false,
  supportsStreaming: true,
  pricing: {
    currency: "USD",
    unit: "1M tokens",
    inputCost: 0.1,
    outputCost: 0.2
  },
  categories: [CATEGORIES.TECHNOLOGY, CATEGORIES.PROGRAMMING],
  description: "Google's Gemma 2 9B instruction-tuned model"
}

const GEMMA_7B: LLM = {
  modelId: "gemma-7b-it",
  modelName: "Gemma 7B",
  provider: "groq",
  hostedId: "gemma-7b-it",
  platformLink: GROQ_PLATORM_LINK,
  imageInput: false,
  tools: false,
  supportsStreaming: true,
  pricing: {
    currency: "USD",
    unit: "1M tokens",
    inputCost: 0.1,
    outputCost: 0.2
  },
  categories: [CATEGORIES.TECHNOLOGY, CATEGORIES.PROGRAMMING],
  description: "Google's Gemma 7B instruction-tuned model"
}

const LLAMA_3_3_70B_VERSATILE: LLM = {
  modelId: "llama-3.3-70b-versatile",
  modelName: "Llama 3.3 70B Versatile",
  provider: "groq",
  hostedId: "llama-3.3-70b-versatile",
  platformLink: GROQ_PLATORM_LINK,
  imageInput: false,
  tools: false,
  supportsStreaming: true,
  pricing: {
    currency: "USD",
    unit: "1M tokens",
    inputCost: 0.7,
    outputCost: 0.9
  },
  categories: [CATEGORIES.TECHNOLOGY, CATEGORIES.PROGRAMMING],
  description: "Meta's Llama 3.3 70B versatile model with 128k context window"
}

export const GROQ_LLM_LIST: LLM[] = [
  MIXTRAL_8X7B,
  GEMMA_2_9B,
  GEMMA_7B,
  LLAMA_3_3_70B_VERSATILE,
  META_LLAMA_3_8B_8192,
  META_LLAMA_3_70B_8192,
  LLAMA3_GROQ_70B_8192_TOOL_USE_PREVIEW,
  LLAMA_3_2_11B_VISION,
  LLAMA_3_2_1B,
  LLAMA_3_2_3B,
  LLAMA_3_2_90B_VISION
]
