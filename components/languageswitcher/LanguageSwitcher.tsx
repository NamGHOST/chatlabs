import React from "react"
import i18n from "../../i18n"
import { IconLanguage } from "@tabler/icons-react"

export default function LanguageSwitcher() {
  const changeLanguage = async (locale: string) => {
    try {
      await i18n.changeLanguage(locale)
      console.log(`Language changed to ${locale}`)
    } catch (err) {
      console.error(`Failed to change language: ${err}`)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <IconLanguage className="size-5 text-gray-600" stroke={1.5} />
      <select
        onChange={e => changeLanguage(e.target.value)}
        defaultValue={i18n.language}
        className="text-md rounded-lg border border-gray-300 bg-white p-1 text-gray-900 focus:border-blue-500 focus:ring-blue-500"
      >
        <option value="en">English</option>
        <option value="jp">日本語</option>
        <option value="kr">한국어</option>
        <option value="zh">繁體中文</option>
      </select>
    </div>
  )
}
