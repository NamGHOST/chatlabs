import React from "react"
import { Tooltip, TooltipProps } from "recharts"

interface ChartTooltipProps extends Omit<TooltipProps<any, any>, "content"> {
  content: React.ReactNode | ((props: any) => React.ReactNode)
}

export function ChartTooltip({ content, ...props }: ChartTooltipProps) {
  return (
    <Tooltip
      content={content as any}
      cursor={{ fill: "rgba(0, 0, 0, 0.1)" }}
      wrapperStyle={{ outline: "none" }}
      {...props}
    />
  )
}
