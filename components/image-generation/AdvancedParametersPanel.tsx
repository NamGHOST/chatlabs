// components/image-generation/AdvancedParametersPanel.tsx
import React from "react"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"

const aspectRatios = [
  { value: "1:1", width: 512, height: 512 },
  { value: "4:3", width: 512, height: 384 },
  { value: "3:4", width: 384, height: 512 },
  { value: "16:9", width: 512, height: 288 },
  { value: "9:16", width: 288, height: 512 }
]

interface AdvancedParametersPanelProps {
  params: {
    prompt: string
    magicPrompt: string
    negativePrompt: string
    aspectRatio: string
    steps: number
    guidanceScale: number
    seed: number
    samplerName: string
    batchSize: number
    batchCount: number
    clipSkip: number
    tiling: boolean
  }
  onParamChange: (name: string, value: string | number | boolean) => void
  onSubmit: (e: React.FormEvent) => void
}

const AdvancedParametersPanel: React.FC<AdvancedParametersPanelProps> = ({
  params,
  onParamChange,
  onSubmit
}) => {
  const handleMagicPrompt = () => {
    const translatedPrompt = `translated: ${params.magicPrompt}`
    onParamChange(
      "prompt",
      params.prompt ? `${params.prompt}, ${translatedPrompt}` : translatedPrompt
    )
    onParamChange("magicPrompt", "")
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <h2 className="mb-6 text-2xl font-bold text-white">Advanced Settings</h2>

      <div className="space-y-2">
        <Label htmlFor="negativePrompt">Negative Prompt</Label>
        <Textarea
          id="negativePrompt"
          placeholder="Enter things to avoid in the image"
          value={params.negativePrompt}
          onChange={e => onParamChange("negativePrompt", e.target.value)}
          className="min-h-[100px] resize-none border-gray-600 bg-gray-700 text-white"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="steps">Steps ({params.steps})</Label>
        <Slider
          id="steps"
          min={1}
          max={150}
          step={1}
          value={[params.steps]}
          onValueChange={value => onParamChange("steps", value[0])}
          className="bg-gray-700"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="seed">Seed</Label>
        <Input
          id="seed"
          type="number"
          value={params.seed}
          onChange={e => onParamChange("seed", parseInt(e.target.value))}
          min={-1}
          placeholder="-1 for random"
          className="border-gray-600 bg-gray-700 text-white"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="samplerName">Sampler</Label>
        <Select
          value={params.samplerName}
          onValueChange={value => onParamChange("samplerName", value)}
        >
          <SelectTrigger
            id="samplerName"
            className="border-gray-600 bg-gray-700 text-white"
          >
            <SelectValue placeholder="Select a sampler" />
          </SelectTrigger>
          <SelectContent className="border-gray-600 bg-gray-700">
            {[
              "Euler a",
              "Euler",
              "DDIM",
              "DPM++ 2M Karras",
              "DPM++ SDE Karras"
            ].map(sampler => (
              <SelectItem key={sampler} value={sampler} className="text-white">
                {sampler}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="batchSize">Batch Size</Label>
          <Input
            id="batchSize"
            type="number"
            value={params.batchSize}
            onChange={e => onParamChange("batchSize", parseInt(e.target.value))}
            min={1}
            max={4}
            className="border-gray-600 bg-gray-700 text-white"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="batchCount">Batch Count</Label>
          <Input
            id="batchCount"
            type="number"
            value={params.batchCount}
            onChange={e =>
              onParamChange("batchCount", parseInt(e.target.value))
            }
            min={1}
            max={10}
            className="border-gray-600 bg-gray-700 text-white"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="clipSkip">CLIP Skip</Label>
        <Input
          id="clipSkip"
          type="number"
          value={params.clipSkip}
          onChange={e => onParamChange("clipSkip", parseInt(e.target.value))}
          min={1}
          max={12}
          className="border-gray-600 bg-gray-700 text-white"
        />
      </div>

      <div className="flex items-center space-x-2">
        <input
          id="tiling"
          type="checkbox"
          checked={params.tiling}
          onChange={e => onParamChange("tiling", e.target.checked)}
          className="form-checkbox size-5 rounded border-gray-600 bg-gray-700 text-blue-600"
        />
        <Label htmlFor="tiling">Tiling</Label>
      </div>

      <Button
        type="submit"
        className="w-full bg-blue-600 text-white hover:bg-blue-700"
      >
        Generate Image
      </Button>
    </form>
  )
}

export default AdvancedParametersPanel
