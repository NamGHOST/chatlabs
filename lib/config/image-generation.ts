export const aspectRatios = [
  { value: "1:1", width: 512, height: 512 },
  { value: "4:3", width: 512, height: 384 },
  { value: "3:4", width: 384, height: 512 },
  { value: "16:9", width: 512, height: 288 },
  { value: "9:16", width: 288, height: 512 }
] as const

export const generators = {
  "flux-schnell": "flux1Pro__imageGenerationViaFlux1ProGenerator",
  "stable-diffusion":
    "stableDiffusion3__imageGenerationViaStableDiffusion3Generator",
  "dall-e": "imageGenerator__imageGenerationViaDallE3Generator"
} as const
