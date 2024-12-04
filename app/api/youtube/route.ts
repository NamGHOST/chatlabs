import { getSubtitles } from "@/lib/youtube"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { videoId } = await req.json()

    // Try different languages in order of preference
    const languagesToTry = ["en", "zh-Hant", "zh-TW", "zh-CN", "zh"]
    let subtitles = null
    let error = null

    for (const lang of languagesToTry) {
      try {
        subtitles = await getSubtitles({
          videoID: videoId,
          lang: lang as "en" | "de" | "fr" | "zh-hk" | "zh-tw"
        })
        if (subtitles) break
      } catch (e) {
        error = e
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
