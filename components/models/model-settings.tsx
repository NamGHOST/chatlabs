import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"
import { LLM, LLMID } from "@/types"
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

export const DEFAULT_MODEL_VISIBILITY: Record<LLMID, boolean> = {
  "gpt-3.5-turbo-0125": true,
  "gpt-4-vision-preview": true,
  "gpt-4-turbo-preview": true,
  "gpt-4-turbo": true,
  "claude-3-haiku-20240307": true,
  "claude-3-sonnet-20240229": true,
  "claude-3-opus-20240229": true,
  "gemini-pro": false,
  "gemini-pro-vision": false,
  "mistral-large-latest": false,
  "mixtral-8x7b-32768": false,
  "sonar-small-online": false,
  "sonar-medium-online": false,
  "sonar-small-chat": false,
  "sonar-medium-chat": false,
  "gpt-4": false,
  "gpt-3.5-turbo": false,
  "gemini-1.5-pro-latest": true,
  "claude-2.1": false,
  "claude-instant-1.2": false,
  "mistral-tiny": false,
  "mistral-small": false,
  "mistral-medium": false,
  // "llama2-70b-4096": true,
  "pplx-7b-online": true,
  "pplx-70b-online": true,
  "pplx-7b-chat": true,
  "pplx-70b-chat": true,
  "mixtral-8x7b-instruct": true,
  "mistral-7b-instruct": true,
  "llama-2-70b-chat": true,
  "codellama-34b-instruct": true,
  "codellama-70b-instruct": true,
  "llama3-70b-8192": true,
  "llama3-8b-8192": true,
  "gpt-4o": true,
  "gemini-1.5-flash-latest": true,
  "databricks/dbrx-instruct": true,
  "cohere/command-r-plus": true,
  "mistralai/mixtral-8x22b-instruct": true,
  "microsoft/wizardlm-2-8x22b": true,
  "meta-llama/llama-3-70b-instruct": true,
  "openai/gpt-4o-2024-05-13": true,
  "openai/gpt-4-vision-preview": true,
  "google/gemini-pro-1.5": true,
  "google/gemini-pro-vision": true,
  "liuhaotian/llava-yi-34b": true,
  "fireworks/firellava-13b": true,
  "anthropic/claude-3-haiku": true,
  "anthropic/claude-3.5-sonnet": true
}

const SYSTEM_PROMPT_DESCRIPTION = `
The system prompt is a message that the AI will use to start the conversation. 
It should contain the following dynamic variables for ImogenAI functioning properly: {profile_context}, {local_date}, and {assistant}. {profile_context} is the user's profile context, {local_date} is the current date, and {assistant} is the name of the assistant and it's instructions.
`

const SYSTEM_PROMPT_WARNING = `
The system prompt should contain the following dynamic variables for ImogenAI functioning properly: {profile_context}, {local_date}, and {assistant}. {profile_context} is the user's profile context, {local_date} is the current date, and {assistant} is the name of the assistant and it's instructions.`

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
      ...selectedWorkspace!,
      default_temperature: chatSettings?.temperature,
      default_context_length: chatSettings?.contextLength
    })
    setDialogOpen(false)
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <div
          className={
            "hover:bg-accent flex w-full cursor-pointer items-center justify-start space-x-3 truncate rounded p-2 text-sm hover:opacity-50"
          }
        >
          <IconSettings stroke={1.5} className={"mr-2 opacity-50"} size={24} />{" "}
          Manage models
        </div>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Manage models</DialogTitle>
        <Tabs className={"flex w-full flex-col justify-center"}>
          <TabsList className={"mx-auto"}>
            <TabsTrigger value={"basic"} title={"Basic settings"}>
              Model parameters
            </TabsTrigger>
            <TabsTrigger value={"visibility"} title={"Model visibility"}>
              Model visibility
            </TabsTrigger>
          </TabsList>
          <TabsContent value={"basic"}>
            <div className="mb-4 mt-2 flex items-center space-x-2">
              <Label>System Prompt</Label>
              <InfoIconTooltip label={SYSTEM_PROMPT_DESCRIPTION} />
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
                Reset to default
              </Button>
              {!validSystemPrompt && (
                <WithTooltip
                  trigger={
                    <div className="text-xs text-yellow-500">
                      Missing dynamic variables
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
            <div className="max-h-[360px] w-full space-y-0 overflow-y-auto">
              {models?.map(model => (
                <ModelVisibilityOption
                  key={model.modelId}
                  selected={!!visibility?.[model.modelId]}
                  model={model}
                  onSelect={checked => {
                    setVisibility({
                      ...visibility,
                      [model.modelId]: checked
                    })
                  }}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>
        <Button onClick={handleSave}>Save for all future chats</Button>
      </DialogContent>
    </Dialog>
  )
}

export { ModelSettings }
