import Replicate from "replicate"
import {
  ImageGenerationUserSettings,
  BaseImageGenerator
} from "../common/BaseImageGenerator"

class Flux1ProGenerator extends BaseImageGenerator {
  constructor() {
    super(
      "FLUX 1.1 Pro",
      "b3f07a6e-5e01-423e-1f05-ee51830608da",
      "flux1Pro",
      "Generate images using FLUX 1.1 Pro based on a text description."
    )
  }

  protected async getApiKey(): Promise<string | undefined> {
    return process.env.REPLICATE_API_TOKEN
  }

  protected async generateImage(
    prompt: string,
    width: number,
    height: number,
    userSettings: ImageGenerationUserSettings
  ): Promise<string> {
    const input = {
      prompt: prompt,
      aspect_ratio: width === height ? "1:1" : width > height ? "16:9" : "9:16",
      output_format: "webp",
      output_quality: 80,
      safety_tolerance: 2,
      prompt_upsampling: true
    }

    const replicate = new Replicate({
      auth: await this.getApiKey()
    })

    const result = await replicate.run("black-forest-labs/flux-1.1-pro", {
      input
    })

    if (typeof result === "object" && result !== null) {
      if ("output" in result) {
        return result.output as string
      }
      if (Array.isArray(result) && result.length > 0) {
        return result[0] as string
      }
    }

    throw new Error("Invalid response from Replicate API")
  }
}

export const flux1ProTools = new Flux1ProGenerator().createPlatformTool()
