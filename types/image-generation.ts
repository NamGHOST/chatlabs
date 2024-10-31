export interface ImageGenerationParams {
  prompt: string
  negativePrompt?: string
  aspectRatio: string
  style: string
  guidanceScale?: number
  steps?: number
  seed?: number
  samplerName?: string
  batchSize?: number
  batchCount?: number
  clipSkip?: number
  tiling?: boolean
}

export interface ImageGenerationResponse {
  imageUrl: string
}

export interface GeneratedImage {
  url: string
  timestamp: number
  prompt: string
  params: {
    aspectRatio: string
    style: string
    guidanceScale: number
    steps: number
  }
}
