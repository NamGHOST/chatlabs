import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"
import { LLM, LLMID, OpenRouterLLMID } from "@/types"
import { ModelVisibilityOption } from "@/components/models/model-visibility-option"
import { IconSettings } from "@tabler/icons-react"
import { useContext, useEffect, useState } from "react"
import { ChatbotUIContext } from "@/context/context"
import { Button } from "@/components/ui/button"
import { updateProfile } from "@/db/profile"
import {
  AdvancedContent,
  InfoIconTooltip
} from "@/components/ui/chat-settings-form"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { TextareaAutosize } from "@/components/ui/textarea-autosize"
import {
  DEFAULT_SYSTEM_PROMPT,
  validateSystemPromptTemplate
} from "@/lib/build-prompt"
import { WithTooltip } from "@/components/ui/with-tooltip"
import { updateWorkspace } from "@/db/workspaces"
import { useTranslation } from "react-i18next"
import { OPENROUTER_LLM_LIST } from "@/lib/models/llm/openrouter-llm-list"

export const DEFAULT_MODEL_VISIBILITY: Record<LLMID, boolean> = {
  "gpt-3.5-turbo-0125": false,
  "gpt-4-vision-preview": false,
  "gpt-4-turbo-preview": false,
  "gpt-4-turbo": false,
  "gpt-4o-mini": true,
  "gpt-4o-2024-11-20": true,
  "o1-mini": false,
  o1: false,
  "claude-3-haiku-20240307": true,
  "claude-3-sonnet-20240229": false,
  "claude-3-5-sonnet-20240620": true,
  "claude-3-5-haiku-20241022": false,
  "gemini-pro": false,
  "gemini-pro-vision": false,
  "mistral-large-latest": true,
  "mixtral-8x7b-32768": true,
  "llama-3-sonar-small-32k-online": false,
  "llama-3-sonar-large-32k-online": false,
  "llama-3-sonar-small-32k-chat": false,
  "llama-3-sonar-large-32k-chat": false,
  "gpt-4": false,
  "gpt-3.5-turbo": false,
  "gemini-1.5-pro-latest": true,
  "claude-2.1": false,
  "claude-instant-1.2": false,
  "mistral-tiny": false,
  "mistral-small": false,
  "mistral-medium": false,
  // "llama2-70b-4096": false,
  "pplx-7b-online": false,
  "pplx-70b-online": false,
  "pplx-7b-chat": false,
  "pplx-70b-chat": false,
  "mixtral-8x7b-instruct": false,
  "mistral-7b-instruct": false,
  "llama-2-70b-chat": false,
  "codellama-34b-instruct": false,
  "codellama-70b-instruct": false,
  "llama3-70b-8192": false,
  "llama-3.1-70b-versatile": false,
  "llama3-8b-8192": false,
  "deepseek-r1-distill-llama-70b": true,
  "gpt-4o": false,
  "gemini-1.5-flash-latest": false,

  //openrouter models
  "openai/o3-mini": false,
  "openai/o3-mini-high": false,
  "openai/gpt-4o-2024-11-20": false,
  "openai/gpt-4o-mini": true,

  "anthropic/claude-3.5-haiku": false,
  "anthropic/claude-3.7-sonnet": false,
  "anthropic/claude-3.7-sonnet:thinking-exp:free": false,
  "anthropic/claude-3-haiku": true,

  "google/gemini-2.0-flash-lite-001": false,
  "google/gemini-pro-vision": false,
  "google/gemini-2.0-flash-001": true,
  "google/gemini-2.0-flash-thinking-exp:free": false,
  "google/gemini-exp-1114": false,

  "databricks/dbrx-instruct": false,
  "mistralai/mixtral-8x22b-instruct": false,
  "mistralai/pixtral-large-2411": false,
  "microsoft/wizardlm-2-8x22b": false,
  "meta-llama/llama-3.1-405b-instruct": false,
  "perplexity/sonar-reasoning": false,
  "perplexity/r1-1776": false,
  "deepseek/deepseek-chat": true,
  "deepseek/deepseek-r1": true,
  "deepseek/deepseek-r1-distill-llama-70b": true,
  "deepseek/deepseek-r1-distill-qwen-32b": true,
  "deepseek/deepseek-r1-distill-qwen-14b": true,

  "qwen/qwen-2.5-72b-instruct": false,
  "qwen/qwen-2-vl-72b-instruct": false,
  "qwen/qwen-2.5-coder-32b-instruct": false,

  "cohere/command-r-plus-08-2024": false,
  "cohere/command-r-08-2024": false,

  "google/gemini-flash-1.5-8b": false,

  "meta-llama/llama-3.2-90b-vision-instruct": false,
  "meta-llama/llama-3.2-11b-vision-instruct": false,
  "meta-llama/llama-3.3-70b-instruct": true,

  "perplexity/sonar": false,
  "x-ai/grok-2-1212": false,
  "nvidia/llama-3.1-nemotron-70b-instruct": false,

  "amazon/nova-lite-v1": false,
  "amazon/nova-micro-v1": false,
  "amazon/nova-pro-v1": false,
  "deepseek/deepseek-r1-distill-qwen-1.5b": false,
  "cognitivecomputations/dolphin3.0-r1-mistral-24b:free": false,
  "cognitivecomputations/dolphin3.0-mistral-24b:free": false,

  ///groq
  "gemma-7b-it": false,
  "gemma2-9b-it": false,
  "llama-3.1-8b-instant": false,
  "llama-3.2-11b-vision-preview": false,
  "llama-3.2-1b-preview": false,
  "llama-3.2-3b-preview": false,
  "llama-3.2-90b-vision-preview": false,
  "llama-guard-3-8b": false,
  "llama3-groq-8b-8192-tool-use-preview": false,
  "llama-3.3-70b-versatile": false
}

const SYSTEM_PROMPT_DESCRIPTION = `
The system prompt is a message that the AI will use to start the conversation. 
It should contain the following dynamic variables for Imogen functioning properly: {profile_context}, {local_date}, and {assistant}. {profile_context} is the user's profile context, {local_date} is the current date, and {assistant} is the name of the assistant and it's instructions.
`

const SYSTEM_PROMPT_WARNING = `
The system prompt should contain the following dynamic variables for Imogen functioning properly: {profile_context}, {local_date}, and {assistant}. {profile_context} is the user's profile context, {local_date} is the current date, and {assistant} is the name of the assistant and it's instructions.`

// Helper function to group models by provider
const groupModelsByProvider = (models: LLM[]) => {
  const groups: Record<string, LLMID[]> = {}

  models.forEach(model => {
    const provider =
      model.provider === "openrouter"
        ? model.modelId.split("/")[0]
        : model.provider

    if (!groups[provider]) {
      groups[provider] = []
    }
    groups[provider].push(model.modelId as LLMID)
  })

  return groups
}

function ModelSettings({ models }: { models?: LLM[] }) {
  const {
    profile,
    selectedWorkspace,
    setChatSettings,
    setProfile,
    chatSettings
  } = useContext(ChatbotUIContext)

  const [dialogOpen, setDialogOpen] = useState(false)

  const [visibility, setVisibility] = useState<Record<LLMID, boolean>>(
    (profile?.model_visibility || DEFAULT_MODEL_VISIBILITY) as Record<
      LLMID,
      boolean
    >
  )

  const [systemPromptTemplate, setSystemPromptTemplate] = useState(
    profile?.system_prompt_template || DEFAULT_SYSTEM_PROMPT
  )

  const validSystemPrompt = validateSystemPromptTemplate(systemPromptTemplate)

  function handleSave() {
    if (!profile) {
      return
    }
    setProfile({
      ...profile,
      model_visibility: visibility,
      system_prompt_template: systemPromptTemplate
    })
    updateProfile(profile.id, {
      ...profile,
      model_visibility: visibility,
      system_prompt_template: systemPromptTemplate
    })
    updateWorkspace(selectedWorkspace!.id, {
      // ...selectedWorkspace!,
      default_temperature: chatSettings?.temperature,
      default_context_length: chatSettings?.contextLength
    })
    setDialogOpen(false)
  }

  const { t } = useTranslation()

  const MODEL_GROUPS = models ? groupModelsByProvider(models) : {}

  const renderModelGroup = (groupName: string, modelIds: LLMID[]) => {
    return (
      <div key={groupName}>
        <h3 className="mb-2 mt-4 font-semibold capitalize">{groupName}</h3>
        {modelIds.map(modelId => {
          const model = models?.find(m => m.modelId === modelId)
          if (!model) return null

          let displayName = model.modelName
          if (model.provider === "openrouter") {
            const openRouterModel = OPENROUTER_LLM_LIST.find(
              m => m.modelId === model.modelId
            )
            if (openRouterModel) {
              displayName = openRouterModel.modelName
            }
          }

          return (
            <ModelVisibilityOption
              key={modelId}
              selected={!!visibility?.[modelId]}
              model={{
                ...model,
                modelName: displayName
              }}
              onSelect={checked => {
                setVisibility(prev => ({
                  ...prev,
                  [modelId]: checked
                }))
              }}
            />
          )
        })}
      </div>
    )
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <div
          className={
            "hover:bg-accent flex w-full cursor-pointer items-center justify-start truncate rounded p-2 text-sm hover:opacity-50"
          }
        >
          <IconSettings
            stroke={1.5}
            className={"mr-2 shrink-0 opacity-50"}
            size={24}
          />{" "}
          <div className={"flex flex-col"}>
            <div className={"flex items-center space-x-3"}>
              {t("Discover and manage models")}
            </div>
            <div className={"text-foreground/60 text-xs"}>
              {t("Configure and discover all LLM models here.")}
            </div>
          </div>
        </div>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>{t("Manage models")}</DialogTitle>
        <Tabs className={"flex w-full flex-col justify-center"}>
          <TabsList className={"mx-auto"}>
            <TabsTrigger value={"basic"} title={"Basic settings"}>
              {t("Model parameters")}
            </TabsTrigger>
            <TabsTrigger value={"visibility"} title={"Model visibility"}>
              {t("Discover models")}
            </TabsTrigger>
          </TabsList>
          <TabsContent value={"basic"}>
            <div className="mb-4 mt-2 flex items-center space-x-2">
              <Label>{t("System Prompt")}</Label>
              <InfoIconTooltip label={t("SYSTEM_PROMPT_DESCRIPTION")} />
            </div>
            <TextareaAutosize
              minRows={3}
              className="mt-2"
              value={systemPromptTemplate}
              onValueChange={value => {
                setSystemPromptTemplate(value)
              }}
            />
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => {
                  setSystemPromptTemplate(DEFAULT_SYSTEM_PROMPT)
                }}
                className={"text-xs"}
                variant={"link"}
              >
                {t("Reset to default")}
              </Button>
              {!validSystemPrompt && (
                <WithTooltip
                  trigger={
                    <div className="text-xs text-yellow-500">
                      {t("Missing dynamic variables")}
                    </div>
                  }
                  display={SYSTEM_PROMPT_WARNING}
                />
              )}
            </div>
            <AdvancedContent
              showOverrideSystemPrompt={true}
              chatSettings={chatSettings!}
              onChangeChatSettings={setChatSettings}
              showTooltip={true}
            />
          </TabsContent>
          <TabsContent value={"visibility"}>
            <div className="max-h-[600px] w-full space-y-0 overflow-y-auto">
              {models && models.length > 0 ? (
                Object.entries(MODEL_GROUPS).map(([provider, modelIds]) =>
                  renderModelGroup(provider, modelIds)
                )
              ) : (
                <p>{t("No models available")}</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
        <Button onClick={handleSave}>{t("Save for all future chats")}</Button>
      </DialogContent>
    </Dialog>
  )
}

export { ModelSettings }
