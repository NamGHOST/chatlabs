import React, { forwardRef, useCallback, useState } from "react"
import { ReactSketchCanvas, ReactSketchCanvasRef } from "react-sketch-canvas"
import { cn } from "@/lib/utils"
import { Button } from "./button"
import { Eraser } from "lucide-react"

interface CanvasProps {
  imageUrl: string
  className?: string
  onMaskChange?: (maskDataUrl: string) => void
  onMaskSave?: () => void
}

export const Canvas = forwardRef<ReactSketchCanvasRef, CanvasProps>(
  ({ imageUrl, className, onMaskChange, onMaskSave }, ref) => {
    const [dimensions, setDimensions] = React.useState({ width: 0, height: 0 })
    const [currentMaskData, setCurrentMaskData] = useState<string>("")
    const containerRef = React.useRef<HTMLDivElement>(null)

    // Load and get original image dimensions
    React.useEffect(() => {
      setCurrentMaskData("")

      const img = new Image()
      img.onload = () => {
        const newDimensions = {
          width: img.naturalWidth,
          height: img.naturalHeight
        }
        console.log("Source image dimensions:", newDimensions)
        setDimensions(newDimensions)

        if (ref && "current" in ref && ref.current) {
          ref.current.clearCanvas()
          ref.current.loadPaths([])
        }
      }
      img.src = imageUrl
      onMaskChange?.("")
    }, [imageUrl, ref, onMaskChange])

    // Add handleChange function back
    const handleChange = useCallback(() => {
      // We don't need to do anything here since we're generating
      // the mask only when saving
      console.log("Canvas updated")
    }, [])

    const generateMask = useCallback(async () => {
      if (!ref || !("current" in ref) || !ref.current) return null
      const paths = await ref.current.exportPaths()

      if (
        paths.length &&
        containerRef.current &&
        dimensions.width &&
        dimensions.height
      ) {
        try {
          const canvas = document.createElement("canvas")
          canvas.width = dimensions.width
          canvas.height = dimensions.height

          const ctx = canvas.getContext("2d", {
            willReadFrequently: true,
            alpha: true
          })
          if (!ctx) return null

          // Fill with black (areas to preserve)
          ctx.fillStyle = "black"
          ctx.fillRect(0, 0, canvas.width, canvas.height)

          // Calculate scale factors using container dimensions
          const scaleX = dimensions.width / containerRef.current.offsetWidth
          const scaleY = dimensions.height / containerRef.current.offsetHeight

          // Set up drawing with scaled stroke width
          ctx.fillStyle = "white"
          ctx.strokeStyle = "white"
          ctx.lineWidth = 30 * Math.max(scaleX, scaleY)
          ctx.lineCap = "round"
          ctx.lineJoin = "round"
          ctx.shadowColor = "white"
          ctx.shadowBlur = 15

          // Draw paths with proper scaling
          paths.forEach(path => {
            ctx.beginPath()
            const points = path.paths
            if (points.length > 0) {
              ctx.moveTo(points[0].x * scaleX, points[0].y * scaleY)
              for (let i = 1; i < points.length - 1; i++) {
                const xc = (points[i].x + points[i + 1].x) * 0.5 * scaleX
                const yc = (points[i].y + points[i + 1].y) * 0.5 * scaleY
                ctx.quadraticCurveTo(
                  points[i].x * scaleX,
                  points[i].y * scaleY,
                  xc,
                  yc
                )
              }
              if (points.length > 1) {
                const last = points[points.length - 1]
                ctx.lineTo(last.x * scaleX, last.y * scaleY)
              }
            }
            ctx.stroke()
            ctx.fill()
          })

          const maskData = canvas.toDataURL("image/png", 1.0)
          console.log(
            `Generated mask dimensions: ${canvas.width}x${canvas.height}`
          )
          return maskData
        } catch (error) {
          console.error("Error creating mask:", error)
          return null
        }
      }
      return null
    }, [dimensions])

    const handleClear = useCallback(
      (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()

        if (ref && "current" in ref && ref.current) {
          ref.current.clearCanvas()
          onMaskChange?.("")
        }
      },
      [onMaskChange]
    )

    const handleSave = useCallback(async () => {
      const maskData = await generateMask()
      if (maskData) {
        onMaskChange?.(maskData)
        onMaskSave?.()
      }
    }, [generateMask, onMaskChange, onMaskSave])

    return (
      <div className="space-y-2">
        <div
          ref={containerRef}
          className={cn("relative w-full overflow-hidden bg-white", className)}
          style={{ aspectRatio: dimensions.width / dimensions.height }}
        >
          <img
            src={imageUrl}
            alt="canvas background"
            className="absolute inset-0 z-10 size-full object-contain"
            key={imageUrl}
          />
          <div className="absolute inset-0 z-20" style={{ opacity: 0.5 }}>
            <ReactSketchCanvas
              ref={ref}
              width={`${dimensions.width}px`}
              height={`${dimensions.height}px`}
              strokeWidth={30}
              strokeColor="black"
              canvasColor="transparent"
              exportWithBackgroundImage={false}
              onChange={handleChange}
              preserveBackgroundImageAspectRatio="xMidYMid meet"
              style={{
                width: "100%",
                height: "100%"
              }}
            />
          </div>
        </div>
        <div className="flex justify-end space-x-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleClear}
            type="button"
          >
            <Eraser className="mr-2 size-4" />
            Clear Mask
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleSave}
            type="button"
          >
            Save Mask
          </Button>
        </div>
      </div>
    )
  }
)

Canvas.displayName = "Canvas"
