"use client"

import React from "react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
  TooltipProps
} from "recharts"
import type { ChartDataset } from "../types"

interface StockChartProps {
  data: StockChartData
  title: string
  description?: string
  type?: "line" | "area" | "bar"
  height?: number
  width?: number
}

interface CustomTooltipProps extends TooltipProps<any, any> {
  active?: boolean
  payload?: Array<{
    name: string
    value: number
    color: string
  }>
  label?: string
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2
  }).format(value)
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString()
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length && label) {
    return (
      <div className="bg-background rounded-lg border p-4 shadow-lg">
        <p className="font-bold">{formatDate(label)}</p>
        {payload.map(entry => (
          <div key={entry.name} className="flex justify-between gap-4">
            <span style={{ color: entry.color }}>{entry.name}:</span>
            <span className="font-mono">{formatCurrency(entry.value)}</span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

interface StockChartData {
  labels: string[]
  datasets: ChartDataset[]
}

export function StockChart({
  data,
  title,
  description,
  type = "line",
  height = 400,
  width = 800
}: StockChartProps) {
  // Transform data for Recharts format
  const chartData = data.labels.map((label: string, index: number) => {
    const point: Record<string, string | number> = { date: label }
    data.datasets.forEach((dataset: ChartDataset) => {
      point[dataset.label] = dataset.data[index]
    })
    return point
  })

  const renderChart = () => {
    switch (type) {
      case "area":
        return (
          <AreaChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 60, bottom: 30 }}
            width={width}
            height={height}
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              tick={{ fontSize: 12 }}
            />
            <YAxis
              tickFormatter={formatCurrency}
              tick={{ fontSize: 12 }}
              width={60}
            />
            <Tooltip content={<CustomTooltip />} />
            {data.datasets.map((dataset: ChartDataset) => (
              <Area
                key={dataset.label}
                type="monotone"
                dataKey={dataset.label}
                stroke={dataset.borderColor}
                fill={dataset.backgroundColor}
                fillOpacity={0.3}
                dot={false}
              />
            ))}
          </AreaChart>
        )
      case "bar":
        return (
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 60, bottom: 30 }}
            width={width}
            height={height}
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              tick={{ fontSize: 12 }}
            />
            <YAxis
              tickFormatter={formatCurrency}
              tick={{ fontSize: 12 }}
              width={60}
            />
            <Tooltip content={<CustomTooltip />} />
            {data.datasets.map((dataset: ChartDataset) => (
              <Bar
                key={dataset.label}
                dataKey={dataset.label}
                fill={dataset.backgroundColor || dataset.borderColor}
              />
            ))}
          </BarChart>
        )
      default:
        return (
          <LineChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 60, bottom: 30 }}
            width={width}
            height={height}
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              tick={{ fontSize: 12 }}
            />
            <YAxis
              tickFormatter={formatCurrency}
              tick={{ fontSize: 12 }}
              width={60}
            />
            <Tooltip content={<CustomTooltip />} />
            {data.datasets.map((dataset: ChartDataset) => (
              <Line
                key={dataset.label}
                type="monotone"
                dataKey={dataset.label}
                stroke={dataset.borderColor}
                dot={false}
              />
            ))}
          </LineChart>
        )
    }
  }

  return (
    <div className="w-full">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        {description && (
          <p className="text-muted-foreground text-sm">{description}</p>
        )}
      </div>
      <div className="h-[400px] w-full">{renderChart()}</div>
    </div>
  )
}
