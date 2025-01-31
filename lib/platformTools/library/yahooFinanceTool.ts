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
      // Create a new instance and test connection with AAPL (used as test symbol only)
      // After successful connection, you can use any valid symbol in the actual queries
      const yf = yahooFinance
      await yf.quote("AAPL", {
        fields: ["regularMarketPrice"],
        return: "object"
      })
      return yf
    } catch (error) {
      console.error(`Attempt ${i + 1} failed:`, error)
      if (i === MAX_RETRIES - 1) {
        throw new Error(
          "Failed to initialize Yahoo Finance after multiple attempts"
        )
      }
      // Exponential backoff: wait longer between retries
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000))
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
      const symbol =
        "parameters" in params ? params.parameters.symbol : params.symbol
      const range =
        "parameters" in params ? params.parameters.range : params.range

      // Add symbol validation
      if (!symbol.match(/^[A-Za-z.]+$/)) {
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
      let stockQuote
      let historicalData = null

      for (let i = 0; i < MAX_RETRIES; i++) {
        try {
          yf = await getYahooFinanceInstance()
          stockQuote = await yf.quote(symbol)

          if (range) {
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
            if (!validRanges.includes(range)) {
              throw new Error(
                `Invalid range. Must be one of: ${validRanges.join(", ")}`
              )
            }

            const endDate = new Date()
            const startDate = new Date()
            switch (range) {
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

            historicalData = await yf.historical(symbol, {
              period1: startDate,
              period2: endDate,
              interval: "1d"
            })
          }

          // Enhanced result formatting with more context for LLM
          const priceChange = stockQuote.regularMarketChange || 0
          const changePercent = stockQuote.regularMarketChangePercent || 0
          const marketStatus =
            stockQuote.marketState === "REGULAR"
              ? "during market hours"
              : "in after-hours trading"

          return {
            quote: {
              symbol: stockQuote.symbol,
              price: stockQuote.regularMarketPrice,
              change: priceChange,
              changePercent: changePercent,
              volume: stockQuote.regularMarketVolume,
              marketCap: stockQuote.marketCap,
              high: stockQuote.regularMarketDayHigh,
              low: stockQuote.regularMarketDayLow,
              summary: `${stockQuote.symbol} is trading at $${stockQuote.regularMarketPrice} ${marketStatus}, ${priceChange >= 0 ? "up" : "down"} $${Math.abs(priceChange).toFixed(2)} (${Math.abs(changePercent).toFixed(2)}%) with a volume of ${stockQuote.regularMarketVolume?.toLocaleString()} shares.`
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

// Add new interfaces for technical analysis
interface ChartData {
  labels: string[]
  datasets: {
    label: string
    data: number[]
    borderColor?: string
    backgroundColor?: string
    fill?: boolean
  }[]
}

interface TechnicalIndicators {
  sma: number[]
  ema: number[]
  rsi: number[]
  macd: {
    macdLine: number[]
    signalLine: number[]
    histogram: number[]
  }
}

// Add technical analysis functions
function calculateSMA(data: number[], period: number): number[] {
  const sma: number[] = []
  for (let i = period - 1; i < data.length; i++) {
    const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0)
    sma.push(sum / period)
  }
  return sma
}

function calculateEMA(data: number[], period: number): number[] {
  const ema: number[] = []
  const multiplier = 2 / (period + 1)

  const firstSMA = data.slice(0, period).reduce((a, b) => a + b, 0) / period
  ema.push(firstSMA)

  for (let i = period; i < data.length; i++) {
    ema.push((data[i] - ema[ema.length - 1]) * multiplier + ema[ema.length - 1])
  }
  return ema
}

function calculateRSI(data: number[], period: number = 14): number[] {
  const rsi: number[] = []
  const gains: number[] = []
  const losses: number[] = []

  for (let i = 1; i < data.length; i++) {
    const change = data[i] - data[i - 1]
    gains.push(change > 0 ? change : 0)
    losses.push(change < 0 ? -change : 0)
  }

  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period

  rsi.push(100 - 100 / (1 + avgGain / avgLoss))

  for (let i = period; i < data.length - 1; i++) {
    avgGain = (avgGain * (period - 1) + gains[i]) / period
    avgLoss = (avgLoss * (period - 1) + losses[i]) / period
    rsi.push(100 - 100 / (1 + avgGain / avgLoss))
  }

  return rsi
}

function calculateMACD(data: number[]): {
  macdLine: number[]
  signalLine: number[]
  histogram: number[]
} {
  const ema12 = calculateEMA(data, 12)
  const ema26 = calculateEMA(data, 26)

  const macdLine = ema12.slice(-ema26.length).map((v, i) => v - ema26[i])
  const signalLine = calculateEMA(macdLine, 9)
  const histogram = macdLine
    .slice(-signalLine.length)
    .map((v, i) => v - signalLine[i])

  return { macdLine, signalLine, histogram }
}

const getEnhancedStockData: ToolFunction = {
  id: "get_enhanced_stock_data",
  description:
    "Get comprehensive stock data including technical indicators and chart data",
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
  async toolFunction(params: { symbol: string; range?: string }) {
    try {
      const yf = await getYahooFinanceInstance()

      // Get quote and historical data using existing logic
      const quote = await yf.quote(params.symbol)

      const endDate = new Date()
      const startDate = new Date()
      startDate.setMonth(
        startDate.getMonth() - (params.range === "1y" ? 12 : 1)
      )

      const historicalData = await yf.historical(params.symbol, {
        period1: startDate,
        period2: endDate,
        interval: "1d"
      })

      // Get company profile
      const quoteSummary = await yf.quoteSummary(params.symbol, {
        modules: [
          "assetProfile",
          "financialData",
          "defaultKeyStatistics",
          "price",
          "summaryDetail"
        ]
      })

      // Prepare data for technical analysis
      const closePrices = historicalData.map(
        (day: YahooFinanceDay) => day.close
      )
      const dates = historicalData.map(
        (day: YahooFinanceDay) => day.date.toISOString().split("T")[0]
      )

      // Calculate technical indicators
      const technicalIndicators: TechnicalIndicators = {
        sma: calculateSMA(closePrices, 20),
        ema: calculateEMA(closePrices, 20),
        rsi: calculateRSI(closePrices),
        macd: calculateMACD(closePrices)
      }

      // Prepare chart data
      const chartData: ChartData = {
        labels: dates,
        datasets: [
          {
            label: "Price",
            data: closePrices,
            borderColor: "#4CAF50",
            backgroundColor: "rgba(76, 175, 80, 0.1)",
            fill: true
          },
          {
            label: "SMA 20",
            data: [...Array(20).fill(null), ...technicalIndicators.sma],
            borderColor: "#2196F3"
          },
          {
            label: "EMA 20",
            data: [...Array(20).fill(null), ...technicalIndicators.ema],
            borderColor: "#FF9800"
          }
        ]
      }

      return {
        quote: {
          symbol: quote.symbol,
          price: quote.regularMarketPrice,
          change: quote.regularMarketChange,
          changePercent: quote.regularMarketChangePercent,
          volume: quote.regularMarketVolume,
          marketCap: quote.marketCap,
          high: quote.regularMarketDayHigh,
          low: quote.regularMarketDayLow
        },
        companyProfile: {
          longName: quoteSummary.price?.longName,
          industry: quoteSummary.assetProfile?.industry,
          sector: quoteSummary.assetProfile?.sector,
          website: quoteSummary.assetProfile?.website,
          description: quoteSummary.assetProfile?.longBusinessSummary
        },
        keyMetrics: {
          peRatio: quoteSummary.defaultKeyStatistics?.forwardPE,
          beta: quoteSummary.defaultKeyStatistics?.beta,
          dividendYield: quoteSummary.summaryDetail?.dividendYield,
          profitMargin: quoteSummary.financialData?.profitMargins
        },
        technicalIndicators,
        chartData
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to fetch enhanced stock data: ${error.message}`)
      }
      throw new Error(
        "Failed to fetch enhanced stock data: Unknown error occurred"
      )
    }
  }
}

const analyzeOptionsActivity: ToolFunction = {
  id: "analyze_options_activity",
  description:
    "Analyze unusual options activity for a given symbol and return visualization-ready data",
  resultProcessingMode: "send_to_llm",
  parameters: [
    {
      name: "symbol",
      description: "Stock symbol (e.g., AAPL, MSFT)",
      required: true,
      schema: { type: "string" }
    }
  ],
  async toolFunction(
    params: { symbol: string } | { parameters: { symbol: string } }
  ) {
    try {
      // Handle nested parameters
      const symbol =
        "parameters" in params ? params.parameters.symbol : params.symbol

      // Get stock data
      const stockData = await getStockData.toolFunction({ symbol })

      // Get options chain
      const optionsData = await getOptionChain.toolFunction({ symbol })

      // Calculate volume/OI ratios and find unusual activity
      const unusualActivity: any[] = []

      // Prepare data for volume chart
      const strikes = optionsData.calls.map((call: any) => call.strike)
      const callVolumes = optionsData.calls.map((call: any) => call.volume)
      const putVolumes = optionsData.puts.map((put: any) => put.volume)
      const callOI = optionsData.calls.map((call: any) => call.openInterest)
      const putOI = optionsData.puts.map((put: any) => put.openInterest)
      const callVOIRatios = optionsData.calls.map(
        (call: any) => call.volume / call.openInterest
      )
      const putVOIRatios = optionsData.puts.map(
        (put: any) => put.volume / put.openInterest
      )

      // Create chart data
      const volumeChartData: ChartData = {
        labels: strikes.map((strike: number) => strike.toString()),
        datasets: [
          {
            label: "Call Volume",
            data: callVolumes,
            borderColor: "#4CAF50",
            backgroundColor: "rgba(76, 175, 80, 0.1)",
            fill: true
          },
          {
            label: "Put Volume",
            data: putVolumes,
            borderColor: "#FF5252",
            backgroundColor: "rgba(255, 82, 82, 0.1)",
            fill: true
          }
        ]
      }

      const voiChartData: ChartData = {
        labels: strikes.map((strike: number) => strike.toString()),
        datasets: [
          {
            label: "Call V/OI Ratio",
            data: callVOIRatios,
            borderColor: "#2196F3",
            backgroundColor: "rgba(33, 150, 243, 0.1)",
            fill: true
          },
          {
            label: "Put V/OI Ratio",
            data: putVOIRatios,
            borderColor: "#FF9800",
            backgroundColor: "rgba(255, 152, 0, 0.1)",
            fill: true
          }
        ]
      }

      // Find unusual activity
      optionsData.calls.forEach((call: any, index: number) => {
        const voiRatio = callVOIRatios[index]
        if (voiRatio > 3) {
          unusualActivity.push({
            type: "call",
            strike: call.strike,
            volume: call.volume,
            openInterest: call.openInterest,
            voiRatio,
            impliedVolatility: call.impliedVolatility
          })
        }
      })

      optionsData.puts.forEach((put: any, index: number) => {
        const voiRatio = putVOIRatios[index]
        if (voiRatio > 3) {
          unusualActivity.push({
            type: "put",
            strike: put.strike,
            volume: put.volume,
            openInterest: put.openInterest,
            voiRatio,
            impliedVolatility: put.impliedVolatility
          })
        }
      })

      // Calculate summary metrics
      const totalCallVolume = callVolumes.reduce(
        (sum: number, vol: number) => sum + vol,
        0
      )
      const totalPutVolume = putVolumes.reduce(
        (sum: number, vol: number) => sum + vol,
        0
      )
      const putCallRatio = totalPutVolume / totalCallVolume

      return {
        stockData: stockData.quote,
        summary: {
          totalCallVolume,
          totalPutVolume,
          putCallRatio,
          unusualActivityCount: unusualActivity.length
        },
        unusualActivity,
        charts: {
          volume: volumeChartData,
          voiRatio: voiChartData
        },
        optionsData: {
          calls: optionsData.calls,
          puts: optionsData.puts
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to analyze options activity: ${error.message}`)
      }
      throw new Error(
        "Failed to analyze options activity: Unknown error occurred"
      )
    }
  }
}

export const yahooFinanceTool: PlatformTool = {
  id: "00000000-0000-4000-8000-000000000001",
  toolName: "yahooFinance",
  name: "Finance Data Provider",
  version: "1.0.0",
  description:
    "Tool for fetching real-time stock and options data. Provides stock quotes, historical data, options chain information, and options analysis.",
  toolsFunctions: [
    getStockData,
    getOptionChain,
    getEnhancedStockData,
    analyzeOptionsActivity
  ]
}
