import React, { useEffect, useState } from "react"
import { OptionsAnalysisChart } from "./OptionsAnalysisChart"
import { yahooFinanceTool } from "../../yahooFinanceTool"

interface OptionsAnalysisData {
  stockData: {
    symbol: string
    regularMarketPrice: number
    regularMarketVolume: number
    marketCap: number
    regularMarketChangePercent: number
  }
  summary: {
    totalCallVolume: number
    totalPutVolume: number
    putCallRatio: number
    unusualActivityCount: number
  }
  unusualActivity: Array<{
    type: "call" | "put"
    strike: number
    volume: number
    openInterest: number
    voiRatio: number
    impliedVolatility: number
  }>
  charts: {
    volume: any
    voiRatio: any
  }
}

export function NVDAOptionsAnalysisPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<OptionsAnalysisData | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const analyzeOptionsActivity = yahooFinanceTool.toolsFunctions.find(
          f => f.id === "analyze_options_activity"
        )

        if (!analyzeOptionsActivity) {
          throw new Error("Options analysis tool not found")
        }

        const result = await analyzeOptionsActivity.toolFunction({
          symbol: "NVDA"
        })
        setData(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return <div className="p-4">Loading options analysis...</div>
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>
  }

  if (!data) {
    return <div className="p-4">No data available</div>
  }

  const formatNumber = (num: number) =>
    new Intl.NumberFormat("en-US").format(num)
  const formatPercent = (num: number) => `${num.toFixed(2)}%`
  const formatCurrency = (num: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD"
    }).format(num)

  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="mb-8">
        <h1 className="mb-4 text-3xl font-bold">NVDA Options Analysis</h1>

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg bg-white p-4 shadow">
            <h3 className="text-sm font-medium text-gray-500">Current Price</h3>
            <p className="text-2xl font-semibold">
              {formatCurrency(data.stockData.regularMarketPrice)}
            </p>
            <p className="text-sm text-gray-500">
              {formatPercent(data.stockData.regularMarketChangePercent)} today
            </p>
          </div>

          <div className="rounded-lg bg-white p-4 shadow">
            <h3 className="text-sm font-medium text-gray-500">Volume</h3>
            <p className="text-2xl font-semibold">
              {formatNumber(data.stockData.regularMarketVolume)}
            </p>
          </div>

          <div className="rounded-lg bg-white p-4 shadow">
            <h3 className="text-sm font-medium text-gray-500">Market Cap</h3>
            <p className="text-2xl font-semibold">
              {formatCurrency(data.stockData.marketCap)}
            </p>
          </div>

          <div className="rounded-lg bg-white p-4 shadow">
            <h3 className="text-sm font-medium text-gray-500">
              Put/Call Ratio
            </h3>
            <p className="text-2xl font-semibold">
              {data.summary.putCallRatio.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="mb-8 rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold">Options Summary</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <h3 className="text-sm font-medium text-gray-500">
                Total Call Volume
              </h3>
              <p className="text-lg font-semibold">
                {formatNumber(data.summary.totalCallVolume)}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">
                Total Put Volume
              </h3>
              <p className="text-lg font-semibold">
                {formatNumber(data.summary.totalPutVolume)}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">
                Unusual Activity
              </h3>
              <p className="text-lg font-semibold">
                {data.summary.unusualActivityCount} contracts
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <OptionsAnalysisChart
            volumeData={data.charts.volume}
            voiRatioData={data.charts.voiRatio}
          />
        </div>

        {data.unusualActivity.length > 0 && (
          <div className="mt-8 rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold">Unusual Activity</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 text-left">Type</th>
                    <th className="py-2 text-left">Strike</th>
                    <th className="py-2 text-left">Volume</th>
                    <th className="py-2 text-left">Open Interest</th>
                    <th className="py-2 text-left">V/OI Ratio</th>
                    <th className="py-2 text-left">IV</th>
                  </tr>
                </thead>
                <tbody>
                  {data.unusualActivity.map((activity, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-2">{activity.type.toUpperCase()}</td>
                      <td className="py-2">
                        {formatCurrency(activity.strike)}
                      </td>
                      <td className="py-2">{formatNumber(activity.volume)}</td>
                      <td className="py-2">
                        {formatNumber(activity.openInterest)}
                      </td>
                      <td className="py-2">{activity.voiRatio.toFixed(2)}</td>
                      <td className="py-2">
                        {formatPercent(activity.impliedVolatility * 100)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
