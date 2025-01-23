import { ChatbotUIContext } from "@/context/context"
import { ChatbotUIChatContext } from "@/context/chat"
import { IconChartLine } from "@tabler/icons-react"
import { FC, useContext } from "react"
import { Button } from "../ui/button"
import { cn } from "@/lib/utils"
import { PLAN_FREE } from "@/lib/stripe/config"

export const FinanceToggle: FC = () => {
  const { profile, tools, setIsPaywallOpen, allModels } =
    useContext(ChatbotUIContext)
  const { chatSettings, selectedTools, setSelectedTools } =
    useContext(ChatbotUIChatContext)

  const financeTool = tools?.find(tool => tool.name === "Finance Data Provider")
  const isFinanceEnabled = selectedTools.some(t => t.id === financeTool?.id)

  // Check if current model supports tools
  const selectedModel = allModels.find(
    x => x.modelId === chatSettings?.model || x.hostedId === chatSettings?.model
  )

  if (!financeTool || !selectedModel?.tools) return null

  const handleToggle = () => {
    if (!financeTool || !chatSettings) return

    // Show paywall for free users regardless of toggle state
    if (!profile?.plan || profile.plan === PLAN_FREE) {
      setIsPaywallOpen(true)
      return
    }

    if (isFinanceEnabled) {
      setSelectedTools(selectedTools.filter(t => t.id !== financeTool.id))
    } else {
      setSelectedTools([...selectedTools, financeTool])
    }
  }

  return (
    <Button
      onClick={handleToggle}
      className={cn(
        "hover:bg-accent rounded-lg p-2 transition-colors",
        isFinanceEnabled && "bg-purple-500/10"
      )}
      variant="ghost"
      size="sm"
    >
      <IconChartLine
        size={20}
        className={cn(
          "text-muted-foreground",
          isFinanceEnabled && "text-purple-500"
        )}
        stroke={2}
      />
    </Button>
  )
}
