"use client"

import React from "react"
import { OptionsAnalysisChart } from "./OptionsAnalysisChart"

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

interface OptionsAnalysisProps {
  charts: {
    volume: ChartData
    voiRatio: ChartData
  }
}

export function OptionsAnalysis({ charts }: OptionsAnalysisProps) {
  return (
    <div>
      <OptionsAnalysisChart
        volumeData={charts.volume}
        voiRatioData={charts.voiRatio}
      />
    </div>
  )
}
