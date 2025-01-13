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
  async toolFunction(params: { symbol: string; range?: string }) {
    try {
      const quote = await yahooFinance.quote(params.symbol)
      let historicalData = null

      if (params.range) {
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

        historicalData = await yahooFinance.historical(params.symbol, {
          period1: startDate,
          period2: endDate,
          interval: "1d"
        })
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
        historicalData: historicalData
      }
    } catch (error) {
      throw new Error(`Failed to fetch stock data: ${error}`)
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
  async toolFunction(params: { symbol: string; expirationDate?: string }) {
    try {
      const options = await yahooFinance.options(params.symbol, {
        date: params.expirationDate
          ? new Date(params.expirationDate)
          : undefined,
        formatted: true
      })

      return {
        expirationDates: options.expirationDates,
        calls: options.options[0].calls.map(call => ({
          strike: call.strike,
          lastPrice: call.lastPrice,
          bid: call.bid,
          ask: call.ask,
          volume: call.volume,
          openInterest: call.openInterest,
          impliedVolatility: call.impliedVolatility
        })),
        puts: options.options[0].puts.map(put => ({
          strike: put.strike,
          lastPrice: put.lastPrice,
          bid: put.bid,
          ask: put.ask,
          volume: put.volume,
          openInterest: put.openInterest,
          impliedVolatility: put.impliedVolatility
        }))
      }
    } catch (error) {
      throw new Error(`Failed to fetch option data: ${error}`)
    }
  }
}

export const yahooFinanceTool: PlatformTool = {
  id: "yahoo_finance",
  toolName: "Yahoo Finance",
  name: "Yahoo Finance Data Provider",
  version: "1.0.0",
  description:
    "Tool for fetching real-time stock and options data from Yahoo Finance",
  toolsFunctions: [getStockData, getOptionChain]
}
