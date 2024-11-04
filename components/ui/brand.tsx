"use client"

import { FC } from "react"
import { ChatbotUISVG } from "../icons/chatbotui-svg" // Static SVG
import { AnimatedChatbotUISVG } from "../icons/chatbotui-svg-animation" // Animated SVG
import { useTranslation } from "react-i18next"

interface BrandProps {
  theme?: "dark" | "light"
}

export const Brand: FC<BrandProps> = ({ theme = "dark" }) => {
  const { t } = useTranslation()

  return (
    <div className="flex cursor-pointer flex-col items-center">
      <div className="mb-2">
        <AnimatedChatbotUISVG size={141 * 0.6} />
      </div>

      <div className="rounded-full border border-gray-200 px-4 py-1">
        <h3 className="sans-noto font-montserrat text-2xl font-light ">
          imogenai.app
        </h3>
      </div>
    </div>
  )
}
