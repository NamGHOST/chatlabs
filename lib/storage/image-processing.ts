import { supabase } from "@/lib/supabase/browser-client"

export const handleReplicateImage = async (imageUrl: string) => {
  try {
    const response = await fetch(imageUrl)
    const blob = await response.blob()

    // For downloading
    const arrayBuffer = await blob.arrayBuffer()
    // Or for creating a local URL
    const objectUrl = URL.createObjectURL(blob)

    return { blob, arrayBuffer, objectUrl }
  } catch (error) {
    console.error("Error processing image:", error)
    throw error
  }
}

export const uploadMaskToStorage = async (
  maskDataUrl: string,
  userId: string
): Promise<string> => {
  try {
    // List existing masks for this user
    const { data: existingMasks } = await supabase.storage
      .from("generated_images")
      .list(`${userId}/masks`)

    // Delete all existing masks for this user
    if (existingMasks && existingMasks.length > 0) {
      const maskPaths = existingMasks.map(
        mask => `${userId}/masks/${mask.name}`
      )
      await supabase.storage.from("generated_images").remove(maskPaths)
    }

    // Generate random filename with timestamp and random string
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const maskPath = `${userId}/masks/mask_${timestamp}_${randomString}.png`

    // Upload new mask
    const response = await fetch(maskDataUrl)
    const blob = await response.blob()

    const { data, error } = await supabase.storage
      .from("generated_images")
      .upload(maskPath, blob, {
        contentType: "image/png",
        upsert: true
      })

    if (error) throw error

    // Get public URL
    const {
      data: { publicUrl }
    } = supabase.storage.from("generated_images").getPublicUrl(maskPath)

    return publicUrl
  } catch (error) {
    console.error("Error handling mask storage:", error)
    throw error
  }
}
