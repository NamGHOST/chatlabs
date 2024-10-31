import { getGeneratedImageFromStorage } from "@/db/storage/generated-images"
import { supabase } from "@/lib/supabase/browser-client"

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
    if (!newImage.url) {
      throw new Error("Image URL is required")
    }

    // Special handling for Replicate URLs
    if (newImage.url.includes("replicate.delivery")) {
      const urlParts = newImage.url.split("replicate.delivery/")
      if (urlParts.length === 2) {
        const deliveryPath = urlParts[1]
        const directUrl = `https://pbxt.replicate.delivery/${deliveryPath}`

        // Get the image data from the direct URL
        const response = await fetch(directUrl)
        if (!response.ok)
          throw new Error("Failed to fetch image from Replicate")
        const blob = await response.blob()

        // Continue with storage upload...
        const fileExtension = blob.type.includes("webp") ? "webp" : "png"
        const filename = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`

        // Upload to Supabase storage with retries
        let uploadAttempts = 0
        const maxAttempts = 3

        while (uploadAttempts < maxAttempts) {
          try {
            const { data: uploadData, error: uploadError } =
              await supabase.storage
                .from("generated_images")
                .upload(filename, blob, {
                  cacheControl: "3600",
                  upsert: false
                })

            if (uploadError) throw uploadError

            // Get a signed URL for the uploaded image
            const { data: urlData, error: urlError } = await supabase.storage
              .from("generated_images")
              .createSignedUrl(filename, 60 * 60 * 24) // 24 hour expiry

            if (urlError) throw urlError

            // Update the image URL to use the Supabase URL
            const imageWithStorageUrl = {
              ...newImage,
              url: urlData.signedUrl,
              storagePath: filename
            }

            // Insert into database
            const { data, error } = await supabase
              .from("image_history")
              .insert([
                {
                  user_id: userId,
                  url: imageWithStorageUrl.url,
                  timestamp: imageWithStorageUrl.timestamp,
                  prompt: imageWithStorageUrl.prompt,
                  params: imageWithStorageUrl.params,
                  storage_path: imageWithStorageUrl.storagePath
                }
              ])
              .select("*")
              .single()

            if (error) {
              console.error("Error inserting image:", error)
              throw error
            }
            return data
          } catch (error) {
            uploadAttempts++
            if (uploadAttempts === maxAttempts) throw error
            await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1 second before retry
          }
        }
      }
    }

    // If we get here, save the original image directly to database
    const { data, error } = await supabase
      .from("image_history")
      .insert([
        {
          user_id: userId,
          url: newImage.url,
          timestamp: newImage.timestamp,
          prompt: newImage.prompt,
          params: newImage.params,
          storage_path: newImage.storagePath
        }
      ])
      .select("*")
      .single()

    if (error) {
      console.error("Error inserting image:", error)
      throw error
    }
    return data
  } catch (error) {
    console.error("Error saving image to history:", error)
    return newImage
  }
}

interface ImageHistoryRecord {
  id: string
  user_id: string
  url: string
  timestamp: number
  prompt: string
  params: {
    aspectRatio: string
    style: string
    guidanceScale: number
    steps: number
  }
  storage_path?: string
}

export const getImageHistory = async (
  userId: string
): Promise<GeneratedImage[]> => {
  try {
    const { data, error } = await supabase
      .from("image_history")
      .select("*")
      .eq("user_id", userId)
      .order("timestamp", { ascending: false })
      .limit(50)

    if (error) throw error

    return (data as ImageHistoryRecord[]).map(record => ({
      url: record.url,
      timestamp: record.timestamp,
      prompt: record.prompt,
      params: record.params,
      storagePath: record.storage_path
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
