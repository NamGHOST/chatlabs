import { getSubtitles } from "@/lib/youtube"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { videoId } = await req.json()

    // Add proper browser-like headers
    const headers = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept-Language": "en-US,en;q=0.9",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      Referer: "https://www.youtube.com/",
      Origin: "https://www.youtube.com"
    }

    const languagesToTry = ["en", "zh-Hant", "zh-TW", "zh-CN", "zh"]
    let subtitles = null
    let error = null

    for (const lang of languagesToTry) {
      try {
        subtitles = await getSubtitles({
          videoID: videoId,
          lang: lang as "en" | "de" | "fr" | "zh-hk" | "zh-tw",
          headers // Pass headers to getSubtitles
        })
        if (subtitles) break
      } catch (e) {
        error = e
        console.error(`Failed for language ${lang}:`, e)
        continue
      }
    }

    if (!subtitles) {
      throw error || new Error("No captions found in any supported language")
    }

    return NextResponse.json({ subtitles })
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
