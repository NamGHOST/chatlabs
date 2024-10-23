import { Dialog, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { SidebarCreateItem } from "@/components/sidebar/items/all/sidebar-create-item"
import { ChatSettingsForm } from "@/components/ui/chat-settings-form"
import ImagePicker from "@/components/ui/image-picker"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ChatbotUIContext } from "@/context/context"
import { ASSISTANT_DESCRIPTION_MAX, ASSISTANT_NAME_MAX } from "@/db/limits"
import { Tables, TablesInsert } from "@/supabase/types"
import { FC, useContext, useEffect, useState } from "react"
import { AssistantRetrievalSelect } from "./assistant-retrieval-select"
import { AssistantToolSelect } from "./assistant-tool-select"
import { LLM_LIST } from "@/lib/models/llm/llm-list"
import { LLMID } from "@/types"
import { SharingField } from "@/components/sidebar/items/all/sharing-field"
import { AssistantConversationStarters } from "@/components/sidebar/items/assistants/assistant-conversation-starters"
import { TextareaAutosize } from "@/components/ui/textarea-autosize"
import { CenterCreateItem } from "@/components/sidebar/items/all/center-create-item"

interface CreateAssistantProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
}

export const CreateAssistant: FC<CreateAssistantProps> = ({
  isOpen,
  onOpenChange
}) => {
  const { profile, selectedWorkspace } = useContext(ChatbotUIContext)

  const [name, setName] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [description, setDescription] = useState("")
  const [sharing, setSharing] = useState("private")
  const [conversationStarters, setConversationStarters] = useState<string[]>([])
  const [assistantChatSettings, setAssistantChatSettings] = useState({
    model: selectedWorkspace?.default_model,
    prompt: selectedWorkspace?.default_prompt,
    temperature: selectedWorkspace?.default_temperature,
    contextLength: selectedWorkspace?.default_context_length,
    includeProfileContext: false,
    includeWorkspaceInstructions: false,
    embeddingsProvider: selectedWorkspace?.embeddings_provider
  })
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imageLink, setImageLink] = useState("")
  const [selectedAssistantRetrievalItems, setSelectedAssistantRetrievalItems] =
    useState<(Tables<"files"> | Tables<"collections">)[]>([])

  const [selectedAssistantToolItems, setSelectedAssistantToolItems] = useState<
    Tables<"tools">[]
  >([])

  useEffect(() => {
    // Remove the prompt modification logic
    // You can add any other side effects you want to keep here
  }, [name])

  const handleRetrievalItemsSelect = (
    items: (Tables<"files"> | Tables<"collections">)[]
  ) => {
    // Use a Set to remove duplicates based on id
    const uniqueItems = Array.from(new Set(items.map(item => item.id))).map(
      id => items.find(item => item.id === id)!
    )

    setSelectedAssistantRetrievalItems(uniqueItems)
  }

  const handleToolSelect = (tools: Tables<"tools">[]) => {
    setSelectedAssistantToolItems(tools)
  }

  const checkIfModelIsToolCompatible = () => {
    if (!assistantChatSettings.model) return false

    const compatibleModels = LLM_LIST.filter(llm => llm.tools == true).map(
      llm => llm.modelId
    )
    const isModelCompatible = compatibleModels.includes(
      assistantChatSettings.model as LLMID
    )

    return isModelCompatible
  }

  if (!profile) return null
  if (!selectedWorkspace) return null

  return (
    <CenterCreateItem
      contentType="assistants"
      createState={
        {
          image: selectedImage,
          user_id: profile.user_id,
          name,
          description,
          include_profile_context: assistantChatSettings.includeProfileContext,
          include_workspace_instructions:
            assistantChatSettings.includeWorkspaceInstructions,
          context_length: assistantChatSettings.contextLength,
          model: assistantChatSettings.model,
          image_path: "",
          prompt: assistantChatSettings.prompt,
          temperature: assistantChatSettings.temperature,
          embeddings_provider: assistantChatSettings.embeddingsProvider,
          files: selectedAssistantRetrievalItems.filter(
            item => "type" in item
          ) as Tables<"files">[],
          collections: selectedAssistantRetrievalItems.filter(
            item => !("type" in item)
          ) as Tables<"collections">[],
          tools: selectedAssistantToolItems,
          sharing,
          conversation_starters: conversationStarters
        } as TablesInsert<"assistants">
      }
      isOpen={isOpen}
      isTyping={isTyping}
      renderInputs={() => (
        <>
          <div className="space-y-1">
            <Label>Name</Label>

            <Input
              placeholder="Assistant name..."
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={ASSISTANT_NAME_MAX}
            />
          </div>

          <div className="space-y-1 pt-2">
            <Label>Description</Label>

            <TextareaAutosize
              className="bg-background border-input border"
              placeholder="Assistant description..."
              onValueChange={value => setDescription(value)}
              value={description}
              maxLength={ASSISTANT_DESCRIPTION_MAX}
              minRows={3}
              maxRows={6}
            />
          </div>

          <div className="space-y-1 pt-2">
            <Label className="flex space-x-1">
              <div>Image</div>

              <div className="text-xs">(optional)</div>
            </Label>

            <ImagePicker
              src={imageLink}
              image={selectedImage}
              onSrcChange={setImageLink}
              onImageChange={setSelectedImage}
              width={100}
              height={100}
            />
          </div>

          <ChatSettingsForm
            chatSettings={assistantChatSettings as any}
            onChangeChatSettings={setAssistantChatSettings}
            useAdvancedDropdown={true}
          />

          <div className="space-y-1 pt-2">
            <Label>Files & Collections</Label>

            <AssistantRetrievalSelect
              selectedAssistantRetrievalItems={selectedAssistantRetrievalItems}
              onAssistantRetrievalItemsSelect={handleRetrievalItemsSelect}
            />
          </div>

          {checkIfModelIsToolCompatible() ? (
            <div className="space-y-1">
              <Label>Plugins</Label>

              <AssistantToolSelect
                selectedAssistantTools={selectedAssistantToolItems}
                onAssistantToolsSelect={handleToolSelect}
              />
            </div>
          ) : (
            <div className="pt-1 font-semibold">
              Model is not compatible with tools.
            </div>
          )}

          <AssistantConversationStarters
            value={conversationStarters}
            onChange={setConversationStarters}
          />

          <SharingField value={sharing} onChange={setSharing} />
        </>
      )}
      onOpenChange={onOpenChange}
    />
  )
}
