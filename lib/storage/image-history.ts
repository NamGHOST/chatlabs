import { getGeneratedImageFromStorage } from "@/db/storage/generated-images"
import { supabase } from "@/lib/supabase/browser-client"
import { Json, Tables } from "@/supabase/types"
import { handleReplicateImage } from "@/lib/storage/image-processing"
import { uploadGeneratedImage } from "@/db/storage/generated-images"
import {
  IMAGE_MODEL_TIERS,
  ImageModelId
} from "@/lib/subscription/image-limits"

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
    // Download and process the Replicate image
    const { blob } = await handleReplicateImage(newImage.url)

    // Create a unique storage path
    const storagePath = `${userId}/${Date.now()}.webp`

    // Convert blob to File
    const imageFile = new File([blob], "image.webp", { type: "image/webp" })

    // Upload to Supabase storage
    const path = await uploadGeneratedImage(storagePath, imageFile)

    // Get the model tier from the style
    const modelTier = IMAGE_MODEL_TIERS[newImage.params.style as ImageModelId]

    // Save record to database with storage path and model_tier
    const cleanUrl = newImage.url.replace(/[\[\]"]/g, "").trim()
    const { data, error } = await supabase
      .from("image_history")
      .insert([
        {
          user_id: userId,
          url: cleanUrl,
          timestamp: newImage.timestamp,
          prompt: newImage.prompt,
          params: newImage.params as Json,
          storage_path: path,
          model_tier: modelTier
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
  userId: string,
  page: number = 0,
  pageSize: number = 50
): Promise<{ data: GeneratedImage[]; hasMore: boolean }> => {
  try {
    // Get total count first
    const { count } = await supabase
      .from("image_history")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)

    // Fetch paginated data
    const { data, error } = await supabase
      .from("image_history")
      .select("url, timestamp, prompt, params, storage_path")
      .eq("user_id", userId)
      .order("timestamp", { ascending: false })
      .range(page * pageSize, (page + 1) * pageSize - 1)

    if (error) throw error

    const processedData = await Promise.all(
      (data || []).map(async record => {
        let imageUrl = record.url

        if (record.storage_path) {
          try {
            const signedUrl = await getGeneratedImageFromStorage(
              record.storage_path
            )
            if (signedUrl) {
              imageUrl = signedUrl
            }
          } catch (error) {
            console.error("Error getting signed URL:", error)
          }
        }

        return {
          url: imageUrl,
          timestamp: record.timestamp,
          prompt: record.prompt,
          params: record.params as GeneratedImage["params"],
          storagePath: record.storage_path || undefined
        }
      })
    )

    return {
      data: processedData,
      hasMore: count ? (page + 1) * pageSize < count : false
    }
  } catch (error) {
    console.error("Error getting image history:", error)
    return { data: [], hasMore: false }
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
  if (image.storagePath) {
    try {
      const newUrl = await getGeneratedImageFromStorage(image.storagePath)
      if (newUrl) {
        return newUrl
      }
    } catch (error) {
      console.error("Error getting image from storage:", error)
    }
  }

  // For Replicate URLs, extract the direct image URL
  if (image.url.includes("replicate.delivery")) {
    const cleanUrl = image.url.replace(/[\[\]"]/g, "").trim()
    if (typeof cleanUrl === "string") {
      return cleanUrl
    }
  }

  // Return original URL as last resort
  return image.url
}

export const getImageGenerationCount = async (
  userId: string,
  modelTier: string,
  userPlan: string
): Promise<number> => {
  try {
    const startDate = new Date()
    if (userPlan === "free") {
      // For free users, check daily limit
      startDate.setHours(0, 0, 0, 0)
    } else {
      // For paid users, check monthly limit
      startDate.setDate(1)
      startDate.setHours(0, 0, 0, 0)
    }

    const { count } = await supabase
      .from("image_history")
      .select("*", { count: "exact" })
      .eq("user_id", userId)
      .gte("timestamp", startDate.getTime())
      .eq("model_tier", modelTier)

    return count || 0
  } catch (error) {
    console.error("Error getting image generation count:", error)
    return 0
  }
}
