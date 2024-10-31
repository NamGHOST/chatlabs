"use client"

import { useContext } from "react"
import { ChatContext } from "@/context/context-provider"
import { Sheet, SheetContent } from "../ui/sheet"

export const AdvancedSettingsSidebar = () => {
  const context = useContext(ChatContext)

  if (!context) return null

  const { showAdvancedSettings, setShowAdvancedSettings } = context

  return (
    <Sheet open={showAdvancedSettings} onOpenChange={setShowAdvancedSettings}>
      <SheetContent side="right">
        <div className="h-full w-80 bg-gray-800 p-6">
          <h2 className="text-xl font-bold text-white">Advanced Settings</h2>
          {/* Add your advanced settings content here */}
        </div>
      </SheetContent>
    </Sheet>
  )
}
