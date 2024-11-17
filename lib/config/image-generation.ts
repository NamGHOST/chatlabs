export const aspectRatios = [
  { value: "1:1", width: 1024, height: 1024 },
  { value: "4:3", width: 1365, height: 1024 },
  { value: "3:4", width: 1024, height: 1365 },
  { value: "16:9", width: 1820, height: 1024 },
  { value: "9:16", width: 1024, height: 1820 }
] as const

export const generators = {
  "flux-schnell": "flux1Pro__imageGenerationViaFlux1ProGenerator",
  "stable-diffusion":
    "stableDiffusion3__imageGenerationViaStableDiffusion3Generator",
  "dall-e": "imageGenerator__imageGenerationViaDallE3Generator"
} as const
