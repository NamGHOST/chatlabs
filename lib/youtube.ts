import axios from "axios"
import protobuf from "protobufjs"

interface Subtitle {
  start: number
  dur: number
  text: string
}

function getBase64Protobuf(message: any) {
  const root = protobuf.Root.fromJSON({
    nested: {
      Message: {
        fields: {
          param1: { id: 1, type: "string" },
          param2: { id: 2, type: "string" }
        }
      }
    }
  })
  const MessageType = root.lookupType("Message")
  const buffer = MessageType.encode(message).finish()
  return Buffer.from(buffer).toString("base64")
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
    // Try first without ASR (manual captions)
    let message1 = {
      param1: "", // Empty for manual captions
      param2: lang
    }
    let protobufMessage1 = getBase64Protobuf(message1)
    let message2 = {
      param1: videoID,
      param2: protobufMessage1
    }
    let params = getBase64Protobuf(message2)

    const axiosHeaders = headers
      ? Object.fromEntries(
          headers instanceof Headers
            ? Array.from(headers.entries())
            : Array.isArray(headers)
              ? headers
              : Object.entries(headers)
        )
      : {}

    try {
      const response = await axios.post(
        "https://www.youtube.com/youtubei/v1/get_transcript",
        {
          context: {
            client: {
              clientName: "WEB",
              clientVersion: "2.20240826.01.00",
              hl: lang // Add language code to context
            }
          },
          params
        },
        { headers: axiosHeaders }
      )

      if (
        response.data?.actions?.[0]?.updateEngagementPanelAction?.content
          ?.transcriptRenderer?.content?.transcriptSearchPanelRenderer?.body
          ?.transcriptSegmentListRenderer?.initialSegments
      ) {
        return processSegments(
          response.data.actions[0].updateEngagementPanelAction.content
            .transcriptRenderer.content.transcriptSearchPanelRenderer.body
            .transcriptSegmentListRenderer.initialSegments
        )
      }
    } catch (error) {
      console.log("Manual captions not found, trying auto-generated...")
    }

    // If manual captions fail, try ASR (auto-generated)
    message1 = {
      param1: "asr",
      param2: lang
    }
    protobufMessage1 = getBase64Protobuf(message1)
    message2 = {
      param1: videoID,
      param2: protobufMessage1
    }
    params = getBase64Protobuf(message2)

    const asrResponse = await axios.post(
      "https://www.youtube.com/youtubei/v1/get_transcript",
      {
        context: {
          client: {
            clientName: "WEB",
            clientVersion: "2.20240826.01.00",
            hl: lang
          }
        },
        params
      },
      { headers: axiosHeaders }
    )

    if (
      !asrResponse.data?.actions?.[0]?.updateEngagementPanelAction?.content
        ?.transcriptRenderer?.content?.transcriptSearchPanelRenderer?.body
        ?.transcriptSegmentListRenderer?.initialSegments
    ) {
      throw new Error(`No captions available for language: ${lang}`)
    }

    return processSegments(
      asrResponse.data.actions[0].updateEngagementPanelAction.content
        .transcriptRenderer.content.transcriptSearchPanelRenderer.body
        .transcriptSegmentListRenderer.initialSegments
    )
  } catch (error) {
    console.error("Error in getSubtitles:", error)
    throw error
  }
}

function processSegments(segments: any[]) {
  if (!Array.isArray(segments)) {
    throw new Error("Segments is not an array")
  }

  return segments.map((segment: any) => {
    const renderer = segment.transcriptSegmentRenderer
    if (
      !renderer?.startMs ||
      !renderer?.endMs ||
      !renderer?.snippet?.runs?.[0]?.text
    ) {
      throw new Error("Invalid segment structure")
    }
    return {
      start: parseInt(renderer.startMs) / 1000,
      dur: (parseInt(renderer.endMs) - parseInt(renderer.startMs)) / 1000,
      text: renderer.snippet.runs[0].text
    }
  })
}
