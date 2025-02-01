import { getSubtitles } from "@/lib/youtube"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { videoId, language = "auto" } = await req.json()

    // Add proper browser-like headers
    const headers = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept-Language": "en-US,en;q=0.9,ja;q=0.8,zh;q=0.7",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      Referer: "https://www.youtube.com/",
      Origin: "https://www.youtube.com"
    }

    // Define language fallback chains for different source languages
    const languageMappings: { [key: string]: string[] } = {
      auto: ["en", "ja", "zh-JP", "ko", "zh-Hant", "zh-TW", "zh-CN", "zh"], // Try Japanese first since it's common
      ja: ["ja", "ja-JP"],
      en: ["en", "en-US", "en-GB"],
      zh: ["zh", "zh-Hant", "zh-TW", "zh-CN", "zh-HK"],
      ko: ["ko", "ko-KR"],
      es: ["es", "es-ES", "es-419"],
      fr: ["fr", "fr-FR"],
      de: ["de", "de-DE"],
      vi: ["vi", "vi-VN"],
      th: ["th", "th-TH"]
    }

    const languagesToTry = languageMappings[language] || languageMappings.auto
    let subtitles = null
    let error = null
    let successLanguage = null

    for (const lang of languagesToTry) {
      try {
        console.log(`Trying to fetch subtitles in language: ${lang}`)
        subtitles = await getSubtitles({
          videoID: videoId,
          lang,
          headers
        })
        if (subtitles) {
          successLanguage = lang
          break
        }
      } catch (e) {
        error = e
        console.error(`Failed for language ${lang}:`, e)
        continue
      }
    }

    if (!subtitles) {
      throw error || new Error("No captions found in any supported language")
    }

    return NextResponse.json({
      subtitles,
      detectedLanguage: successLanguage
    })
  } catch (error) {
    console.error("Error fetching subtitles:", error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch video subtitles"
      },
      { status: 500 }
    )
  }
}
