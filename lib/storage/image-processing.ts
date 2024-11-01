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
