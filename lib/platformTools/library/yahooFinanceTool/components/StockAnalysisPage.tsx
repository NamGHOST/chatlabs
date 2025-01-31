import React, { useEffect, useState } from "react"
import { StockPriceChart } from "./StockPriceChart"

interface StockData {
  quote: {
    symbol: string
    price: number
    change: number
    changePercent: number
    volume: number
    marketCap: number
    high: number
    low: number
  }
  companyProfile?: {
    longName: string
    industry: string
    sector: string
    website: string
    description: string
  }
  keyMetrics?: {
    peRatio: number
    beta: number
    dividendYield: number
    profitMargin: number
  }
  chartData?: {
    labels: string[]
    datasets: {
      label: string
      data: number[]
      borderColor?: string
      backgroundColor?: string
      fill?: boolean
    }[]
  }
}

interface StockAnalysisPageProps {
  data: {
    quote: {
      symbol: string
      price: number
      change: number
      changePercent: number
      volume: number
      marketCap: number
      high: number
      low: number
      summary: string
    }
    chartData?: any
  }
}

export const StockAnalysisPage: React.FC<StockAnalysisPageProps> = ({
  data
}) => {
  const [stockData, setStockData] = useState<StockData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const response = await fetch(
          `/api/finance/stock?symbol=${data.quote.symbol}`
        )
        if (!response.ok) {
          throw new Error("Failed to fetch stock data")
        }
        const stockData = await response.json()
        setStockData(stockData)
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [data.quote.symbol])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        Loading...
      </div>
    )
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>
  }

  if (!stockData) {
    return <div>No data available</div>
  }

  const formatNumber = (num: number) => {
    if (num >= 1e12) return (num / 1e12).toFixed(2) + "T"
    if (num >= 1e9) return (num / 1e9).toFixed(2) + "B"
    if (num >= 1e6) return (num / 1e6).toFixed(2) + "M"
    return num.toLocaleString()
  }

  const formatPercentage = (num: number) => {
    return (num * 100).toFixed(2) + "%"
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {/* Stock Overview */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-2xl font-bold">Stock Overview</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-600">Symbol</p>
              <p className="text-xl font-semibold">{data.quote.symbol}</p>
            </div>
            <div>
              <p className="text-gray-600">Price</p>
              <p className="text-xl font-semibold">
                ${data.quote.price.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Change</p>
              <p
                className={`text-xl font-semibold ${data.quote.change >= 0 ? "text-green-500" : "text-red-500"}`}
              >
                {data.quote.change >= 0 ? "+" : ""}
                {data.quote.change.toFixed(2)} (
                {data.quote.changePercent.toFixed(2)}%)
              </p>
            </div>
            <div>
              <p className="text-gray-600">Volume</p>
              <p className="text-xl font-semibold">
                {formatNumber(data.quote.volume)}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Market Cap</p>
              <p className="text-xl font-semibold">
                {formatNumber(data.quote.marketCap)}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Day Range</p>
              <p className="text-xl font-semibold">
                ${data.quote.low.toFixed(2)} - ${data.quote.high.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        {stockData.keyMetrics && (
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-2xl font-bold">Key Metrics</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-600">P/E Ratio</p>
                <p className="text-xl font-semibold">
                  {stockData.keyMetrics.peRatio.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Beta</p>
                <p className="text-xl font-semibold">
                  {stockData.keyMetrics.beta.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Dividend Yield</p>
                <p className="text-xl font-semibold">
                  {formatPercentage(stockData.keyMetrics.dividendYield)}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Profit Margin</p>
                <p className="text-xl font-semibold">
                  {formatPercentage(stockData.keyMetrics.profitMargin)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Price Chart */}
      {stockData.chartData && (
        <div className="mt-8 rounded-lg bg-white p-6 shadow">
          <StockPriceChart chartData={stockData.chartData} quote={data.quote} />
        </div>
      )}

      {/* Company Profile */}
      {stockData.companyProfile && (
        <div className="mt-8 rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-2xl font-bold">Company Profile</h2>
          <div className="space-y-4">
            <div>
              <p className="text-gray-600">Name</p>
              <p className="text-xl font-semibold">
                {stockData.companyProfile.longName}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Industry</p>
              <p className="text-xl">{stockData.companyProfile.industry}</p>
            </div>
            <div>
              <p className="text-gray-600">Sector</p>
              <p className="text-xl">{stockData.companyProfile.sector}</p>
            </div>
            <div>
              <p className="text-gray-600">Website</p>
              <a
                href={stockData.companyProfile.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-700"
              >
                {stockData.companyProfile.website}
              </a>
            </div>
            <div>
              <p className="text-gray-600">Description</p>
              <p className="mt-2 text-gray-800">
                {stockData.companyProfile.description}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
