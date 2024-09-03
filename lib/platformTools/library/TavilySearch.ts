import { PlatformTool, SearchResult } from "@/types/platformTools"

// Update the SearchResult type
interface ExtendedSearchResult extends SearchResult {
  report: string
}

// This function performs a web search using Tavily's API and returns the search results.
const tavilySearch = async (
  params: { parameters: { query: string } } | { query: string }
): Promise<Omit<SearchResult, "responseTime"> & { report: string }> => {
  if ("parameters" in params) {
    params = params.parameters
  }

  const { query } = params

  if (!query) {
    throw new Error("Query is required")
  }

  const apiKey = process.env.TAVILY_API_KEY
  if (!apiKey) {
    throw new Error("Tavily API key is required")
  }

  const apiUrl = "https://api.tavily.com/search"
  let numResults = 0
  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        api_key: apiKey,
        query: query,
        include_images: true
      })
    })

    if (!response.ok) {
      throw new Error(`Tavily API error: ${response.statusText}`)
    }

    const data = await response.json()

    let searchResults = data.results.map((result: any) => ({
      title: result.title,
      url: result.url,
      image: null,
      snippet: result.snippet,
      content: result.content
    }))

    const searchImages = data.images || []

    searchResults = searchResults.map((result: any, index: number) => {
      return {
        ...result,
        image: searchImages[index] || null
      }
    })

    console.log("Combined search results with images:", searchResults)

    const report = await generateReport(searchResults, query)

    return {
      results: searchResults,
      numResults: data.numResults || searchResults.length,
      report: report
    }
  } catch (error: any) {
    console.error("Failed to perform web search", error, numResults)
    throw new Error("Failed to perform web search", error)
  }
}

async function generateReport(
  searchResults: any[],
  query: string
): Promise<string> {
  let report = `# ${generateReportTitle(query)}\n\n`

  report += generateIntroduction(query)

  for (const result of searchResults) {
    report += `## ${result.title}\n\n`
    report += `${result.snippet}\n\n`
    if (result.content) {
      report += `Key points:\n`
      report += `${summarizeContent(result.content)}\n\n`
    }
    report += `[Read more](${result.url})\n\n`
  }

  return report
}

function generateReportTitle(query: string): string {
  // Generate a title based on the query
  return `AI Report: ${query}`
}

function generateIntroduction(query: string): string {
  // Generate an introduction based on the query
  return `This report provides an overview of recent developments related to "${query}" in the field of artificial intelligence. It synthesizes information from multiple sources to present key insights and trends.\n\n`
}

function summarizeContent(content: string): string {
  // Implement a summarization algorithm here
  // Be sure to paraphrase and not copy directly
  // Return a brief, original summary
  return "Summary placeholder" // Replace with actual summarization logic
}

class PlannerAgent {
  async generateResearchQuestions(topic: string): Promise<string[]> {
    // Use GPT to generate research questions
    // For simplicity, we'll use a predefined list
    return [
      `What are the latest developments in ${topic}?`,
      `What are the main challenges in ${topic}?`,
      `What are the future prospects of ${topic}?`
    ]
  }

  async aggregateResults(
    results: ExtendedSearchResult[],
    topic: string
  ): Promise<string> {
    // Use GPT to aggregate and summarize results
    // For now, we'll use a simple template
    let report = `# Comprehensive Report on ${topic}\n\n`
    results.forEach((result, index) => {
      report += `## Research Question ${index + 1}\n\n`
      report += result.report + "\n\n"
    })
    return report
  }
}

async function conductResearch(topic: string): Promise<string> {
  const planner = new PlannerAgent()
  const questions = await planner.generateResearchQuestions(topic)

  const results = await Promise.all(
    questions.map(async question => {
      const searchResult = await tavilySearch({ query: question })
      return searchResult as ExtendedSearchResult
    })
  )

  const report = await planner.aggregateResults(results, topic)
  return report
}

// This is the definition of the web search tool.
export const webSearchTool: PlatformTool = {
  id: "d3f08b6e-7e02-423f-9g07-ee51830809fe", // This is the unique identifier of the tool.
  name: "Web Search", // This is the name of the tool.
  toolName: "tavilySearch", // This is the name of the tool in the code.
  version: "v1.0.0", // This is the version of the tool.
  // This is the description of the tool.
  description: "Search the web using Tavily's API and return relevant results.",
  toolsFunctions: [
    {
      id: "search", // This is the unique identifier of the tool function.
      toolFunction: tavilySearch, // This is the function that will be called when the tool function is executed.
      description: `Perform a web search using Tavily's API.
Returns search results including title, url, snippet, and optional image URL.
Display the image in the response, include the link or URL, it is handled in the frontend.
Include image URL in the response for generated images.
Do not use semi-colons when describing the image. Use html.
You should only return the function call in tools call sections.
        `, // This is the description of the tool function.
      parameters: [
        // These are the parameters of the tool function.
        {
          name: "query",
          description: "The query to search for.",
          required: true,
          schema: {
            type: "string"
          }
        }
      ]
    }
  ]
}
