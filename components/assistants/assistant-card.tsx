import { Tables } from "@/supabase/types"
import { AssistantIcon } from "./assistant-icon"
import { IconLock, IconWorld } from "@tabler/icons-react"

interface AssistantCardProps {
  assistant: Tables<"assistants">
  onClick: () => void
}

export function AssistantCard({ assistant, onClick }: AssistantCardProps) {
  return (
    <div
      className="bg-background hover:bg-muted group relative flex cursor-pointer items-start gap-4 rounded-xl border p-4 transition-all duration-300"
      onClick={onClick}
    >
      <AssistantIcon assistant={assistant} size={55} />

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between gap-2">
          <div className="text-foreground truncate text-base font-semibold">
            {assistant.name}
          </div>
          <div className="text-muted-foreground shrink-0">
            {assistant.sharing === "public" ? (
              <IconWorld size={16} />
            ) : (
              <IconLock size={16} />
            )}
          </div>
        </div>

        <div className="text-muted-foreground mt-1 line-clamp-3 text-[13px]">
          {assistant.description}
        </div>
      </div>
    </div>
  )
}
