export type RecraftStyle =
  | "any"
  | "realistic_image"
  | "digital_illustration"
  | "digital_illustration/pixel_art"
  | "digital_illustration/hand_drawn"
  | "digital_illustration/grain"
  | "digital_illustration/infantile_sketch"
  | "digital_illustration/2d_art_poster"
  | "digital_illustration/handmade_3d"
  | "digital_illustration/hand_drawn_outline"
  | "digital_illustration/engraving_color"
  | "digital_illustration/2d_art_poster_2"
  | "realistic_image/b_and_w"
  | "realistic_image/hard_flash"
  | "realistic_image/hdr"
  | "realistic_image/natural_light"
  | "realistic_image/studio_portrait"
  | "realistic_image/enterprise"
  | "realistic_image/motion_blur"

export interface ImageGenerationParams {
  prompt: string
  negativePrompt?: string
  aspectRatio: string
  style: string
  recraftStyle?: string
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
