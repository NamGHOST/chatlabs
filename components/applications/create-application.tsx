"use client"

import { FC, useState, useContext } from "react"
import { Button } from "../ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "../ui/select"
import { Input } from "../ui/input"
import { Textarea } from "../ui/textarea"
import { ChatbotUIContext } from "@/context/context"
import { createApplication } from "@/db/applications"
import { Application, LLM } from "@/types"
import { toast } from "sonner"
import { Tables } from "@/supabase/types"
import { MultiSelect } from "../ui/multi-select"
import { APPLICATION_TYPES } from "@/types/application-types"
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs"
import { WithTooltip } from "../ui/with-tooltip"
import { Label } from "@/components/ui/label"
import { Description } from "../ui/description"

const themes = [
  "light",
  "dark",
  "cupcake",
  "bumblebee",
  "emerald",
  "corporate",
  "synthwave",
  "retro",
  "cyberpunk",
  "valentine",
  "halloween",
  "garden",
  "forest",
  "aqua",
  "lofi",
  "pastel",
  "fantasy",
  "wireframe",
  "black",
  "luxury",
  "dracula",
  "cmyk",
  "autumn",
  "business",
  "acid",
  "lemonade",
  "night",
  "coffee",
  "winter",
  "dim",
  "nord",
  "sunset"
]

interface CreateApplicationProps {
  onApplicationCreated: (application: Application) => void
  onCancel: () => void
}

export const CreateApplication: FC<CreateApplicationProps> = ({
  onApplicationCreated,
  onCancel
}) => {
  const { profile, selectedWorkspace, tools, allModels } =
    useContext(ChatbotUIContext)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [sharing, setSharing] = useState<Application["sharing"]>("private")
  const [selectedTools, setSelectedTools] = useState<string[]>([])
  const [selectedModels, setSelectedModels] = useState<LLM[]>([])
  const [theme, setTheme] = useState<string>("light")
  const [applicationType, setApplicationType] = useState<string>("web_app")

  const handleCreate = async () => {
    if (!profile || !selectedWorkspace) return

    try {
      const newApplication: Partial<Tables<"applications">> = {
        user_id: profile.user_id,
        workspace_id: selectedWorkspace.id,
        name,
        description,
        sharing,
        folder_id: null,
        created_at: new Date().toISOString(),
        updated_at: null,
        application_type: applicationType,
        theme: applicationType === "web_app" ? theme : undefined // Add theme only for web apps
      }

      const platformTools = tools.filter(tool => tool.sharing === "platform")
      const selectedPlatformTools = selectedTools.filter(tool =>
        platformTools.find(platformTool => platformTool.id === tool)
      )
      const filteredSelectedTools = selectedTools.filter(
        tool =>
          !selectedPlatformTools.find(platformTool => platformTool === tool)
      )

      const createdApplication = await createApplication(
        newApplication as Tables<"applications">,
        [], // files
        filteredSelectedTools,
        selectedPlatformTools
      )

      onApplicationCreated(createdApplication)
      toast.success("Application created successfully")
      // Reset form
      setName("")
      setDescription("")
      setSharing("private")
      setSelectedTools([])
      setSelectedModels([])
      setTheme("light")
    } catch (error) {
      console.error("Error creating application:", error)
      toast.error("Failed to create application")
    }
  }

  const appTypeTooltips = {
    web_app:
      "Web Apps enable theme selection, while other types have predefined layouts.",
    chatbot: "Chatbots have a predefined layout with a chat interface.",
    game: "Games have a predefined layout with a game interface.",
    free_form: "Free form has no predefined layout."
  }

  return (
    <div className="space-y-4">
      <div>
        <Label>Application Type</Label>
        <Description>
          Choose the type of application you want to create. This determines the
          layout and features available.
        </Description>
        <Tabs value={applicationType} onValueChange={setApplicationType}>
          <TabsList className="grid w-full grid-cols-4">
            {APPLICATION_TYPES.map(type => (
              <TabsTrigger key={type.value} value={type.value}>
                <WithTooltip
                  trigger={<>{type.label}</>}
                  display={
                    <p className="max-w-xs">
                      {
                        appTypeTooltips[
                          type.value as keyof typeof appTypeTooltips
                        ]
                      }
                    </p>
                  }
                />
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <div>
        <Label htmlFor="name">Name</Label>
        <Description>
          Enter a unique and descriptive name for your application.
        </Description>
        <Input
          id="name"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Enter application name"
          required
        />
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Description>
          Provide a brief overview of your application:{"'"}s purpose and
          functionality.
        </Description>
        <Textarea
          id="description"
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Enter application description"
        />
      </div>
      <div>
        <Label htmlFor="sharing">Sharing</Label>
        <Description>
          Choose who can access your application. Private: Only you. Public:
          Anyone with the link.
        </Description>
        <Select
          value={sharing}
          onValueChange={value => setSharing(value as Application["sharing"])}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select sharing" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="private">Private</SelectItem>
            <SelectItem value="public">Public</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Tools</Label>
        <Description>
          Select tools to enhance your application{"'"}s capabilities.
        </Description>
        <MultiSelect
          selectedOptions={selectedTools.map(tool => ({
            value: tool,
            label: tool
          }))}
          onChange={selected => setSelectedTools(selected.map(s => s.value))}
          options={tools.map(tool => ({ value: tool.id, label: tool.name }))}
          placeholder="Select tools"
        />
      </div>
      <div>
        <Label htmlFor="models">Models</Label>
        <Description>
          Choose AI models to use in your application for various tasks.
        </Description>
        <MultiSelect
          selectedOptions={selectedModels.map(model => ({
            value: model.modelId,
            label: model.modelName
          }))}
          onChange={selected =>
            setSelectedModels(
              selected.map(
                s => ({ modelId: s.value, modelName: s.label }) as LLM
              )
            )
          }
          options={allModels.map(model => ({
            value: model.modelId,
            label: model.modelName
          }))}
          placeholder="Select models"
        />
      </div>
      {applicationType === "web_app" && (
        <div>
          <Label htmlFor="theme">Theme</Label>
          <Description>
            Select a visual theme for your web app. Only available for Web App
            type applications.
          </Description>
          <Select value={theme} onValueChange={setTheme}>
            <SelectTrigger>
              <SelectValue placeholder="Select theme" />
            </SelectTrigger>
            <SelectContent>
              {themes.map(t => (
                <SelectItem key={t} value={t}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <div className="space-x-2">
        <Button onClick={handleCreate} disabled={!name}>
          Create Application
        </Button>
        <Button onClick={onCancel} variant="outline">
          Cancel
        </Button>
      </div>
    </div>
  )
}
