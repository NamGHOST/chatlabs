import { ChatbotUIContext } from "@/context/context"
import { ChatbotUIChatContext } from "@/context/chat"
import { IconWorld } from "@tabler/icons-react"
import { FC, useContext } from "react"
import { Button } from "../ui/button"
import { cn } from "@/lib/utils"
import { validatePlanForTools } from "@/lib/subscription"

export const WebBrowseToggle: FC = () => {
  const { profile, tools, setIsPaywallOpen, allModels } =
    useContext(ChatbotUIContext)
  const { chatSettings, selectedTools, setSelectedTools } =
    useContext(ChatbotUIChatContext)

  const webBrowsingTool = tools?.find(tool => tool.name === "Web Browsing")
  const isWebBrowsingEnabled = selectedTools.some(
    t => t.id === webBrowsingTool?.id
  )

  // Check if current model supports tools
  const selectedModel = allModels.find(
    x => x.modelId === chatSettings?.model || x.hostedId === chatSettings?.model
  )

  if (!webBrowsingTool || !selectedModel?.tools) return null

  const handleToggle = () => {
    if (!webBrowsingTool || !chatSettings) return

    if (!validatePlanForTools(profile, [webBrowsingTool], chatSettings.model)) {
      setIsPaywallOpen(true)
      return
    }

    if (isWebBrowsingEnabled) {
      setSelectedTools(selectedTools.filter(t => t.id !== webBrowsingTool.id))
    } else {
      setSelectedTools([...selectedTools, webBrowsingTool])
    }
  }

  return (
    <Button
      onClick={handleToggle}
      className={cn(
        "hover:bg-accent rounded-lg p-2 transition-colors",
        isWebBrowsingEnabled && "bg-purple-500/10"
      )}
      variant="ghost"
      size="sm"
    >
      <IconWorld
        size={20}
        className={cn(
          "text-muted-foreground",
          isWebBrowsingEnabled && "text-purple-500"
        )}
        stroke={2}
      />
    </Button>
  )
}
