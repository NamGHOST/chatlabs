import { PlatformTool, ToolFunction } from "@/types/platformTools"
import yahooFinance from "yahoo-finance2"

interface OptionContract {
  strike: number
  lastPrice: number
  bid: number
  ask: number
  volume: number
  openInterest: number
  impliedVolatility: number
  type: "call" | "put"
}

// Add rate limiting
let lastCallTime = 0
const MIN_CALL_INTERVAL = 1000 // 1 second
const MAX_RETRIES = 3

// Add a prompt to inform users about potential delays
const INITIALIZATION_PROMPT =
  "Initializing Yahoo Finance connection. This may take a few seconds..."

async function getYahooFinanceInstance() {
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      // Create a new instance and suppress notices
      const yf = yahooFinance
      // Suppress the survey notice
      yf.suppressNotices(["yahooSurvey"])

      // Add delay between retries to avoid rate limiting
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 2000))
      }

      // Force a new crumb by making a test query with more robust error handling
      try {
        await yf.quote("AAPL", {
          fields: ["symbol"]
        })
      } catch (queryError: unknown) {
        if (queryError instanceof Error) {
          console.warn(
            "Initial test query failed, but continuing:",
            queryError.message
          )
        }
        // Continue anyway as sometimes the test query fails but subsequent queries work
      }

      return yf
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred"
      console.error(
        `Yahoo Finance initialization attempt ${i + 1} failed:`,
        errorMessage
      )

      if (i === MAX_RETRIES - 1) {
        throw new Error(
          `Failed to initialize Yahoo Finance after ${MAX_RETRIES} attempts. Please try again later.`
        )
      }
    }
  }
  throw new Error("Failed to initialize Yahoo Finance")
}

interface YahooFinanceDay {
  date: Date
  open: number
  high: number
  low: number
  close: number
  volume: number
}

function formatOptionsResponse(
  options: any,
  params: { symbol: string; expirationDate?: string }
) {
  const callCount = options.options[0]?.calls?.length || 0
  const putCount = options.options[0]?.puts?.length || 0

  return {
    summary: `Found ${callCount} call options and ${putCount} put options for ${params.symbol}${params.expirationDate ? ` expiring on ${params.expirationDate}` : ""}`,
    expirationDates: options.expirationDates,
    calls:
      options.options[0]?.calls?.map((call: any) => ({
        strike: call.strike || 0,
        lastPrice: call.lastPrice || 0,
        bid: call.bid || 0,
        ask: call.ask || 0,
        volume: call.volume || 0,
        openInterest: call.openInterest || 0,
        impliedVolatility: call.impliedVolatility || 0
      })) || [],
    puts:
      options.options[0]?.puts?.map((put: any) => ({
        strike: put.strike || 0,
        lastPrice: put.lastPrice || 0,
        bid: put.bid || 0,
        ask: put.ask || 0,
        volume: put.volume || 0,
        openInterest: put.openInterest || 0,
        impliedVolatility: put.impliedVolatility || 0
      })) || []
  }
}

function formatStockResponse(
  quote: any,
  historicalData: any,
  params: { symbol: string; range?: string }
) {
  const priceChange = quote.regularMarketChange || 0
  const changePercent = quote.regularMarketChangePercent || 0
  const marketStatus =
    quote.marketState === "REGULAR"
      ? "during market hours"
      : "in after-hours trading"

  // Calculate some basic statistics if historical data is available
  let historicalStats = null
  if (historicalData && historicalData.close) {
    const prices = historicalData.close.filter(
      (p: number) => p !== null && !isNaN(p)
    )
    if (prices.length > 0) {
      const high = Math.max(...prices)
      const low = Math.min(...prices)
      const avg =
        prices.reduce((a: number, b: number) => a + b, 0) / prices.length

      historicalStats = {
        period: params.range || "N/A",
        highestPrice: high.toFixed(2),
        lowestPrice: low.toFixed(2),
        averagePrice: avg.toFixed(2),
        dataPoints: prices.length
      }
    }
  }

  return {
    summary: `${quote.symbol} is trading at $${quote.regularMarketPrice} ${marketStatus}, ${priceChange >= 0 ? "up" : "down"} $${Math.abs(priceChange).toFixed(2)} (${Math.abs(changePercent).toFixed(2)}%) with a volume of ${quote.regularMarketVolume?.toLocaleString()} shares.`,
    currentData: {
      price: quote.regularMarketPrice,
      change: {
        value: priceChange.toFixed(2),
        percentage: changePercent.toFixed(2) + "%"
      },
      volume: quote.regularMarketVolume?.toLocaleString(),
      marketCap: quote.marketCap
        ? `$${(quote.marketCap / 1e9).toFixed(2)}B`
        : "N/A",
      dayRange: `$${quote.regularMarketDayLow} - $${quote.regularMarketDayHigh}`
    },
    historicalStats
  }
}

const getStockData: ToolFunction = {
  id: "get_stock_data",
  description: "Get real-time and historical stock data for a given symbol",
  resultProcessingMode: "send_to_llm",
  parameters: [
    {
      name: "symbol",
      description: "Stock symbol (e.g., AAPL, MSFT)",
      required: true,
      schema: { type: "string" }
    },
    {
      name: "range",
      description:
        "Time range for historical data (1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max)",
      required: false,
      schema: { type: "string" }
    }
  ],
  async toolFunction(
    params:
      | { symbol: string; range?: string }
      | { parameters: { symbol: string; range?: string } }
  ) {
    try {
      // Handle nested parameters
      if ("parameters" in params) {
        params = params.parameters
      }

      console.log(INITIALIZATION_PROMPT)

      // Add symbol validation
      if (!params.symbol.match(/^[A-Za-z.]+$/)) {
        throw new Error(
          "Invalid stock symbol format. Only letters and dots are allowed."
        )
      }

      // Implement rate limiting
      const now = Date.now()
      if (now - lastCallTime < MIN_CALL_INTERVAL) {
        await new Promise(resolve =>
          setTimeout(resolve, MIN_CALL_INTERVAL - (now - lastCallTime))
        )
      }
      lastCallTime = Date.now()

      let yf
      for (let i = 0; i < MAX_RETRIES; i++) {
        try {
          yf = await getYahooFinanceInstance()
          const quote = await yf.quote(params.symbol)
          let historicalData = null

          if (params.range) {
            // Validate range parameter
            const validRanges = [
              "1d",
              "5d",
              "1mo",
              "3mo",
              "6mo",
              "1y",
              "2y",
              "5y",
              "10y",
              "ytd",
              "max"
            ]
            if (!validRanges.includes(params.range)) {
              throw new Error(
                `Invalid range parameter. Valid ranges are: ${validRanges.join(", ")}`
              )
            }

            historicalData = await yf.chart(params.symbol, {
              period1: new Date(
                Date.now() -
                  (params.range === "1d"
                    ? 24 * 60 * 60 * 1000
                    : 7 * 24 * 60 * 60 * 1000)
              ),
              period2: new Date(),
              interval: params.range === "1d" ? "5m" : "1d"
            })
          }

          // Enhanced result formatting with more context for LLM
          const formattedResponse = formatStockResponse(
            quote,
            historicalData,
            params
          )
          return formattedResponse
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error occurred"
          console.error(
            `Yahoo Finance retrieval attempt ${i + 1} failed:`,
            errorMessage
          )

          if (i === MAX_RETRIES - 1) {
            throw new Error(
              `Failed to retrieve data from Yahoo Finance after ${MAX_RETRIES} attempts. Please try again later.`
            )
          }
        }
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred"
      console.error("Error in getStockData:", errorMessage)

      throw new Error(
        `Failed to retrieve data from Yahoo Finance. Please try again later. Error: ${errorMessage}`
      )
    }
  }
}

const getOptionChain: ToolFunction = {
  id: "get_option_chain",
  description: "Get option chain data for a given symbol",
  resultProcessingMode: "send_to_llm",
  parameters: [
    {
      name: "symbol",
      description: "Stock symbol (e.g., AAPL, MSFT)",
      required: true,
      schema: { type: "string" }
    },
    {
      name: "expirationDate",
      description: "Option expiration date in YYYY-MM-DD format",
      required: false,
      schema: { type: "string" }
    }
  ],
  async toolFunction(
    params:
      | { symbol: string; expirationDate?: string }
      | { parameters: { symbol: string; expirationDate?: string } }
  ) {
    try {
      // Handle nested parameters
      if ("parameters" in params) {
        params = params.parameters
      }

      console.log(INITIALIZATION_PROMPT)

      // Add symbol validation
      if (!params.symbol.match(/^[A-Za-z.]+$/)) {
        throw new Error(
          "Invalid stock symbol format. Only letters and dots are allowed."
        )
      }

      // Validate expiration date if provided
      if (params.expirationDate) {
        const date = new Date(params.expirationDate)
        if (isNaN(date.getTime())) {
          throw new Error("Invalid expiration date format. Use YYYY-MM-DD")
        }
        if (date < new Date()) {
          throw new Error("Expiration date must be in the future")
        }
      }

      // Implement rate limiting
      const now = Date.now()
      if (now - lastCallTime < MIN_CALL_INTERVAL) {
        await new Promise(resolve =>
          setTimeout(resolve, MIN_CALL_INTERVAL - (now - lastCallTime))
        )
      }
      lastCallTime = Date.now()

      // Get a fresh instance with new authentication
      const yf = await getYahooFinanceInstance()
      const queryOptions: any = {
        formatted: true,
        lang: "en-US",
        region: "US"
      }

      if (params.expirationDate) {
        const date = new Date(params.expirationDate)
        // Set time to noon to avoid timezone issues
        date.setHours(12, 0, 0, 0)
        queryOptions.date = date
      }

      const options = await yf.options(params.symbol, queryOptions)
      return formatOptionsResponse(options, params)
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred"
      console.error("Error in getOptionChain:", errorMessage)

      throw new Error(`Failed to fetch option data: ${errorMessage}`)
    }
  }
}

export const yahooFinanceTool: PlatformTool = {
  id: "00000000-0000-4000-8000-000000000001",
  toolName: "yahooFinance",
  name: "Finance Data Provider",
  version: "1.0.0",
  description:
    "Tool for fetching real-time stock and options data. Provides stock quotes, historical data, and options chain information.",
  toolsFunctions: [getStockData, getOptionChain]
}
