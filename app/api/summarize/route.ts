import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const { subtitles, language = "english" } = await req.json()

  const fullText = subtitles.map((sub: any) => sub.text).join(" ")

  const languagePrompts = {
    english: {
      lang: "English",
      headers: {
        summary: "Summary",
        keyPoints: "Key Points",
        overview: "Detailed Overview",
        timeline: "Timeline Highlights"
      }
    },
    chinese: {
      lang: "Traditional Chinese (繁體中文)",
      headers: {
        summary: "總結",
        keyPoints: "重點",
        overview: "詳細概述",
        timeline: "時間軸重點"
      }
    },
    japanese: {
      lang: "Japanese (日本語)",
      headers: {
        summary: "要約",
        keyPoints: "重要なポイント",
        overview: "詳細な概要",
        timeline: "タイムライン"
      }
    },
    korean: {
      lang: "Korean (한국어)",
      headers: {
        summary: "요약",
        keyPoints: "주요 포인트",
        overview: "상세 개요",
        timeline: "타임라인"
      }
    }
  }

  const selectedLanguage =
    languagePrompts[language as keyof typeof languagePrompts]

  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": `${process.env.NEXT_PUBLIC_SITE_URL}`
      },
      body: JSON.stringify({
        model: "google/gemini-flash-1.5-8b",
        messages: [
          {
            role: "system",
            content: `You are an expert analyst and professional translator specializing in comprehensive content analysis. Please provide a detailed analysis in ${selectedLanguage.lang} following this structured format:

# ${selectedLanguage.headers.summary}
[Provide a comprehensive 3-4 sentence summary capturing the main theme, context, and significance of the content]

## ${selectedLanguage.headers.keyPoints}
- [Key insight 1 with supporting detail]
- [Key insight 2 with supporting detail]
- [Key insight 3 with supporting detail]
- [Key insight 4 with supporting detail]
- [Key insight 5 with supporting detail]

## ${selectedLanguage.headers.overview}
[Provide a detailed analysis in 4-5 paragraphs, including:
- Context and background
- Main arguments or themes
- Supporting evidence and examples
- Implications or conclusions
- Notable quotes or specific references]

## ${selectedLanguage.headers.timeline}
- [Timestamp/Event 1]: [Detailed description]
- [Timestamp/Event 2]: [Detailed description]
- [Timestamp/Event 3]: [Detailed description]
(Include at least 5-7 significant moments with specific details)

IMPORTANT: 
1. The entire response MUST be in ${selectedLanguage.lang}, not just the headers
2. Maintain professional language and analytical depth throughout
3. Include specific examples and quotes where relevant
4. Ensure all sections are thoroughly detailed and interconnected`
          },
          {
            role: "user",
            content: `Analyze and summarize this transcript in detail: ${fullText}`
          }
        ]
      })
    }
  )

  const data = await response.json()
  return NextResponse.json({
    summary: data.choices[0].message.content,
    fullTranscript: fullText,
    keyPoints: [],
    overview: ""
  })
}
