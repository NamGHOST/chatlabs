import { ChatbotUIContext } from "@/context/context"
import { IconUsers } from "@tabler/icons-react"
import { useRouter } from "next/navigation"
import { useContext } from "react"
import { useTranslation } from "react-i18next"
import { SidebarItem } from "../../sidebar-item"
import { SIDEBAR_ITEM_ICON_SIZE } from "./sidebar-display-item"

export const SidebarMeetingItem = () => {
  const { t } = useTranslation()
  const { selectedWorkspace } = useContext(ChatbotUIContext)
  const router = useRouter()

  if (!selectedWorkspace) return null

  return (
    <SidebarItem
      label={t("AI Meeting")}
      icon={
        <IconUsers
          size={SIDEBAR_ITEM_ICON_SIZE}
          stroke={1.5}
          className="text-muted-foreground"
        />
      }
      onClick={() => router.push("/meeting")}
      hasSubmenu={false}
      isCollapsed={false}
    />
  )
}
