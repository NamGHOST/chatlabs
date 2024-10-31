import { getGeneratedImageFromStorage } from "@/db/storage/generated-images"
import { supabase } from "@/lib/supabase/browser-client"
import { Json, Tables } from "@/supabase/types"

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
  storagePath?: string
}

export const saveImageToHistory = async (
  newImage: GeneratedImage,
  userId: string
) => {
  try {
    const { data, error } = await supabase
      .from("image_history")
      .insert([
        {
          user_id: userId,
          url: newImage.url,
          timestamp: newImage.timestamp,
          prompt: newImage.prompt,
          params: newImage.params as Json,
          storage_path: newImage.storagePath
        }
      ])
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error("Error saving image to history:", error)
    return null
  }
}

export const getImageHistory = async (
  userId: string
): Promise<GeneratedImage[]> => {
  try {
    const { data, error } = await supabase
      .from("image_history")
      .select("url, timestamp, prompt, params, storage_path")
      .eq("user_id", userId)
      .order("timestamp", { ascending: false })
      .limit(50)

    if (error) throw error

    return (data || []).map(record => ({
      url: record.url,
      timestamp: record.timestamp,
      prompt: record.prompt,
      params: record.params as GeneratedImage["params"],
      storagePath: record.storage_path || undefined
    }))
  } catch (error) {
    console.error("Error getting image history:", error)
    return []
  }
}

export const deleteImageFromHistory = async (
  image: GeneratedImage,
  userId: string
) => {
  try {
    // Delete from storage if needed
    if (image.storagePath) {
      const { error: storageError } = await supabase.storage
        .from("generated_images")
        .remove([image.storagePath])

      if (storageError) {
        console.error("Error deleting from storage:", storageError)
      }
    }

    // Delete from database
    const { error } = await supabase
      .from("image_history")
      .delete()
      .eq("user_id", userId)
      .eq("timestamp", image.timestamp)

    if (error) throw error
    return true
  } catch (error) {
    console.error("Error deleting image:", error)
    throw error
  }
}

export const getImageWithFallback = async (image: GeneratedImage) => {
  // Try storage path first if available
  if (image.storagePath) {
    try {
      const newUrl = await getGeneratedImageFromStorage(image.storagePath)
      if (newUrl) {
        console.log("Using storage URL:", newUrl)
        return newUrl
      }
    } catch (error) {
      console.error("Error getting image from storage:", error)
    }
  }

  // If storage fails and it's a Replicate URL, try the pbxt domain
  if (image.url.includes("replicate.delivery")) {
    try {
      const urlParts = image.url.split("replicate.delivery/")
      if (urlParts.length === 2) {
        const deliveryPath = urlParts[1]
        const directUrl = `https://pbxt.replicate.delivery/${deliveryPath}`

        const response = await fetch(directUrl, {
          method: "HEAD",
          cache: "no-store"
        })

        if (response.ok) {
          console.log("Using direct Replicate URL:", directUrl)
          return directUrl
        }
      }
    } catch (error) {
      console.error("Error accessing direct Replicate URL:", error)
    }
  }

  // Return original URL as last resort
  return image.url
}
