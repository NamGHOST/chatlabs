import { Tables } from "@/supabase/types"
import { AssistantIcon } from "./assistant-icon"

interface AssistantCardProps {
  assistant: Tables<"assistants">
  onClick: () => void
}

export function AssistantCard({ assistant, onClick }: AssistantCardProps) {
  return (
    <div
      className="hover:bg-accent flex cursor-pointer flex-col space-y-3 rounded-lg border p-4 transition-colors"
      onClick={onClick}
    >
      <div className="flex items-center space-x-3">
        <AssistantIcon assistant={assistant} size={40} />
        <div className="flex flex-col">
          <div className="font-semibold">{assistant.name}</div>
          <div className="text-muted-foreground line-clamp-1 text-sm">
            {assistant.description}
          </div>
        </div>
      </div>

      <div className="text-muted-foreground flex items-center space-x-2 text-xs">
        <div>{assistant.model}</div>
        <div>•</div>
        <div>{assistant.sharing}</div>
      </div>
    </div>
  )
}
