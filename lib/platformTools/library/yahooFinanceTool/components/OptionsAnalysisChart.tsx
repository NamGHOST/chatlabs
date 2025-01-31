"use client"

import React from "react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts"

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

interface OptionsAnalysisChartProps {
  volumeData: ChartData
  voiRatioData: ChartData
}

const transformDataForRecharts = (chartData: ChartData) => {
  return chartData.labels.map((label, index) => {
    const dataPoint: any = { strike: label }
    chartData.datasets.forEach(dataset => {
      dataPoint[dataset.label] = dataset.data[index]
    })
    return dataPoint
  })
}

export const OptionsAnalysisChart: React.FC<OptionsAnalysisChartProps> = ({
  volumeData,
  voiRatioData
}) => {
  const volumeChartData = transformDataForRecharts(volumeData)
  const voiRatioChartData = transformDataForRecharts(voiRatioData)

  return (
    <div className="space-y-8">
      <div className="h-[400px]">
        <h3 className="mb-4 text-lg font-semibold">
          Options Volume by Strike Price
        </h3>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={volumeChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="strike" />
            <YAxis />
            <Tooltip />
            <Legend />
            {volumeData.datasets.map((dataset, index) => (
              <Line
                key={dataset.label}
                type="monotone"
                dataKey={dataset.label}
                stroke={dataset.borderColor}
                fill={dataset.backgroundColor}
                dot={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="h-[400px]">
        <h3 className="mb-4 text-lg font-semibold">
          Volume/Open Interest Ratio by Strike Price
        </h3>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={voiRatioChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="strike" />
            <YAxis />
            <Tooltip />
            <Legend />
            {voiRatioData.datasets.map((dataset, index) => (
              <Line
                key={dataset.label}
                type="monotone"
                dataKey={dataset.label}
                stroke={dataset.borderColor}
                fill={dataset.backgroundColor}
                dot={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
