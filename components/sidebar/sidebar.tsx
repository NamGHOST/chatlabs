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
  IconPuzzle,
  IconFolder,
  IconChevronRight,
  IconChevronLeft,
  IconMessagePlus,
  IconRobot,
  IconLayoutColumns,
  IconBulb,
  IconLayoutSidebar,
  IconSparkles,
  IconWorldSearch,
  IconPhoto,
  IconPhotoAi,
  IconBrandYoutube,
  IconFileAnalytics
} from "@tabler/icons-react"
import { ChatbotUIContext } from "@/context/context"
import { Button } from "../ui/button"
import { cn } from "@/lib/utils"
import { SIDEBAR_ITEM_ICON_SIZE } from "@/components/sidebar/items/all/sidebar-display-item"
import { SearchInput } from "../ui/search-input"
import { ProfileSettings } from "../utility/profile-settings"
import { useChatHandler } from "../chat/chat-hooks/use-chat-handler"
import { SidebarDataList } from "./sidebar-data-list"
import { ContentType } from "@/types"
import Link from "next/link"
import { useAuth } from "@/context/auth"
import { generateToken } from "@/actions/token"
import { WithTooltip } from "../ui/with-tooltip"
import { searchChatsByName } from "@/db/chats"
import { debounce } from "@/lib/debounce"
import { Tables } from "@/supabase/types"

import { useRouter } from "next/navigation"
import { SidebarMeetingItem } from "./items/all/sidebar-meeting-item"
import { useTranslation } from "next-i18next"
export const Sidebar: FC = () => {
  const {
    prompts,
    files,
    tools,
    assistants,
    folders,
    profile,
    selectedWorkspace,
    showSidebar,
    setShowSidebar,
    isPaywallOpen,
    chats,
    setChats,
    setIsPaywallOpen,
    setShowAdvancedSettings
  } = useContext(ChatbotUIContext)
  const { handleNewChat } = useChatHandler()
  const [activeSubmenu, setActiveSubmenu] = useState<ContentType | null>(null)
  const [showMobileFeatures, setShowMobileFeatures] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const storedCollapsedState = localStorage.getItem("sidebarCollapsed")
    return storedCollapsedState === "true"
  })
  const [isLoaded, setIsLoaded] = useState(false)
  const sidebarRef = useRef<HTMLDivElement>(null)

  const { user } = useAuth()
  const router = useRouter()

  const [searchQueries, setSearchQueries] = useState<{
    chats: string
    prompts: string
    assistants: string
    files: string
    tools: string
    meeting: string
  }>({
    chats: "",
    prompts: "",
    assistants: "",
    files: "",
    tools: "",
    meeting: ""
  })

  const [expandDelay, setExpandDelay] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)

  const [chatOffset, setChatOffset] = useState(0)

  const [reachedEnd, setReachedEnd] = useState(false)

  const loadMoreChats = useCallback(async () => {
    console.log("loadMoreChats")
    if (searchLoading) return
    if (reachedEnd) return
    const lastChatCreatedAt = chats?.[chats.length - 1]?.created_at
    handleSearchChange(searchQueries.chats, chatOffset + 40, lastChatCreatedAt)
  }, [searchQueries.chats, chatOffset, chats, reachedEnd, searchLoading])

  const handleSearchChange = useCallback(
    debounce(async (query: string, offset: number, lastCreatedAt?: string) => {
      if (!selectedWorkspace) return
      setSearchLoading(true)
      const newChats = await searchChatsByName(
        selectedWorkspace.id,
        query,
        lastCreatedAt,
        offset,
        40
      )
      if (offset === 0) {
        setChats(newChats)
      } else {
        setChats(prevChats => [...prevChats, ...newChats])
      }
      setChatOffset(offset) // Update offset for pagination
      setSearchLoading(false)
      setReachedEnd(newChats.length < 40)
    }, 300), // Debounce delay of 300ms
    [selectedWorkspace, reachedEnd]
  )

  useEffect(() => {
    handleSearchChange(searchQueries.chats, 0)
  }, [searchQueries.chats])

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  const isPaidPlan = useMemo(() => {
    if (!profile?.plan || profile?.plan === "free") {
      return false
    }
    return true
  }, [profile])

  const handleSubmenuOpen = (menuName: ContentType) => {
    if (menuName === "files" && !isPaidPlan) {
      setIsPaywallOpen(true)
      return
    }

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
      setIsCollapsed(prevState => {
        const newState = !prevState
        try {
          localStorage.setItem("sidebarCollapsed", newState.toString())
        } catch (error) {
          console.error("Error setting sidebar collapsed state:", error)
        }
        return newState
      })
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

  const dataMap = useMemo(
    () => ({
      chats,
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
    }),
    [prompts, assistants, files, tools, searchQueries, chats]
  )

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

  const linkMorphic = async () => {
    if (!isPaidPlan) return
    const token = await generateToken({ id: user?.id })
    router.push(`${process.env.NEXT_PUBLIC_MORPHIC_URL}?token=${token}`)
  }

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

  const COLLAPSED_SIDEBAR_WIDTH = 58
  const EXPANDED_SIDEBAR_WIDTH = 300
  const { t } = useTranslation()

  const handleUpgrade = () => {
    setIsPaywallOpen(true)
  }

  return useMemo(
    () => (
      <>
        <Button
          variant="ghost"
          size="icon"
          className="fixed left-2 top-2 z-50 md:hidden"
          onClick={() => {
            setShowSidebar(true)
            setIsCollapsed(false)
            setActiveSubmenu(null)
          }}
        >
          <IconLayoutSidebar {...iconProps} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="fixed left-12 top-2 z-50 md:hidden"
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

        {/* Sidebar */}
        <motion.div
          ref={sidebarRef}
          className={cn(
            "bg-background fixed inset-y-0 left-0 z-50 flex h-full flex-col border-r md:relative",
            !isLoaded && "invisible",
            showSidebar ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          )}
          initial={{
            width: isCollapsed
              ? COLLAPSED_SIDEBAR_WIDTH
              : EXPANDED_SIDEBAR_WIDTH
          }}
          animate={{
            width: isCollapsed
              ? COLLAPSED_SIDEBAR_WIDTH
              : EXPANDED_SIDEBAR_WIDTH
          }}
          transition={{
            duration: 0.3,
            ease: "easeInOut",
            delay: expandDelay ? 0.15 : 0
          }}
        >
          <div
            className={cn(
              "relative flex items-center border-b p-2",
              isCollapsed ? "flex-col" : "justify-between"
            )}
          >
            <WithTooltip
              asChild
              display={<div>New Chat</div>}
              trigger={
                <Button
                  className="w-10 shrink-0"
                  variant="ghost"
                  size={"icon"}
                  onClick={handleCreateChat}
                  title="New Chat"
                >
                  <IconMessagePlus {...iconProps} />
                </Button>
              }
              side="right"
            />
            {!isCollapsed && (
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-medium">
                {activeSubmenu && getSubmenuTitle(activeSubmenu)}
              </div>
            )}
          </div>

          {/* Floating Collapse Button */}
          <WithTooltip
            asChild
            display={<div>{isCollapsed ? "Expand" : "Collapse"}</div>}
            trigger={
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleCollapseOrSubmenu}
                className={cn(
                  "absolute -right-[12px] top-1/2 z-50 hidden h-24 w-4 -translate-y-1/2 md:block",
                  "bg-border hover:bg-foreground/30 rounded-full transition-colors duration-200",
                  "before:absolute before:left-1/2 before:top-1/2 before:-translate-x-1/2 before:-translate-y-1/2",
                  "before:text-foreground/50 before:opacity-0 before:transition-opacity hover:before:opacity-100",
                  isCollapsed
                    ? "before:content-['>']"
                    : "bg-primary/20 hover:bg-primary/30 before:content-['<']"
                )}
              />
            }
            side="right"
          />

          <div className="flex grow flex-col overflow-y-auto">
            <div className="p-2">
              {/* Mobile features toggle button */}
              <div className="mb-2 md:hidden">
                <Button
                  variant="ghost"
                  className="flex w-full items-center justify-between"
                  onClick={() => setShowMobileFeatures(!showMobileFeatures)}
                >
                  <span>Additional Features</span>
                  <IconChevronRight
                    className={cn(
                      "transition-transform",
                      showMobileFeatures ? "rotate-90" : ""
                    )}
                    size={20}
                  />
                </Button>
              </div>

              {/* Features section - show based on mobile toggle or desktop */}
              <div className={cn("md:block", !showMobileFeatures && "hidden")}>
                <SidebarItem
                  icon={<IconBulb {...iconProps} />}
                  label={t("Prompts")}
                  onClick={() => handleSubmenuOpen("prompts")}
                  hasSubmenu
                  isCollapsed={isCollapsed}
                />
                <SidebarItem
                  icon={<IconRobot {...iconProps} />}
                  label={t("Assistants")}
                  onClick={() => handleSubmenuOpen("assistants")}
                  hasSubmenu
                  isCollapsed={isCollapsed}
                />
                <SidebarItem
                  icon={<IconFolder {...iconProps} />}
                  label={t("Files")}
                  onClick={() => handleSubmenuOpen("files")}
                  hasSubmenu
                  isCollapsed={isCollapsed}
                />
                <SidebarItem
                  icon={<IconPuzzle {...iconProps} />}
                  label={t("Plugins")}
                  onClick={() => handleSubmenuOpen("tools")}
                  hasSubmenu
                  isCollapsed={isCollapsed}
                />
                <Link href="/splitview" target="_blank" passHref>
                  <SidebarItem
                    icon={<IconLayoutColumns {...iconProps} />}
                    label={t("Split view")}
                    onClick={() => {}}
                    isCollapsed={isCollapsed}
                  />
                </Link>
                <Link href="/memo-draw" target="_blank" passHref>
                  <SidebarItem
                    icon={<IconFileAnalytics {...iconProps} />}
                    label={t("Memo draw")}
                    onClick={() => {}}
                    isCollapsed={isCollapsed}
                  />
                </Link>
                <SidebarMeetingItem />
                <Link href="/image-generation" target="_blank" passHref>
                  <SidebarItem
                    icon={<IconPhotoAi {...iconProps} />}
                    label={t("Text to Image")}
                    onClick={() => {}}
                    isCollapsed={isCollapsed}
                  />
                </Link>
                <Link href="/youtube-summarizer" target="_blank" passHref>
                  <SidebarItem
                    icon={<IconBrandYoutube {...iconProps} />}
                    label={t("YouTube Summarizer")}
                    onClick={() => {}}
                    isCollapsed={isCollapsed}
                  />
                </Link>
              </div>
            </div>

            <div
              className={cn(
                "flex grow flex-col border-t",
                isCollapsed ? "hidden" : ""
              )}
            >
              <div className="flex grow flex-col p-2 pb-0">
                <SearchInput
                  placeholder="Search chats and messages"
                  value={searchQueries.chats}
                  loading={searchLoading}
                  onChange={e =>
                    setSearchQueries({ ...searchQueries, chats: e })
                  }
                />
                <SidebarDataList
                  contentType="chats"
                  data={dataMap.chats}
                  folders={foldersMap.chats}
                  onLoadMore={loadMoreChats}
                />
              </div>
            </div>
          </div>

          {/* Upgrade message for free plan users */}

          {isPaidPlan && (
            <div className="flex flex-col items-center">
              <Button
                variant="ghost"
                size={"icon"}
                onClick={linkMorphic}
                title="AI search BETA"
              >
                <IconWorldSearch {...iconProps} />
              </Button>
              <span className="text-muted-foreground mt-1 text-xs">
                AI search BETA
              </span>
            </div>
          )}

          {profile?.plan === "free" && (
            <div className="border-t p-2">
              <div className="flex flex-col items-center justify-between space-y-2 text-sm">
                {!isCollapsed && (
                  <div className="font-semibold">Upgrade to Pro</div>
                )}
                {!isCollapsed && (
                  <div className="text-muted-foreground text-center text-xs">
                    Upgrade to get access to all models, assistants, plugins and
                    more.
                  </div>
                )}
                <Button
                  variant="default"
                  size={isCollapsed ? "icon" : "sm"}
                  className="rounded-full bg-violet-700"
                  onClick={handleUpgrade}
                >
                  <IconSparkles
                    {...iconProps}
                    className="text-white"
                    stroke={1.5}
                  />
                  {!isCollapsed && <span className="ml-2">Upgrade</span>}
                </Button>
              </div>
            </div>
          )}

          {profile && (
            <div className="border-t p-2">
              <ProfileSettings isCollapsed={isCollapsed} />
            </div>
          )}

          {!isCollapsed &&
            (["prompts", "assistants", "files", "tools"] as const).map(
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
                        onChange={e =>
                          setSearchQueries({
                            ...searchQueries,
                            [contentType]: e
                          })
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
      searchQueries,
      profile,
      isPaywallOpen, // Use context's state
      loadMoreChats, // Add loadMoreChats to dependencies
      searchLoading, // Add searchLoading to dependencies
      showMobileFeatures
    ]
  )
}
