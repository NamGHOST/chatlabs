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

// Define the chart data interface locally
interface ChartData {
  chartType: "line" | "area" | "bar"
  config: {
    title: string
    description: string
    xAxisKey: string
    trend?: {
      percentage: number
      direction: "up" | "down"
    }
  }
  data: Array<Record<string, any>>
  chartConfig: Record<
    string,
    {
      label: string
      color?: string
    }
  >
}

interface YahooFinanceChartData {
  labels: string[]
  datasets: {
    label: string
    data: number[]
    borderColor?: string
    backgroundColor?: string
    fill?: boolean
  }[]
}

interface StockPriceChartProps {
  chartData: YahooFinanceChartData
  quote: {
    symbol: string
    change: number
    changePercent: number
  }
}

const transformToChartData = (
  yahooData: YahooFinanceChartData,
  quote: StockPriceChartProps["quote"]
): ChartData => {
  // Transform the data into the format expected by the chart
  const transformedData = yahooData.labels.map((date, index) => ({
    date,
    price: yahooData.datasets[0].data[index],
    ...(yahooData.datasets[1]?.data[index] && {
      sma: yahooData.datasets[1].data[index]
    }),
    ...(yahooData.datasets[2]?.data[index] && {
      ema: yahooData.datasets[2].data[index]
    })
  }))

  return {
    chartType: "line",
    config: {
      title: `${quote.symbol} Stock Price`,
      description: `Price movement (${quote.changePercent > 0 ? "↑" : "↓"}${Math.abs(quote.changePercent).toFixed(2)}%)`,
      xAxisKey: "date",
      trend: {
        percentage: Math.abs(quote.changePercent),
        direction: quote.changePercent > 0 ? "up" : "down"
      }
    },
    data: transformedData,
    chartConfig: {
      price: {
        label: "Price",
        color: "#4CAF50"
      },
      ...(yahooData.datasets[1]?.data.some(d => d !== null) && {
        sma: {
          label: "SMA 20",
          color: "#2196F3"
        }
      }),
      ...(yahooData.datasets[2]?.data.some(d => d !== null) && {
        ema: {
          label: "EMA 20",
          color: "#FF9800"
        }
      })
    }
  }
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2
  }).format(value)
}

const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString()
}

export const StockPriceChart: React.FC<StockPriceChartProps> = ({
  chartData,
  quote
}) => {
  const transformedData = transformToChartData(chartData, quote)
  const { config, data, chartConfig } = transformedData

  return (
    <div className="size-full">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">{config.title}</h3>
        <p className="text-muted-foreground text-sm">{config.description}</p>
      </div>
      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
            <XAxis
              dataKey={config.xAxisKey}
              tickFormatter={formatDate}
              tick={{ fontSize: 12 }}
            />
            <YAxis
              tickFormatter={formatCurrency}
              tick={{ fontSize: 12 }}
              width={80}
            />
            <Tooltip
              formatter={(value: number) => [formatCurrency(value)]}
              labelFormatter={formatDate}
            />
            <Legend />
            {Object.entries(chartConfig).map(([key, config]) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={config.color}
                name={config.label}
                dot={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
