import { Tables } from "@/supabase/types"
import { clsx, type ClassValue } from "clsx"
import { LLM_LIST } from "./models/llm/llm-list"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function onlyUniqueById(value: any, index: any, self: any) {
  return self.findIndex((item: any) => item.id === value.id) === index
}

export function formatDate(input: string | number | Date): string {
  const date = new Date(input)
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric"
  })
}

export const generateRandomString = (length: number, lowercase = false) => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXY3456789" // excluding similar looking characters like Z, 2, I, 1, O, 0
  let result = ""
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return lowercase ? result.toLowerCase() : result
}

interface languageMap {
  [key: string]: string | undefined
}

export const programmingLanguages: languageMap = {
  javascript: ".js",
  python: ".py",
  java: ".java",
  c: ".c",
  cpp: ".cpp",
  "c++": ".cpp",
  "c#": ".cs",
  ruby: ".rb",
  php: ".php",
  swift: ".swift",
  "objective-c": ".m",
  kotlin: ".kt",
  typescript: ".ts",
  go: ".go",
  perl: ".pl",
  rust: ".rs",
  scala: ".scala",
  haskell: ".hs",
  lua: ".lua",
  shell: ".sh",
  sql: ".sql",
  html: ".html",
  css: ".css"
}

export function isEqual(obj1: any, obj2: any): boolean {
  if (obj1 === obj2) return true
  if (
    typeof obj1 !== "object" ||
    obj1 === null ||
    typeof obj2 !== "object" ||
    obj2 === null
  )
    return false
  const keys1 = Object.keys(obj1)
  const keys2 = Object.keys(obj2)
  if (keys1.length !== keys2.length) return false
  for (const key of keys1) {
    if (!keys2.includes(key) || !isEqual(obj1[key], obj2[key])) return false
  }
  return true
}

export function isUsingOwnKey(
  profile: Tables<"profiles">,
  model: string
): boolean {
  if (!profile || !model) return false

  const modelData = LLM_LIST.find(
    x => x.modelId === model || x.hostedId === model
  )
  if (!modelData) return false

  // Handle OpenRouter models (models with "/" and provider is openrouter)

  // Check provider-specific API keys for the specific model being used
  switch (modelData.provider) {
    case "openai":
      return (
        (!!profile.openai_api_key || !!profile.azure_openai_api_key) &&
        !process.env.OPENAI_API_KEY
      )
    case "anthropic":
      return !!profile.anthropic_api_key && !process.env.ANTHROPIC_API_KEY
    case "google":
      return (
        !!profile.google_gemini_api_key && !process.env.GOOGLE_GEMINI_API_KEY
      )
    case "mistral":
      return !!profile.mistral_api_key && !process.env.MISTRAL_API_KEY
    case "groq":
      return !!profile.groq_api_key && !process.env.GROQ_API_KEY
    case "perplexity":
      return !!profile.perplexity_api_key && !process.env.PERPLEXITY_API_KEY
    case "openrouter":
      return !!profile.openrouter_api_key && !process.env.OPENROUTER_API_KEY
    default:
      return false
  }
}
