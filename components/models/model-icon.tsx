import { cn } from "@/lib/utils"
import mistral from "@/public/providers/mistral.png"
import groq from "@/public/providers/groq.png"
import meta from "@/public/providers/meta.png"
import perplexity from "@/public/providers/perplexity.png"
import databricks from "@/public/providers/databricks.png"
import googleGemini from "@/public/providers/googleGemini.png"
import deepseek from "@/public/providers/deepseek.png"

import { XaiSVG } from "@/components/icons/xai-svg"
import { ModelProvider } from "@/types"
import { IconSparkles } from "@tabler/icons-react"
import { useTheme } from "next-themes"
import Image from "next/image"
import { FC, HTMLAttributes } from "react"
import { AnthropicSVG } from "../icons/anthropic-svg"
import { GoogleSVG } from "../icons/google-svg"
import { OpenAISVG } from "../icons/openai-svg"
import { parseOpenRouterModelName } from "@/lib/models/fetch-models"
import { MicrosoftSVG } from "@/components/icons/microsoft-svg"
import { Chat } from "openai/resources/index.mjs"
import { ChatbotUISVG } from "../icons/chatbotui-svg"
import { NvidiaSVG } from "../icons/nividia-svg"
import { CohereSVG } from "../icons/cohere-svg"

interface ModelIconProps extends HTMLAttributes<HTMLDivElement> {
  provider: ModelProvider
  modelId?: string
  height: number
  width: number
}

export const ModelIcon: FC<ModelIconProps> = ({
  provider,
  height,
  width,
  modelId,
  className,
  ...props
}) => {
  const { theme } = useTheme()

  if (modelId?.toLowerCase().includes("mistral")) {
    provider = "mistral"
  }

  switch (provider as ModelProvider) {
    case "openai":
      return (
        <OpenAISVG
          className={cn(
            "rounded-sm bg-white p-1 text-black",
            className,
            theme === "dark" ? "bg-white" : "border-foreground/10 border"
          )}
          width={width}
          height={height}
        />
      )
    case "mistral":
      return (
        <Image
          className={cn(
            "rounded-sm p-1",
            theme === "dark" ? "bg-white" : "border-foreground/10 border",
            className
          )}
          src={mistral.src}
          alt="Mistral"
          width={width}
          height={height}
        />
      )
    case "groq":
      return (
        <Image
          className={cn(
            "rounded-sm p-0",
            theme === "dark" ? "bg-white" : "border-foreground/10 border",
            className
          )}
          src={groq.src}
          alt="Groq"
          width={width}
          height={height}
        />
      )
    case "anthropic":
      return (
        <AnthropicSVG
          className={cn(
            "rounded-sm bg-white p-1 text-black",
            className,
            theme === "dark" ? "bg-white" : "border-foreground/10 border"
          )}
          width={width}
          height={height}
        />
      )
    case "google":
      return (
        <Image
          className={cn(
            "rounded-sm p-0",
            className,
            theme === "dark" ? "bg-white" : "border-foreground/10 border"
          )}
          src={googleGemini.src}
          alt="Google Gemini"
          width={width}
          height={height}
        />
      )
    case "perplexity":
      return (
        <Image
          className={cn(
            "rounded-sm p-1",
            theme === "dark" ? "bg-white" : "border-foreground/10 border",
            className
          )}
          src={perplexity.src}
          alt="Perplexity"
          width={width}
          height={height}
        />
      )
    case "databricks":
      return (
        <Image
          className={cn(
            "rounded-sm p-1",
            theme === "dark" ? "bg-white" : "border-foreground/10 border",
            className
          )}
          src={databricks.src}
          alt="Databricks"
          width={width}
          height={height}
        />
      )
    case "microsoft":
      return (
        <MicrosoftSVG
          className={cn(
            "rounded-sm bg-white p-1 text-black",
            className,
            theme === "dark" ? "bg-white" : "border-foreground/10 border"
          )}
          width={width}
          height={height}
        />
      )
    case "meta":
      return (
        <Image
          className={cn(
            "rounded-sm p-1",
            theme === "dark" ? "bg-white" : "border-foreground/10 border",
            className
          )}
          src={meta.src}
          alt="Meta Llama"
          width={width}
          height={height}
        />
      )
    case "openrouter":
      const { provider } = parseOpenRouterModelName(modelId!)
      return (
        <ModelIcon
          className={className}
          provider={provider as ModelProvider}
          height={height}
          width={width}
        />
      )
    case "x-ai":
      return (
        <XaiSVG
          className={cn(
            "rounded-sm p-1 text-black",
            theme === "dark" ? "bg-white" : "border-foreground/10 border",
            className
          )}
          size={60}
          width={width}
          height={height}
        />
      )
    case "nvidia":
      return (
        <NvidiaSVG
          className={cn(
            "rounded-sm p-1 text-black",
            theme === "dark" ? "bg-white" : "border-foreground/10 border",
            className
          )}
          width={width}
          height={height}
        />
      )

    case "cohere":
      return (
        <CohereSVG
          className={cn(
            "rounded-sm p-1",
            theme === "dark" ? "bg-white" : "border-foreground/10 border",
            className
          )}
          width={width}
          height={height}
        />
      )

    case "deepseek":
      return (
        <Image
          className={cn(
            "rounded-sm p-0",
            theme === "dark" ? "bg-white" : "border-foreground/10 border",
            className
          )}
          src={deepseek.src}
          alt="Deepseek"
          width={width}
          height={height}
        />
      )

    default:
      return (
        <ChatbotUISVG
          className={cn(
            "dark:border-foreground/10 rounded-sm dark:border",
            className
          )}
          theme={theme === "dark" ? "light" : "dark"}
          size={width}
        />
      )
  }
}
