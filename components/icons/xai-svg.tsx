import { FC } from "react"

interface XaiSVGProps {
  size?: number
  height?: number
  width?: number
  className?: string
}

export const XaiSVG: FC<XaiSVGProps> = ({
  size = 60, // Increased from 32 to 90 (2.8 times bigger)
  height = 40,
  width = 40,
  className
}) => {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 841.89 595.28"
      width={width}
      height={height}
    >
      <path d="m557.09 211.99 8.31 326.37h66.56l8.32-445.18zm83.19-155.08H538.72L379.35 284.53l50.78 72.52zM201.61 538.36h101.56l50.79-72.52-50.79-72.53zm0-326.37 228.52 326.37h101.56L303.17 211.99z" />
    </svg>
  )
}
