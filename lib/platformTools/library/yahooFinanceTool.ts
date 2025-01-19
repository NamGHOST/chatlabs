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

async function getYahooFinanceInstance() {
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      // Create a new instance and force a fresh authentication
      const yf = yahooFinance
      // Force a new crumb by making a test query
      await yf.quote("AAPL", { fields: ["symbol"] })
      return yf
    } catch (error) {
      if (i === MAX_RETRIES - 1) {
        throw new Error(
          "Failed to initialize Yahoo Finance after multiple attempts"
        )
      }
      // Wait longer between retries (2 seconds)
      await new Promise(resolve => setTimeout(resolve, 2000))
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
                `Invalid range. Must be one of: ${validRanges.join(", ")}`
              )
            }

            const endDate = new Date()
            const startDate = new Date()
            switch (params.range) {
              case "1d":
                startDate.setDate(startDate.getDate() - 1)
                break
              case "5d":
                startDate.setDate(startDate.getDate() - 5)
                break
              case "1mo":
                startDate.setMonth(startDate.getMonth() - 1)
                break
              case "3mo":
                startDate.setMonth(startDate.getMonth() - 3)
                break
              case "6mo":
                startDate.setMonth(startDate.getMonth() - 6)
                break
              case "1y":
                startDate.setFullYear(startDate.getFullYear() - 1)
                break
              default:
                startDate.setMonth(startDate.getMonth() - 1) // default to 1mo
            }

            historicalData = await yf.historical(params.symbol, {
              period1: startDate,
              period2: endDate,
              interval: "1d"
            })
          }

          // Enhanced result formatting with more context for LLM
          const priceChange = quote.regularMarketChange || 0
          const changePercent = quote.regularMarketChangePercent || 0
          const marketStatus =
            quote.marketState === "REGULAR"
              ? "during market hours"
              : "in after-hours trading"

          return {
            quote: {
              symbol: quote.symbol,
              price: quote.regularMarketPrice,
              change: priceChange,
              changePercent: changePercent,
              volume: quote.regularMarketVolume,
              marketCap: quote.marketCap,
              high: quote.regularMarketDayHigh,
              low: quote.regularMarketDayLow,
              summary: `${quote.symbol} is trading at $${quote.regularMarketPrice} ${marketStatus}, ${priceChange >= 0 ? "up" : "down"} $${Math.abs(priceChange).toFixed(2)} (${Math.abs(changePercent).toFixed(2)}%) with a volume of ${quote.regularMarketVolume?.toLocaleString()} shares.`
            },
            historicalData: historicalData?.map((day: YahooFinanceDay) => ({
              date: day.date,
              open: day.open,
              high: day.high,
              low: day.low,
              close: day.close,
              volume: day.volume
            }))
          }
        } catch (error) {
          if (i === MAX_RETRIES - 1) {
            throw error
          }
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to fetch stock data: ${error.message}`)
      }
      throw new Error("Failed to fetch stock data: Unknown error occurred")
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
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to fetch option data: ${error.message}`)
      }
      throw new Error("Failed to fetch option data: Unknown error occurred")
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
