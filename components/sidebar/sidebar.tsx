import {
  FC,
  useState,
  useContext,
  useRef,
  useEffect,
  useMemo,
  useCallback
} from "react"
import { motion } from "framer-motion"
import { SidebarItem } from "./sidebar-item"
import { SlidingSubmenu } from "./sliding-submenu"
import { SidebarCreateButtons } from "./sidebar-create-buttons"
import {
  IconMessage,
  IconPuzzle,
  IconFolder,
  IconTool,
  IconApps,
  IconChevronRight,
  IconChevronLeft,
  IconMessagePlus,
  IconRobot,
  IconX,
  IconMenu2,
  IconMessage2Plus,
  IconLayoutColumns,
  IconPuzzle2,
  IconBulb,
  IconArrowLeft
} from "@tabler/icons-react"
import { ChatbotUIContext } from "@/context/context"
import { Button } from "../ui/button"
import { cn } from "@/lib/utils"
import { SIDEBAR_ITEM_ICON_SIZE } from "@/components/sidebar/items/all/sidebar-display-item"
import { useParams, useRouter } from "next/navigation"
import { SearchInput } from "../ui/search-input"
import { ProfileSettings } from "../utility/profile-settings"
import { useChatHandler } from "../chat/chat-hooks/use-chat-handler"
import { SidebarDataList } from "./sidebar-data-list"
import { ContentType } from "@/types"
import Link from "next/link"
import { useAuth } from "@/context/auth"
import { generateToken } from "@/actions/token"

export const Sidebar: FC = () => {
  const {
    profile,
    chats,
    prompts,
    files,
    tools,
    assistants,
    folders,
    showSidebar,
    setShowSidebar
  } = useContext(ChatbotUIContext)
  const { handleNewChat } = useChatHandler()
  const [activeSubmenu, setActiveSubmenu] = useState<ContentType | null>(null)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const sidebarRef = useRef<HTMLDivElement>(null)

  const { user } = useAuth()
  const router = useRouter()

  const [searchQueries, setSearchQueries] = useState({
    chats: "",
    prompts: "",
    assistants: "",
    files: "",
    tools: ""
  })
  const [expandDelay, setExpandDelay] = useState(false)

  useEffect(() => {
    const storedCollapsedState = localStorage.getItem("sidebarCollapsed")
    setIsCollapsed(storedCollapsedState === "true")
    setIsLoaded(true)
  }, [])

  const isProPlan = useMemo(() => {
    if (!profile?.plan || profile?.plan === "free") {
      return false
    }
    return true
  }, [profile])

  const handleSubmenuOpen = (menuName: ContentType) => {
    if (isCollapsed) {
      setExpandDelay(true)
      setTimeout(() => {
        setIsCollapsed(false)
        setExpandDelay(false)
      }, 50)
    }
    setActiveSubmenu(menuName === activeSubmenu ? null : menuName)
  }

  const toggleCollapseOrSubmenu = () => {
    if (activeSubmenu) {
      setActiveSubmenu(null)
    } else {
      setIsCollapsed(!isCollapsed)
      localStorage.setItem("sidebarCollapsed", (!isCollapsed).toString())
    }
  }

  const handleCreateChat = () => {
    handleNewChat()
  }

  const iconProps = {
    size: SIDEBAR_ITEM_ICON_SIZE,
    stroke: 1.5,
    className: "text-muted-foreground"
  }

  const dataMap = useMemo(() => {
    return {
      chats: chats.filter(chat =>
        chat.name.toLowerCase().includes(searchQueries.chats.toLowerCase())
      ),
      prompts: prompts.filter(prompt =>
        prompt.name.toLowerCase().includes(searchQueries.prompts.toLowerCase())
      ),
      assistants: assistants.filter(assistant =>
        assistant.name
          .toLowerCase()
          .includes(searchQueries.assistants.toLowerCase())
      ),
      files: files.filter(file =>
        file.name.toLowerCase().includes(searchQueries.files.toLowerCase())
      ),
      tools: tools.filter(tool =>
        tool.name.toLowerCase().includes(searchQueries.tools.toLowerCase())
      )
    }
  }, [chats, prompts, assistants, files, tools, searchQueries])

  const foldersMap = useMemo(
    () => ({
      chats: folders.filter(folder => folder.type === "chats"),
      prompts: folders.filter(folder => folder.type === "prompts"),
      assistants: folders.filter(folder => folder.type === "assistants"),
      files: folders.filter(folder => folder.type === "files"),
      tools: folders.filter(folder => folder.type === "tools")
    }),
    [folders]
  )

  useEffect(() => {
    console.log("Folders changed:", foldersMap.chats)
  }, [foldersMap])

  function getSubmenuTitle(contentType: ContentType) {
    switch (contentType) {
      case "prompts":
        return "Prompts"
      case "assistants":
        return "Assistants"
      case "files":
        return "Files"
      case "tools":
        return "Plugins"
      default:
        return ""
    }
  }

  const toggleSidebar = () => {
    setShowSidebar(!showSidebar)
  }

  const linkMorphic = async () => {
    if (!isProPlan) return
    const token = await generateToken({ id: user?.id })
    router.push(`${process.env.NEXT_PUBLIC_MORPHIC_URL}?token=${token}`)
  }

  return useMemo(
    () => (
      <>
        <Button
          variant="ghost"
          size="icon"
          className="fixed left-2 top-2 z-50 md:hidden"
          onClick={() => handleCreateChat()}
        >
          <IconMessagePlus {...iconProps} />
        </Button>

        {/* Mobile overlay */}
        {showSidebar && (
          <div
            className="bg-background/80 fixed inset-0 z-40 backdrop-blur-sm md:hidden"
            onClick={() => setShowSidebar(false)}
          />
        )}

        <>{/* Sidebar */}</>
        <motion.div
          ref={sidebarRef}
          className={cn(
            "bg-background fixed inset-y-0 left-0 z-50 flex h-full flex-col border-r md:relative",
            !isLoaded && "invisible",
            showSidebar ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          )}
          animate={{
            width: isCollapsed ? 64 : 300
          }}
          transition={{
            duration: 0.3,
            ease: "easeInOut",
            delay: expandDelay ? 0.15 : 0
          }}
        >
          <div
            className={cn(
              "flex border-b",
              isCollapsed
                ? "flex-col items-center py-2"
                : "items-center justify-between p-2"
            )}
          >
            <Button
              variant="ghost"
              size={"icon"}
              onClick={handleCreateChat}
              title="New Chat"
            >
              <IconMessagePlus {...iconProps} />
            </Button>
            {isProPlan && (
              <Button
                variant="ghost"
                size={"icon"}
                onClick={linkMorphic}
                title="Link Morphic"
              >
                <IconArrowLeft {...iconProps} />
              </Button>
            )}
            <div className="flex items-center justify-between">
              {activeSubmenu && getSubmenuTitle(activeSubmenu)}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleCollapseOrSubmenu}
              className="hidden md:flex"
            >
              {isCollapsed ? (
                <IconChevronRight {...iconProps} />
              ) : (
                <IconChevronLeft {...iconProps} />
              )}
            </Button>
          </div>

          <div className="flex grow flex-col overflow-y-auto">
            <div className="p-2">
              <SidebarItem
                icon={<IconBulb {...iconProps} />}
                label="Prompts"
                onClick={() => handleSubmenuOpen("prompts")}
                hasSubmenu
                isCollapsed={isCollapsed}
              />
              <SidebarItem
                icon={<IconRobot {...iconProps} />}
                label="Assistants"
                onClick={() => handleSubmenuOpen("assistants")}
                hasSubmenu
                isCollapsed={isCollapsed}
              />
              <SidebarItem
                icon={<IconFolder {...iconProps} />}
                label="Files"
                onClick={() => handleSubmenuOpen("files")}
                hasSubmenu
                isCollapsed={isCollapsed}
              />
              <SidebarItem
                icon={<IconPuzzle {...iconProps} />}
                label="Plugins"
                onClick={() => handleSubmenuOpen("tools")}
                hasSubmenu
                isCollapsed={isCollapsed}
              />
              <Link href="/splitview" target="_blank" passHref>
                <SidebarItem
                  icon={<IconLayoutColumns {...iconProps} />}
                  label="Split view"
                  onClick={() => {}} // This onClick is now optional
                  isCollapsed={isCollapsed}
                />
              </Link>
              {/*<Link href="/applications" passHref>*/}
              {/*  <SidebarItem*/}
              {/*    icon={<IconApps {...iconProps} />}*/}
              {/*    label="Applications"*/}
              {/*    onClick={() => {}} // This onClick is now optional*/}
              {/*    isCollapsed={isCollapsed}*/}
              {/*  />*/}
              {/*</Link>*/}
            </div>

            <div
              className={cn(
                "flex grow flex-col border-t",
                isCollapsed ? "hidden" : ""
              )}
            >
              <div className="flex grow flex-col p-2 pb-0">
                <SearchInput
                  placeholder="Search chats"
                  value={searchQueries.chats}
                  onChange={value =>
                    setSearchQueries(prev => ({ ...prev, chats: value }))
                  }
                />
                <SidebarDataList
                  contentType="chats"
                  data={dataMap.chats}
                  folders={foldersMap.chats}
                />
              </div>
            </div>
          </div>

          <div className="border-t p-2">
            <ProfileSettings isCollapsed={isCollapsed} />
          </div>

          {/* Updated button positioning */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute -right-10 top-1/2 -translate-y-1/2 md:hidden"
            onClick={toggleSidebar}
          >
            <IconMenu2 {...iconProps} />
          </Button>

          {(["prompts", "assistants", "files", "tools"] as const).map(
            contentType => (
              <SlidingSubmenu
                key={contentType}
                isOpen={activeSubmenu === contentType}
                contentType={contentType}
                isCollapsed={isCollapsed}
              >
                <>
                  <div className="mb-2 flex items-center justify-between space-x-2">
                    <SearchInput
                      className="w-full"
                      placeholder={`Search ${contentType}`}
                      value={searchQueries[contentType]}
                      onChange={value =>
                        setSearchQueries(prev => ({
                          ...prev,
                          [contentType]: value
                        }))
                      }
                    />
                    <SidebarCreateButtons
                      contentType={contentType}
                      hasData={dataMap[contentType].length > 0}
                    />
                  </div>
                  <SidebarDataList
                    contentType={contentType}
                    data={dataMap[contentType]}
                    folders={foldersMap[contentType]}
                  />
                </>
              </SlidingSubmenu>
            )
          )}
        </motion.div>
      </>
    ),
    [
      activeSubmenu,
      chats,
      prompts,
      assistants,
      files,
      tools,
      folders,
      isCollapsed,
      isLoaded,
      showSidebar,
      searchQueries
    ]
  )
}
