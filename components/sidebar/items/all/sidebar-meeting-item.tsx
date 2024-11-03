import { ChatbotUIContext } from "@/context/context"
import { IconUsers } from "@tabler/icons-react"
import { useRouter } from "next/navigation"
import { useContext } from "react"
import { useTranslation } from "react-i18next"
import { SidebarItem } from "../../sidebar-item"
import { SIDEBAR_ITEM_ICON_SIZE } from "./sidebar-display-item"

export const SidebarMeetingItem = () => {
  const { t } = useTranslation()
  const { selectedWorkspace, profile, setIsPaywallOpen } =
    useContext(ChatbotUIContext)
  const router = useRouter()

  if (!selectedWorkspace) return null

  const handleMeetingClick = () => {
    if (!profile?.plan || profile.plan === "free") {
      setIsPaywallOpen(true)
      return
    }
    router.push("/meeting")
  }

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
      onClick={handleMeetingClick}
      hasSubmenu={false}
      isCollapsed={false}
    />
  )
}
