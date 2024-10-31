"use client"

import { useState, useEffect } from "react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Textarea } from "../ui/textarea"
import { Slider } from "../ui/slider"
import { Label } from "../ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "../ui/select"
import { Checkbox } from "../ui/checkbox"
import { Card } from "../ui/card"
import { Loader2 } from "lucide-react"
import { generateImage } from "./image-api"
import { toast } from "sonner"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from "../ui/collapsible"
import { ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { aspectRatios } from "@/lib/config/image-generation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import {
  saveImageToHistory,
  getImageHistory,
  GeneratedImage,
  deleteImageFromHistory
} from "@/lib/storage/image-history"
import { Badge } from "../ui/badge"
import {
  IconMaximize,
  IconDownload,
  IconX,
  IconTrash
} from "@tabler/icons-react"
import {
  Dialog,
  DialogContent,
  DialogClose,
  DialogTitle,
  DialogHeader,
  DialogFooter,
  DialogDescription
} from "../ui/dialog"
import { Brand } from "../ui/brand"
import { createClient } from "@supabase/supabase-js"
import { getGeneratedImageFromStorage } from "@/db/storage/generated-images"
import { getImageWithFallback } from "@/lib/storage/image-history"
import { PLAN_FREE } from "@/lib/subscription"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export const SD3_MODELS = {
  "sd3.5-large": "SD 3.5 Large (Best Quality)",
  "sd3.5-large-turbo": "SD 3.5 Large Turbo (Faster)",
  "sd3.5-medium": "SD 3.5 Medium (Balanced)",
  "sd3-large": "SD 3 Large (Legacy)",
  "sd3-large-turbo": "SD 3 Large Turbo (Legacy)",
  "sd3-medium": "SD 3 Medium (Legacy)"
} as const

interface TextToImageGeneratorProps {
  user: {
    id: string
    plan?: string
  }
}

const TextToImageGenerator: React.FC<TextToImageGeneratorProps> = ({
  user
}) => {
  const [params, setParams] = useState({
    prompt: "",
    magicPrompt: "",
    negativePrompt: "",
    aspectRatio: "1:1",
    steps: 4,
    guidanceScale: 7.5,
    seed: -1,
    samplerName: "Euler a",
    batchSize: 1,
    batchCount: 1,
    clipSkip: 1,
    tiling: false
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([])
  const [selectedStyle, setSelectedStyle] = useState("dall-e")
  const [isFormCollapsed, setIsFormCollapsed] = useState(false)
  const [isTranslating, setIsTranslating] = useState(false)
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(
    null
  )
  const [showImagePreview, setShowImagePreview] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [imageToDelete, setImageToDelete] = useState<GeneratedImage | null>(
    null
  )
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isHistoryLoading, setIsHistoryLoading] = useState(true)

  // Load history on mount
  useEffect(() => {
    const loadHistory = async () => {
      setIsHistoryLoading(true)
      try {
        const history = await getImageHistory(user.id)
        setGeneratedImages(history)
      } catch (error) {
        console.error("Error loading image history:", error)
        toast.error("Failed to load image history")
      } finally {
        setIsHistoryLoading(false)
      }
    }

    loadHistory()
  }, [user.id])

  useEffect(() => {
    // Simulate loading time for styles to be applied
    const timer = setTimeout(() => setIsLoading(false), 100)
    return () => clearTimeout(timer)
  }, [])

  const handleChange = (name: string, value: string | number | boolean) => {
    setParams(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Check if the user is on a free plan
    const userPlan = user.plan || PLAN_FREE
    if (userPlan === PLAN_FREE) {
      toast.error(
        "Image generation is not available on the free plan. Please upgrade to continue."
      )
      return
    }

    setIsGenerating(true)

    try {
      const imageUrl = await generateImage({
        prompt: params.prompt,
        negativePrompt: params.negativePrompt,
        aspectRatio: params.aspectRatio,
        style: selectedStyle,
        guidanceScale: params.guidanceScale,
        steps: params.steps,
        seed: params.seed,
        samplerName: params.samplerName,
        batchSize: params.batchSize,
        batchCount: params.batchCount,
        clipSkip: params.clipSkip,
        tiling: params.tiling
      })

      const newImage: GeneratedImage = {
        url: imageUrl,
        timestamp: Date.now(),
        prompt: params.prompt,
        params: {
          aspectRatio: params.aspectRatio,
          style: selectedStyle,
          guidanceScale: params.guidanceScale,
          steps: params.steps
        }
      }

      saveImageToHistory(newImage, user.id)
      setGeneratedImages(prev => [newImage, ...prev])
      toast.success("Image generated successfully!")
    } catch (error: any) {
      console.error("Failed to generate image:", error)
      toast.error(error.message || "Failed to generate image")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleMagicPrompt = async () => {
    if (!params.magicPrompt.trim()) return

    setIsTranslating(true)
    try {
      const response = await fetch("/api/translate-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: params.magicPrompt })
      })

      if (!response.ok) {
        throw new Error("Translation failed")
      }

      const { enhancedPrompt } = await response.json()

      setParams(prev => ({
        ...prev,
        prompt: prev.prompt
          ? `${prev.prompt}\n${enhancedPrompt}`
          : enhancedPrompt,
        magicPrompt: "" // Clear the magic prompt input
      }))

      toast.success("Prompt enhanced and added!")
    } catch (error) {
      console.error("Error translating prompt:", error)
      toast.error("Failed to enhance prompt")
    } finally {
      setIsTranslating(false)
    }
  }

  const downloadImage = async (imageUrl: string, timestamp: number) => {
    if (isDownloading) return
    setIsDownloading(true)

    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const blobUrl = window.URL.createObjectURL(blob)

      const link = document.createElement("a")
      link.href = blobUrl
      link.download = `generated-image-${timestamp}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      window.URL.revokeObjectURL(blobUrl)
      toast.success("Image downloaded successfully")
    } catch (error) {
      console.error("Error downloading image:", error)
      toast.error("Failed to download image")
    } finally {
      setIsDownloading(false)
    }
  }

  const handleDeleteImage = (image: GeneratedImage) => {
    setImageToDelete(image)
    setShowDeleteDialog(true)
  }

  const confirmDelete = async () => {
    if (!imageToDelete) return

    setIsDeleting(true)
    try {
      await deleteImageFromHistory(imageToDelete, user.id)

      setGeneratedImages(prevImages =>
        prevImages.filter(img => img.timestamp !== imageToDelete.timestamp)
      )

      setShowDeleteDialog(false)
      setImageToDelete(null)
      toast.success("Image deleted successfully")
    } catch (error) {
      console.error("Error deleting image:", error)
      toast.error("Failed to delete image. Please try again.")
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center">
        <Loader2 className="size-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="bg-background min-h-screen">
      {/* Brand Header */}
      <div className="py-8">
        <Brand />
      </div>

      {/* Existing Content */}
      <div className="p-4 md:p-6 lg:p-8">
        <div className="mx-auto grid max-w-[2000px] grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 lg:gap-8 xl:grid-cols-[minmax(400px,600px)_1fr]">
          {/* Form Section - Adaptive width */}
          <div className="w-full md:col-span-1">
            <form
              onSubmit={handleSubmit}
              className="space-y-4 md:sticky md:top-6 md:space-y-6"
            >
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold md:text-3xl">
                  Text to Image Generator
                </h1>
                {/* Optional: Collapsible form on mobile */}
                <Button
                  variant="ghost"
                  className="md:hidden"
                  onClick={() => setIsFormCollapsed(!isFormCollapsed)}
                >
                  {isFormCollapsed ? <ChevronDown /> : <ChevronUp />}
                </Button>
              </div>

              <div
                className={cn(
                  "space-y-4",
                  isFormCollapsed && "hidden md:block"
                )}
              >
                {/* Main Prompts Section */}
                <Card className="p-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="prompt">Prompt</Label>
                      <Textarea
                        id="prompt"
                        placeholder="Describe your image. Get creative..."
                        value={params.prompt}
                        onChange={e => handleChange("prompt", e.target.value)}
                        className="min-h-[100px] resize-y"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="magicPrompt">Magic Prompt</Label>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <Input
                          id="magicPrompt"
                          placeholder="Enter simple or foreign language text"
                          value={params.magicPrompt}
                          onChange={e =>
                            handleChange("magicPrompt", e.target.value)
                          }
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          className="shrink-0"
                          onClick={handleMagicPrompt}
                          disabled={isTranslating || !params.magicPrompt.trim()}
                        >
                          {isTranslating ? (
                            <>
                              <Loader2 className="mr-2 size-4 animate-spin" />
                              Translating...
                            </>
                          ) : (
                            "Translate & Add"
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="negativePrompt">Negative Prompt</Label>
                      <Textarea
                        id="negativePrompt"
                        placeholder="Enter things to avoid in the image"
                        value={params.negativePrompt}
                        onChange={e =>
                          handleChange("negativePrompt", e.target.value)
                        }
                      />
                    </div>
                  </div>
                </Card>

                {/* Model & Aspect Ratio Section */}
                <Card className="p-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="style">Model</Label>
                      <Select
                        value={selectedStyle}
                        onValueChange={value => setSelectedStyle(value)}
                      >
                        <SelectTrigger id="style">
                          <SelectValue placeholder="Select model" />
                        </SelectTrigger>
                        <SelectContent>
                          {/*<SelectItem value="dall-e">DALL-E 3</SelectItem>*/}
                          {/*<SelectItem value="stable-diffusion">Stable Diffusion 3</SelectItem>*/}
                          <SelectItem value="flux-schnell">
                            FLUX Schnell
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="aspectRatio">Aspect Ratio</Label>
                      <Select
                        value={params.aspectRatio}
                        onValueChange={value =>
                          handleChange("aspectRatio", value)
                        }
                      >
                        <SelectTrigger id="aspectRatio">
                          <SelectValue placeholder="Select aspect ratio" />
                        </SelectTrigger>
                        <SelectContent>
                          {aspectRatios.map(ratio => (
                            <SelectItem key={ratio.value} value={ratio.value}>
                              {ratio.value} ({ratio.width}x{ratio.height})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </Card>

                {/* Advanced Settings Section */}
                <Collapsible>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="w-full justify-between">
                      Advanced Settings
                      <ChevronDown className="size-4" />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <Card className="mt-2 p-4">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="steps">Steps ({params.steps})</Label>
                          <Slider
                            id="steps"
                            min={1}
                            max={10}
                            step={1}
                            value={[params.steps]}
                            onValueChange={value =>
                              handleChange("steps", value[0])
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="guidanceScale">
                            Guidance Scale ({params.guidanceScale})
                          </Label>
                          <Slider
                            id="guidanceScale"
                            min={1}
                            max={20}
                            step={0.1}
                            value={[params.guidanceScale]}
                            onValueChange={value =>
                              handleChange("guidanceScale", value[0])
                            }
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="batchSize">Batch Size</Label>
                            <Input
                              id="batchSize"
                              type="number"
                              value={params.batchSize}
                              onChange={e =>
                                handleChange(
                                  "batchSize",
                                  parseInt(e.target.value)
                                )
                              }
                              min={1}
                              max={4}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="batchCount">Batch Count</Label>
                            <Input
                              id="batchCount"
                              type="number"
                              value={params.batchCount}
                              onChange={e =>
                                handleChange(
                                  "batchCount",
                                  parseInt(e.target.value)
                                )
                              }
                              min={1}
                              max={10}
                            />
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="tiling"
                            checked={params.tiling}
                            onCheckedChange={checked =>
                              handleChange("tiling", Boolean(checked))
                            }
                          />
                          <Label htmlFor="tiling">Tiling</Label>
                        </div>
                      </div>
                    </Card>
                  </CollapsibleContent>
                </Collapsible>

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    "Generate Image"
                  )}
                </Button>
              </div>
            </form>
          </div>

          {/* Generated Images Section */}
          <div className="space-y-4 md:col-span-1 md:space-y-6 xl:col-span-1">
            <h2 className="text-xl font-bold md:text-2xl">Generated Images</h2>

            <div className="grid gap-4 md:gap-6">
              {isHistoryLoading ? (
                <Card className="p-6 text-center">
                  <Loader2 className="mx-auto size-4 animate-spin" />
                  <p className="text-muted-foreground mt-2">
                    Loading history...
                  </p>
                </Card>
              ) : generatedImages.length === 0 ? (
                <Card className="text-muted-foreground p-6 text-center">
                  <p>
                    No images generated yet. Start by entering a prompt above!
                  </p>
                </Card>
              ) : (
                generatedImages.map(image => (
                  <Card key={image.timestamp} className="overflow-hidden">
                    {/* Image Container with proper aspect ratio handling */}
                    <div className="relative w-full">
                      <div className="relative aspect-[3/4] overflow-hidden md:aspect-[4/3] lg:aspect-[16/9]">
                        <img
                          src={image.url}
                          alt={`Generated image: ${image.prompt.slice(0, 30)}...`}
                          className="absolute inset-0 size-full bg-black/5 object-contain"
                        />
                      </div>

                      {/* Image Info Overlay */}
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                        <p className="line-clamp-2 text-sm text-white">
                          {image.prompt}
                        </p>
                      </div>
                    </div>

                    {/* Image Details and Actions */}
                    <div className="bg-card space-y-3 p-4">
                      <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs">
                        <span>
                          {new Date(image.timestamp).toLocaleString()}
                        </span>
                        <span>•</span>
                        <Badge variant="secondary">{image.params.style}</Badge>
                        <Badge variant="secondary">
                          {image.params.aspectRatio}
                        </Badge>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="flex-1"
                          onClick={() => {
                            setSelectedImage(image)
                            setShowImagePreview(true)
                          }}
                        >
                          <IconMaximize className="mr-2 size-4" />
                          View Full Size
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="flex-1"
                          disabled={isDownloading}
                          onClick={() =>
                            downloadImage(image.url, image.timestamp)
                          }
                        >
                          {isDownloading ? (
                            <>
                              <Loader2 className="mr-2 size-4 animate-spin" />
                              Downloading...
                            </>
                          ) : (
                            <>
                              <IconDownload className="mr-2 size-4" />
                              Download
                            </>
                          )}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteImage(image)}
                        >
                          <IconTrash className="size-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>

            {/* Full Size Image Preview Modal */}
            {selectedImage && (
              <Dialog
                open={showImagePreview}
                onOpenChange={setShowImagePreview}
              >
                <DialogContent className="max-h-[90vh] max-w-[90vw] p-0">
                  <DialogHeader>
                    <DialogTitle>Image Preview</DialogTitle>
                    <DialogDescription className="sr-only">
                      Preview of generated image with prompt:{" "}
                      {selectedImage.prompt}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="relative size-full">
                    <img
                      src={selectedImage.url}
                      alt={selectedImage.prompt}
                      className="size-full object-contain"
                      onError={async e => {
                        const imgElement = e.currentTarget
                        if (!imgElement) return

                        try {
                          // For Replicate URLs, try to use the URL directly without modifications
                          if (
                            selectedImage.url.includes("replicate.delivery")
                          ) {
                            // Try fetching the image directly first
                            const response = await fetch(selectedImage.url)
                            if (response.ok) {
                              // If direct fetch works, keep using the original URL
                              imgElement.src = selectedImage.url
                              return
                            }
                          }

                          // If direct fetch fails or it's not a Replicate URL, try storage path
                          if (selectedImage.storagePath) {
                            const newUrl = await getGeneratedImageFromStorage(
                              selectedImage.storagePath
                            )
                            if (newUrl) {
                              imgElement.src = newUrl
                              return
                            }
                          }

                          // Show placeholder if all attempts fail
                          const parent = imgElement.parentElement
                          if (parent) {
                            const fallbackDiv = document.createElement("div")
                            fallbackDiv.className =
                              "w-full h-full bg-muted rounded-md flex items-center justify-center"
                            fallbackDiv.innerHTML =
                              '<span class="text-sm text-muted-foreground">Image unavailable</span>'
                            parent.replaceChild(fallbackDiv, imgElement)
                          }
                        } catch (error) {
                          console.error("Error handling image:", error)
                        }
                      }}
                    />
                    <DialogClose className="absolute right-2 top-2">
                      <Button variant="ghost" size="icon">
                        <IconX className="size-4" />
                      </Button>
                    </DialogClose>
                  </div>
                  <div className="bg-background p-4">
                    <p className="text-sm">{selectedImage.prompt}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                          downloadImage(
                            selectedImage.url,
                            selectedImage.timestamp
                          )
                        }
                      >
                        <IconDownload className="mr-2 size-4" />
                        Download
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </div>

      {/* Timeline Drawer */}
      <div className="fixed inset-x-0 bottom-0">
        <div
          className={cn(
            "bg-background/80 relative border-t backdrop-blur-sm transition-transform duration-300",
            isDrawerOpen ? "translate-y-0" : "translate-y-[calc(100%-8rem)]"
          )}
        >
          {/* Center Pull Button */}
          <Button
            variant="secondary"
            className="absolute -top-5 left-1/2 size-10 -translate-x-1/2 rounded-full shadow-lg"
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
          >
            <ChevronUp
              className={cn(
                "size-4 transition-transform",
                isDrawerOpen && "rotate-180"
              )}
            />
          </Button>

          <div className="mx-auto max-w-[2000px] p-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Recent Generations</h3>

              {/* Image Timeline - with fixed height for single row when closed */}
              <div className="relative">
                <div
                  className={cn(
                    "transition-all duration-300",
                    isDrawerOpen
                      ? "grid grid-cols-2 gap-4 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8"
                      : "flex h-24 gap-4 overflow-x-auto pb-2"
                  )}
                >
                  {generatedImages.map(image => (
                    <div
                      key={image.timestamp}
                      className={cn(
                        "relative cursor-pointer",
                        isDrawerOpen ? "size-24" : "size-24 shrink-0"
                      )}
                      onClick={() => {
                        setSelectedImage(image)
                        setShowImagePreview(true)
                      }}
                    >
                      <div className="relative size-full">
                        <img
                          src={image.url}
                          alt={image.prompt}
                          className="size-full rounded-md object-cover"
                          onError={async e => {
                            const imgElement = e.currentTarget
                            if (!imgElement) return

                            try {
                              const newUrl = await getImageWithFallback(image)
                              if (newUrl !== image.url) {
                                console.log("Switching to new URL:", newUrl)
                                imgElement.src = newUrl
                                return
                              }

                              // Only show placeholder if we've tried both URLs
                              const parent = imgElement.parentElement
                              if (parent) {
                                console.log(
                                  "Showing placeholder for:",
                                  image.url
                                )
                                const fallbackDiv =
                                  document.createElement("div")
                                fallbackDiv.className =
                                  "w-full h-full bg-muted rounded-md flex items-center justify-center"
                                fallbackDiv.innerHTML =
                                  '<span class="text-xs text-muted-foreground">Preview unavailable</span>'
                                parent.replaceChild(fallbackDiv, imgElement)
                              }
                            } catch (error) {
                              console.error("Error handling image:", error)
                            }
                          }}
                        />

                        {/* Loading state overlay */}
                        <div className="absolute inset-0 flex items-center justify-center rounded-md bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                          <p className="p-2 text-center text-xs text-white">
                            {new Date(image.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}

                  {generatedImages.length === 0 && (
                    <div className="text-muted-foreground flex w-full items-center justify-center py-8">
                      <p>No generated images yet</p>
                    </div>
                  )}
                </div>

                {/* Gradient Shadows */}
                <div className="from-background pointer-events-none absolute bottom-4 left-0 top-0 w-8 bg-gradient-to-r to-transparent" />
                <div className="from-background pointer-events-none absolute bottom-4 right-0 top-0 w-8 bg-gradient-to-l to-transparent" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add padding at the bottom of the main content to account for the timeline */}
      <div className="pb-32" />

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Image</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>
              Are you sure you want to delete this image? This action cannot be
              undone.
            </p>
          </div>
          <DialogFooter className="flex gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                setShowDeleteDialog(false)
                setImageToDelete(null)
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={!imageToDelete || isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default TextToImageGenerator
