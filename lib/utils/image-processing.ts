// Create a new utility file for image processing
export function createWhiteMask(
  imageDataUrl: string,
  width: number,
  height: number
): string {
  // Create a canvas with white background
  const canvas = new ArrayBuffer(width * height * 4) // 4 bytes per pixel (RGBA)
  const view = new Uint8Array(canvas)

  // Fill with white pixels (255, 255, 255, 255)
  for (let i = 0; i < view.length; i += 4) {
    view[i] = 255 // R
    view[i + 1] = 255 // G
    view[i + 2] = 255 // B
    view[i + 3] = 255 // A
  }

  // Convert to base64
  return `data:image/png;base64,${Buffer.from(canvas).toString("base64")}`
}
