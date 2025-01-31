export interface ChartDataset {
  label: string
  data: number[]
  borderColor?: string
  backgroundColor?: string
  fill?: boolean
}

export interface StockChartData {
  labels: string[]
  datasets: ChartDataset[]
}

export interface TechnicalIndicators {
  sma: number[]
  ema: number[]
  rsi: number[]
  macd: {
    macdLine: number[]
    signalLine: number[]
    histogram: number[]
  }
}

export interface StockQuote {
  symbol: string
  price: number
  change: number
  changePercent: number
  volume: number
  marketCap: number
  high: number
  low: number
}

export interface CompanyProfile {
  longName: string
  industry: string
  sector: string
  website: string
  description: string
}

export interface KeyMetrics {
  peRatio: number
  beta: number
  dividendYield: number
  profitMargin: number
}

export interface EnhancedStockData {
  quote: StockQuote
  companyProfile: CompanyProfile
  keyMetrics: KeyMetrics
  technicalIndicators: TechnicalIndicators
  chartData: StockChartData
}
