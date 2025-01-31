interface OptionsAnalysisPageProps {
  data: {
    stockData: {
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
      voiRatio: number | null
      impliedVolatility: number
    }>
    charts: {
      volume: {
        labels: string[]
        datasets: Array<{
          label: string
          data: number[]
          borderColor: string
          backgroundColor: string
          fill: boolean
        }>
      }
      voiRatio: {
        labels: string[]
        datasets: Array<{
          label: string
          data: number[]
          borderColor: string
          backgroundColor: string
          fill: boolean
        }>
      }
    }
  }
}

export const OptionsAnalysisPage: React.FC<OptionsAnalysisPageProps> = ({
  data
}) => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="mb-4 text-2xl font-bold">Options Analysis</h2>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {/* Options data rendering will go here */}
        <pre>{JSON.stringify(data, null, 2)}</pre>
      </div>
    </div>
  )
}
