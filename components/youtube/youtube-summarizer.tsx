import { useState } from "react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "../ui/select"
import ReactMarkdown from "react-markdown"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup
} from "@/components/ui/resizable"
import { useTranslation } from "react-i18next"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion"
import { DownloadIcon } from "lucide-react"

interface SummaryData {
  summary: string
  fullTranscript: string
  keyPoints: string[]
  overview: string
}

export const YouTubeSummarizer = () => {
  const { t } = useTranslation()
  const [url, setUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [videoInfo, setVideoInfo] = useState<{
    imageUrl: string
    videoUrl: string
  } | null>(null)
  const [videoId, setVideoId] = useState<string | null>(null)

  const [summaryData, setSummaryData] = useState<{
    summary: string
    keyPoints: string[]
    timeline: Array<{
      time: string
      content: string
    }>
    overview: string
  } | null>(null)

  const [language, setLanguage] = useState("english")

  const handleSummarize = async () => {
    try {
      setLoading(true)
      setError(null)
      let videoId = url

      if (!videoId) {
        throw new Error("Please enter a YouTube URL")
      }

      if (videoId.includes("youtube.com/watch?v=")) {
        videoId = videoId.split("youtube.com/watch?v=")[1]
      } else if (videoId.includes("youtu.be/")) {
        videoId = videoId.split("youtu.be/")[1]
      }

      videoId = videoId.split(/[&?]/)[0]

      const captionsResponse = await fetch("/api/youtube", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId })
      })

      const captionsData = await captionsResponse.json()

      if (!captionsResponse.ok) {
        throw new Error(captionsData.error || "Failed to fetch subtitles")
      }

      // Send subtitles for summarization
      const summaryResponse = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subtitles: captionsData.subtitles,
          language
        })
      })

      const summaryData: SummaryData = await summaryResponse.json()

      setSummaryData({
        summary: summaryData.summary,
        timeline: captionsData.subtitles.map((sub: any, index: number) => ({
          time: formatTime(sub.start),
          content: sub.text
        })),
        keyPoints: summaryData.keyPoints,
        overview: summaryData.overview
      })

      setVideoInfo({
        imageUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        videoUrl: `https://youtube.com/watch?v=${videoId}`
      })

      setVideoId(videoId)
    } catch (error) {
      console.error("Error summarizing video:", error)
      setError(
        error instanceof Error ? error.message : "Failed to summarize video"
      )
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (seconds: string): string => {
    const time = parseInt(seconds)
    const minutes = Math.floor(time / 60)
    const secs = time % 60
    return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
  }

  // Helper function to group transcript by chapters (every 5 minutes)
  const groupTranscriptByChapters = (
    timeline: Array<{ time: string; content: string }>
  ) => {
    const MINUTES_PER_CHAPTER = 5
    return timeline.reduce(
      (acc, curr) => {
        const timeInMinutes = parseInt(curr.time.split(":")[0])
        const chapterIndex = Math.floor(timeInMinutes / MINUTES_PER_CHAPTER)
        const chapterTitle = `${chapterIndex * MINUTES_PER_CHAPTER}-${(chapterIndex + 1) * MINUTES_PER_CHAPTER} minutes`

        if (!acc[chapterTitle]) {
          acc[chapterTitle] = []
        }
        acc[chapterTitle].push(curr)
        return acc
      },
      {} as Record<string, typeof timeline>
    )
  }

  const downloadTranscript = (format: "txt" | "srt" | "json") => {
    if (!summaryData?.timeline) return

    let content = ""
    const filename = `transcript-${videoId}`

    switch (format) {
      case "txt":
        content = summaryData.timeline
          .map(item => `${item.time}: ${item.content}`)
          .join("\n")
        break
      case "srt":
        content = summaryData.timeline
          .map((item, index) => {
            return `${index + 1}\n${item.time},000 --> ${item.time},999\n${item.content}\n\n`
          })
          .join("")
        break
      case "json":
        content = JSON.stringify(summaryData.timeline, null, 2)
        break
    }

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${filename}.${format}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="container mx-auto max-w-7xl p-4">
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-2xl font-bold">{t("YouTube Summarizer")}</h1>
        <p className="text-muted-foreground">
          {t("Get quick summaries of YouTube videos")}
        </p>
      </div>

      <div className="mb-6 flex space-x-2">
        <Input
          placeholder="Enter YouTube URL..."
          value={url}
          onChange={e => setUrl(e.target.value)}
          className="flex-1"
        />
        <Select value={language} onValueChange={setLanguage}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select Language" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="english">English</SelectItem>
            <SelectItem value="chinese">Chinese</SelectItem>
            <SelectItem value="japanese">Japanese</SelectItem>
            <SelectItem value="korean">Korean</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={handleSummarize} disabled={loading}>
          {loading ? t("Summarizing...") : t("Summarize")}
        </Button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-100 p-4 text-red-700">
          {error}
        </div>
      )}

      {summaryData && !error && (
        <ResizablePanelGroup
          direction="horizontal"
          className="min-h-[600px] rounded-lg border"
        >
          <ResizablePanel defaultSize={65}>
            <div className="h-full p-4">
              {videoInfo && (
                <div className="aspect-video w-full">
                  {videoId && (
                    <iframe
                      id="youtube-player"
                      src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1`}
                      className="size-full rounded-lg"
                      allowFullScreen
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    />
                  )}
                </div>
              )}

              <ScrollArea className="h-[calc(100vh-28rem)]">
                <div className="prose prose-sm dark:prose-invert max-w-none rounded-lg border p-4">
                  <ReactMarkdown>{summaryData.summary}</ReactMarkdown>
                </div>
              </ScrollArea>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel defaultSize={35}>
            <div className="h-full p-4">
              <div className="sticky top-0 z-10 mb-3 bg-white pb-2 dark:bg-gray-950">
                <h2 className="text-xl font-bold">{t("Transcript")}</h2>
              </div>
              <ScrollArea className="h-[calc(100vh-12rem)]">
                <Accordion type="single" collapsible className="w-full">
                  {Object.entries(
                    groupTranscriptByChapters(summaryData.timeline)
                  ).map(([chapter, items], index) => (
                    <AccordionItem key={chapter} value={chapter}>
                      <AccordionTrigger className="rounded-lg px-2 hover:bg-gray-100 dark:hover:bg-gray-900">
                        {chapter}
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4">
                          {items.map((item, idx) => (
                            <div
                              key={idx}
                              className="group rounded-lg p-2 transition-colors hover:bg-gray-50 dark:hover:bg-gray-900"
                              onClick={() => {
                                const videoElement =
                                  document.querySelector<HTMLIFrameElement>(
                                    "#youtube-player"
                                  )
                                if (videoElement?.contentWindow) {
                                  const timeInSeconds = item.time
                                    .split(":")
                                    .reduce((acc, time) => 60 * acc + +time, 0)
                                  videoElement.contentWindow.postMessage(
                                    JSON.stringify({
                                      event: "command",
                                      func: "seekTo",
                                      args: [timeInSeconds, true]
                                    }),
                                    "*"
                                  )
                                }
                              }}
                            >
                              <div className="flex cursor-pointer items-start gap-3">
                                <span className="whitespace-nowrap pt-1 font-mono text-sm text-gray-500">
                                  {item.time}
                                </span>
                                <p className="flex-1 text-gray-800 dark:text-gray-200">
                                  {item.content}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </ScrollArea>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      )}

      <div className="flex gap-2">
        <Button
          onClick={() => downloadTranscript("txt")}
          disabled={!summaryData}
          size="sm"
        >
          <DownloadIcon className="mr-2 size-4" />
          Download TXT
        </Button>
        <Button
          onClick={() => downloadTranscript("srt")}
          disabled={!summaryData}
          size="sm"
        >
          <DownloadIcon className="mr-2 size-4" />
          Download SRT
        </Button>
        <Button
          onClick={() => downloadTranscript("json")}
          disabled={!summaryData}
          size="sm"
        >
          <DownloadIcon className="mr-2 size-4" />
          Download JSON
        </Button>
      </div>
    </div>
  )
}
