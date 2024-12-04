import he from "he"
import { find } from "lodash"
import striptags from "striptags"

const fetchCaptions = async (
  videoId: string,
  lang: string,
  headers?: HeadersInit
) => {
  try {
    // First, get the video page to extract caption data
    const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: headers || {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    })
    const html = await response.text()

    // Extract caption tracks data
    const captionRegex = /"captionTracks":(\[.*?\])/
    const match = captionRegex.exec(html)

    if (!match) {
      throw new Error(`Could not find captions for video: ${videoId}`)
    }

    const { captionTracks } = JSON.parse(`{${match[0]}}`)

    // Find caption in requested language, with fallbacks
    const caption =
      captionTracks.find((track: any) => {
        const trackLang = track.languageCode?.toLowerCase()
        const targetLang = lang.toLowerCase()
        return (
          trackLang === targetLang ||
          trackLang?.startsWith(targetLang) ||
          targetLang?.startsWith(trackLang)
        )
      }) || captionTracks[0] // Fallback to first available caption

    if (!caption?.baseUrl) {
      throw new Error(`No captions available in ${lang} language`)
    }

    // Fetch the actual captions
    const captionResponse = await fetch(caption.baseUrl)
    if (!captionResponse.ok) {
      throw new Error("Failed to fetch caption track")
    }

    const transcript = await captionResponse.text()
    return transcript
  } catch (error) {
    console.error("Error in fetchCaptions:", error)
    throw error
  }
}

export async function getSubtitles({
  videoID,
  lang = "en",
  headers
}: {
  videoID: string
  lang: string
  headers?: HeadersInit
}) {
  try {
    const transcript = await fetchCaptions(videoID, lang, headers)

    // Parse the XML transcript into the expected format
    const lines = transcript
      .replace('<?xml version="1.0" encoding="utf-8" ?><transcript>', "")
      .replace("</transcript>", "")
      .split("</text>")
      .filter(line => line && line.trim())
      .map(line => {
        const startRegex = /start="([\d.]+)"/
        const durRegex = /dur="([\d.]+)"/

        const startMatch = startRegex.exec(line)
        const durMatch = durRegex.exec(line)

        if (!startMatch || !durMatch) return null

        const htmlText = line
          .replace(/<text.+>/, "")
          .replace(/&amp;/gi, "&")
          .replace(/<\/?[^>]+(>|$)/g, "")

        const decodedText = he.decode(htmlText)
        const text = striptags(decodedText)

        return {
          start: startMatch[1],
          dur: durMatch[1],
          text
        }
      })
      .filter(Boolean)

    return lines
  } catch (error) {
    console.error("Error in getSubtitles:", error)
    throw error
  }
}
