import { ChatbotUIContext } from "@/context/context"
import { IconUsers } from "@tabler/icons-react"
import { useRouter } from "next/navigation"
import { useContext } from "react"
import { useTranslation } from "react-i18next"
import { SidebarItem } from "../../sidebar-item"

export const SidebarMeetingItem = () => {
  const { t } = useTranslation()
  const { selectedWorkspace } = useContext(ChatbotUIContext)
  const router = useRouter()

  if (!selectedWorkspace) return null

  return (
    <SidebarItem
      label={t("AI Meeting")}
      icon={<IconUsers size={20} />}
      onClick={() => router.push("/meeting")}
      hasSubmenu={false}
      isCollapsed={false}
    />
  )
}
