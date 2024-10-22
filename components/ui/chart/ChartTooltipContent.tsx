import React from "react"

interface ChartTooltipContentProps {
  labelFormatter?: (label: string) => string
  formatter?: (value: number) => string
  hideLabel?: boolean
}

export function ChartTooltipContent({
  labelFormatter,
  formatter,
  hideLabel
}: ChartTooltipContentProps) {
  return function TooltipContent({ active, payload, label }: any) {
    if (active && payload && payload.length) {
      return (
        <div className="rounded border border-gray-200 bg-white p-2 shadow">
          {!hideLabel && (
            <p className="text-sm font-semibold">
              {labelFormatter ? labelFormatter(label) : label}
            </p>
          )}
          {payload.map((entry: any, index: number) => (
            <div key={`item-${index}`} className="flex items-center space-x-1">
              <div
                style={{ backgroundColor: entry.color }}
                className="size-2 rounded-full"
              ></div>
              <span className="text-sm">
                {entry.name}: {formatter ? formatter(entry.value) : entry.value}
              </span>
            </div>
          ))}
        </div>
      )
    }

    return null
  }
}
