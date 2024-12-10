"use client"

import { useState, useEffect, useCallback, useRef, useMemo } from "react"
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
  deleteImageFromHistory,
  getImageGenerationCount
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
import Image from "next/image"
import {
  ImageModelId,
  ModelTier,
  PlanType,
  IMAGE_MODEL_TIERS,
  IMAGE_GENERATION_LIMITS,
  MODEL_DISPLAY_NAMES
} from "@/lib/subscription/image-limits"
import { UsageCounter } from "./usage-counter"
import { useImageGenerationLimits } from "@/hooks/useImageGenerationLimits"
import { recraftStyles } from "./AdvancedParametersPanel"
import { RecraftStyle } from "@/types/image-generation"
import { FileUploader } from "../ui/file-uploader"
import { Canvas } from "../ui/canvas"
import { ReactSketchCanvasRef } from "react-sketch-canvas"
import { uploadMaskToStorage } from "@/lib/storage/image-processing"
import { useInView } from "react-intersection-observer"
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface TextToImageGeneratorProps {
  user: {
    id: string
    plan?: string
  }
}

interface ImageToImageParams {
  image: File | null
  mask: File | null
  prompt: string
  negativePrompt: string
  guidanceScale: number
  steps: number
  imageUrl?: string
  maskUrl?: string
}

interface ImageHistoryResponse {
  data: GeneratedImage[]
  hasMore: boolean
  nextPage: number
}

const TextToImageGenerator: React.FC<TextToImageGeneratorProps> = ({
  user
}) => {
  const userPlan = (user.plan?.split("_")[0].toUpperCase() ||
    "FREE") as PlanType
  const { hasReachedLimit, refreshCounts } = useImageGenerationLimits(
    user.id,
    userPlan
  )

  const [params, setParams] = useState<{
    prompt: string
    magicPrompt: string
    negativePrompt: string
    aspectRatio: string
    steps: number
    guidanceScale: number
    seed: number
    samplerName: string
    batchSize: number
    batchCount: number
    clipSkip: number
    tiling: boolean
    recraftStyle: string
    imageToImage: {
      image: File | null
      mask: File | null
      prompt: string
      negativePrompt: string
      guidanceScale: number
      steps: number
      imageUrl: string | undefined
      maskUrl: string | undefined
    }
  }>({
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
    tiling: false,
    recraftStyle: recraftStyles[0].value,
    imageToImage: {
      image: null as File | null,
      mask: null as File | null,
      prompt: "",
      negativePrompt: "",
      guidanceScale: 7.5,
      steps: 4,
      imageUrl: undefined,
      maskUrl: undefined
    }
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([])
  const [selectedImgModel, setSelectedImgModel] =
    useState<ImageModelId>("flux-schnell")
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
  const [imageLoadErrors, setImageLoadErrors] = useState<
    Record<string, boolean>
  >({})
  const [activeTab, setActiveTab] = useState<"text" | "image">("text")
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const canvasRef = useRef<ReactSketchCanvasRef>(null)
  const [page, setPage] = useState(0)
  const { ref: loadMoreRef, inView } = useInView()

  // Replace the existing image history loading with useInfiniteQuery
  const {
    data: infiniteData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteQuery<ImageHistoryResponse>({
    queryKey: ["imageHistory", user.id],
    queryFn: async ({ pageParam = 0 }) => {
      const response = await getImageHistory(user.id, pageParam as number)
      return {
        data: response.data,
        hasMore: response.hasMore,
        nextPage: (pageParam as number) + 1
      }
    },
    getNextPageParam: lastPage =>
      lastPage.hasMore ? lastPage.nextPage : undefined,
    initialPageParam: 0
  })

  // Update the generatedImages state with proper type assertion
  const allImages = useMemo(() => {
    return infiniteData?.pages.flatMap(page => page.data) ?? []
  }, [infiniteData])

  // Add effect for infinite scrolling
  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage()
    }
  }, [inView, fetchNextPage, hasNextPage])

  // Load history on mount
  useEffect(() => {
    const loadHistory = async () => {
      setIsHistoryLoading(true)
      try {
        const history = await getImageHistory(user.id)
        setGeneratedImages(history.data)
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
    if (name === "recraftStyle") {
      setParams(prev => ({ ...prev, recraftStyle: value as RecraftStyle }))
    } else {
      setParams(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleRecraftStyleChange = (value: string) => {
    if (isValidRecraftStyle(value)) {
      setParams(prev => ({ ...prev, recraftStyle: value as RecraftStyle }))
    }
  }

  const isValidRecraftStyle = (value: string): value is RecraftStyle => {
    return recraftStyles.some(style => style.value === value)
  }

  // Get queryClient instance
  const queryClient = useQueryClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedImgModel) {
      toast.error("Please select a model")
      return
    }

    setIsGenerating(true)
    try {
      console.log("Generating with params:", {
        prompt: params.prompt,
        style: selectedImgModel
        // ... other params
      })

      const response = await generateImage({
        prompt: params.prompt,
        negativePrompt: params.negativePrompt,
        aspectRatio: params.aspectRatio,
        style: selectedImgModel,
        recraftStyle:
          selectedImgModel === "recraft-v3"
            ? (params.recraftStyle as RecraftStyle)
            : undefined,
        guidanceScale: params.guidanceScale,
        steps: params.steps,
        seed: params.seed,
        samplerName: params.samplerName,
        batchSize: params.batchSize,
        batchCount: params.batchCount,
        clipSkip: params.clipSkip,
        tiling: params.tiling
      })

      console.log("Generation response:", response)

      if (!response || typeof response !== "string") {
        console.error("Invalid response:", response)
        throw new Error("Invalid response from API")
      }

      const newImage: GeneratedImage = {
        url: response,
        timestamp: Date.now(),
        prompt: params.prompt,
        params: {
          aspectRatio: params.aspectRatio,
          style: selectedImgModel,
          guidanceScale: params.guidanceScale,
          steps: params.steps
        }
      }

      await saveImageToHistory(newImage, user.id)
      await queryClient.invalidateQueries({ queryKey: ["imageHistory"] })
      setGeneratedImages(prev => [newImage, ...prev])
      toast.success("Image generated successfully!")
      await refreshCounts()
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

      setParams(prev => {
        const newPrompt = prev.prompt
          ? `${prev.prompt}\n${enhancedPrompt}`
          : enhancedPrompt

        return {
          ...prev,
          prompt: newPrompt,
          magicPrompt: ""
        }
      })

      toast.success("Prompt enhanced and added!")
    } catch (error) {
      console.error("Error translating prompt:", error)
      toast.error("Failed to enhance prompt")
    } finally {
      setIsTranslating(false)
    }
  }

  const handleDownload = async (url: string, timestamp: string) => {
    try {
      setIsDownloading(true)

      const response = await fetch(
        `/api/image/download?url=${encodeURIComponent(url)}`
      )
      if (!response.ok) throw new Error("Failed to fetch image")

      const blob = await response.blob()
      const blobUrl = window.URL.createObjectURL(blob)

      // Create link element but don't append it to document
      const link = document.createElement("a")
      link.href = blobUrl
      link.download = `image_${timestamp}.png`
      link.click()

      // Clean up
      window.URL.revokeObjectURL(blobUrl)
    } catch (error) {
      console.error("Download failed:", error)
      // Handle error (maybe show a toast notification)
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
      await queryClient.invalidateQueries({ queryKey: ["imageHistory"] })
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

  const handleImageError = (timestamp: number) => {
    setImageLoadErrors(prev => ({
      ...prev,
      [timestamp]: true
    }))
  }

  useEffect(() => {
    console.log("Updated recraftStyle:", params.recraftStyle)
  }, [params.recraftStyle])

  const handleImageUpload = useCallback(
    async (file: File) => {
      try {
        // Convert file to blob
        const blob = new Blob([file], { type: file.type })

        // Use a temporary path with timestamp
        const timestamp = Date.now()
        const imagePath = `temp/uploads/${timestamp}_${user.id}_image.png`

        // Upload to Supabase storage with expiration
        const { data, error } = await supabase.storage
          .from("generated_images")
          .upload(imagePath, blob, {
            contentType: file.type,
            upsert: true,
            cacheControl: "3600" // Cache for 1 hour
          })

        if (error) throw error

        // Get URL that expires in 1 hour
        const signedData = await supabase.storage
          .from("generated_images")
          .createSignedUrl(imagePath, 3600)

        if (!signedData.data) throw new Error("Failed to get signed URL")

        const { signedUrl } = signedData.data

        // Schedule deletion after 1 hour
        setTimeout(async () => {
          await supabase.storage.from("generated_images").remove([imagePath])
        }, 3600 * 1000)

        // Update state with URL
        setParams(prev => ({
          ...prev,
          imageToImage: {
            ...prev.imageToImage,
            imageUrl: signedUrl
          }
        }))

        // Set preview URL
        setPreviewUrl(signedUrl)
      } catch (error) {
        console.error("Error uploading image:", error)
        toast.error("Failed to upload image")
      }
    },
    [user.id]
  )

  const handleMaskChange = useCallback(
    async (maskData: string) => {
      if (!maskData) return

      // Handle the mask data here
      const maskUrl = await uploadMaskToStorage(maskData, user.id)

      setParams(prev => ({
        ...prev,
        imageToImage: {
          ...prev.imageToImage,
          maskUrl
        }
      }))
    },
    [user.id]
  )

  const handleMaskSave = useCallback(() => {
    toast.success("Mask saved!")
  }, [])

  const handleImageToImageSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!params.imageToImage.imageUrl) {
      toast.error("Please upload or select an image")
      return
    }

    if (!selectedImgModel) {
      toast.error("Please select a model")
      return
    }

    setIsGenerating(true)
    try {
      const imageUrl = await generateImage({
        mode: "image-to-image",
        imageUrl: params.imageToImage.imageUrl,
        maskUrl: params.imageToImage.maskUrl,
        prompt: params.imageToImage.prompt || "",
        negativePrompt: params.imageToImage.negativePrompt,
        guidanceScale: params.imageToImage.guidanceScale,
        steps: params.imageToImage.steps,
        style: selectedImgModel
      })

      // Save to history
      const newImage: GeneratedImage = {
        url: imageUrl,
        timestamp: Date.now(),
        prompt: params.imageToImage.prompt,
        params: {
          aspectRatio: params.aspectRatio,
          style: selectedImgModel,
          guidanceScale: params.imageToImage.guidanceScale || 7.5,
          steps: params.imageToImage.steps || 20
        }
      }

      await saveImageToHistory(newImage, user.id)
      setGeneratedImages(prev => [newImage, ...prev])
      toast.success("Image generated successfully!")
      await refreshCounts()
    } catch (error: any) {
      console.error("Error in generateImage:", error)
      toast.error(error.message || "Failed to generate image")
    } finally {
      setIsGenerating(false)
    }
  }

  // Set default model for image-to-image
  useEffect(() => {
    if (activeTab === "image") {
      setSelectedImgModel("flux-fill-pro")
    }
  }, [activeTab])

  if (isLoading) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center">
        <Loader2 className="size-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="size-full overflow-y-auto">
      {/* Brand Header */}
      <div className="py-8">
        <Brand />
      </div>

      <div className="flex flex-col space-y-4">
        <UsageCounter
          userId={user.id}
          userPlan={user.plan?.split("_")[0].toUpperCase() as PlanType}
        />
      </div>
      {/* Existing Content */}
      <div className="p-4 md:p-6 lg:p-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
          {/* Form Section - reduced from 1/2 to 2/5 */}
          <div className="lg:col-span-2">
            <Tabs
              defaultValue="text"
              onValueChange={value => setActiveTab(value as "text" | "image")}
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="text">Text to Image</TabsTrigger>
                <TabsTrigger value="image">Image to Image</TabsTrigger>
              </TabsList>

              <TabsContent value="text">
                <form
                  onSubmit={handleSubmit}
                  className="space-y-4 md:sticky md:top-6 md:space-y-6"
                >
                  <div className="flex items-center justify-between">
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
                            onChange={e =>
                              handleChange("prompt", e.target.value)
                            }
                            className="min-h-[100px] resize-y"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="magicPrompt">Magic Prompt</Label>
                          <div className="flex flex-col gap-2 sm:flex-row">
                            <Input
                              id="magicPrompt"
                              placeholder="English, 中文, 日本語, 韓国語..."
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
                              disabled={
                                isTranslating || !params.magicPrompt.trim()
                              }
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
                          <Label htmlFor="negativePrompt">
                            Negative Prompt
                          </Label>
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
                      <div className="grid gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="style">Model</Label>
                          <Select
                            value={selectedImgModel}
                            onValueChange={value =>
                              setSelectedImgModel(value as ImageModelId)
                            }
                          >
                            <SelectTrigger id="style">
                              <SelectValue placeholder="Select model" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="flux-schnell">
                                FLUX Schnell (Fast) - All Plans
                              </SelectItem>
                              <SelectItem value="flux-1.1-pro">
                                FLUX 1.1 Pro (Quality) - All Plans
                              </SelectItem>
                              <SelectItem value="flux-1.1-pro-ultra">
                                FLUX 1.1 Pro Ultra (Realistic) - Pro Plan
                              </SelectItem>
                              <SelectItem value="stable-diffusion-3.5-large-turbo">
                                Stable Diffusion 3.5 Turbo (Realistic) - Pro
                                Plan
                              </SelectItem>
                              <SelectItem value="recraft-v3">
                                Recraft v3 (Realistic) - Pro Plan
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
                                <SelectItem
                                  key={ratio.value}
                                  value={ratio.value}
                                >
                                  {ratio.value} ({ratio.width}x{ratio.height})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {selectedImgModel === "recraft-v3" && (
                          <div className="space-y-2">
                            <Label htmlFor="recraftStyle">Art Style</Label>
                            <Select
                              value={params.recraftStyle}
                              onValueChange={handleRecraftStyleChange}
                            >
                              <SelectTrigger id="recraftStyle">
                                <SelectValue placeholder="Select style" />
                              </SelectTrigger>
                              <SelectContent>
                                {recraftStyles.map(style => (
                                  <SelectItem
                                    key={style.value}
                                    value={style.value}
                                  >
                                    {style.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>
                    </Card>

                    {/* Advanced Settings Section */}
                    <Collapsible>
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="ghost"
                          className="w-full justify-between"
                        >
                          Advanced Settings
                          <ChevronDown className="size-4" />
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <Card className="mt-2 p-4">
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="steps">
                                Steps ({params.steps})
                              </Label>
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
              </TabsContent>

              <TabsContent value="image">
                <form
                  onSubmit={handleImageToImageSubmit}
                  className="space-y-4"
                  id="image-to-image-form"
                >
                  <Card className="p-4">
                    <Tabs defaultValue="upload">
                      <TabsList>
                        <TabsTrigger value="upload">Upload Image</TabsTrigger>
                        <TabsTrigger value="history">From History</TabsTrigger>
                      </TabsList>

                      <TabsContent value="upload">
                        <FileUploader
                          onFileSelected={handleImageUpload}
                          accept="image/*"
                          maxSize={5242880}
                        />
                      </TabsContent>

                      <TabsContent value="history">
                        <div className="grid max-h-[60vh] grid-cols-3 gap-2 overflow-y-auto p-2">
                          {allImages.map(img => (
                            <div
                              key={img.timestamp}
                              className={cn(
                                "cursor-pointer overflow-hidden rounded-md border",
                                params.imageToImage.imageUrl === img.url &&
                                  "ring-primary ring-2"
                              )}
                              onClick={() => {
                                setParams(prev => ({
                                  ...prev,
                                  imageToImage: {
                                    ...prev.imageToImage,
                                    imageUrl: img.url
                                  }
                                }))
                                setPreviewUrl(img.url)
                              }}
                            >
                              <Image
                                src={img.url}
                                alt={img.prompt}
                                width={100}
                                height={100}
                                className="aspect-square h-auto w-full object-cover"
                                loading="lazy"
                              />
                            </div>
                          ))}

                          {/* Load more trigger */}
                          {hasNextPage && (
                            <div
                              ref={loadMoreRef}
                              className="col-span-full py-4"
                            >
                              {isFetchingNextPage ? (
                                <div className="flex justify-center">
                                  <Loader2 className="size-6 animate-spin" />
                                </div>
                              ) : (
                                <div className="text-muted-foreground text-center text-sm">
                                  Scroll to load more
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </TabsContent>
                    </Tabs>

                    {previewUrl && (
                      <div className="mt-4 space-y-2">
                        <Label>Draw Mask (Optional)</Label>
                        <Canvas
                          ref={canvasRef}
                          imageUrl={previewUrl}
                          className="rounded-md border"
                          onMaskChange={handleMaskChange}
                          onMaskSave={handleMaskSave}
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="i2i-prompt">Prompt</Label>
                      <Textarea
                        id="i2i-prompt"
                        placeholder="Describe the changes you want..."
                        value={params.imageToImage.prompt}
                        onChange={e =>
                          setParams(prev => ({
                            ...prev,
                            imageToImage: {
                              ...prev.imageToImage,
                              prompt: e.target.value
                            }
                          }))
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="i2i-negative-prompt">
                        Negative Prompt
                      </Label>
                      <Textarea
                        id="i2i-negative-prompt"
                        placeholder="Things to avoid..."
                        value={params.imageToImage.negativePrompt}
                        onChange={e =>
                          setParams(prev => ({
                            ...prev,
                            imageToImage: {
                              ...prev.imageToImage,
                              negativePrompt: e.target.value
                            }
                          }))
                        }
                      />
                    </div>

                    <div className="mt-4 space-y-2">
                      <Label htmlFor="i2i-model">Model</Label>
                      <Select
                        value={selectedImgModel}
                        onValueChange={value =>
                          setSelectedImgModel(value as ImageModelId)
                        }
                      >
                        <SelectTrigger id="i2i-model">
                          <SelectValue placeholder="Select model" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="flux-fill-pro">
                            FLUX Fill Pro (Image-to-Image) - Pro Plan
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </Card>

                  {/* Model-specific settings */}
                  <Card className="p-4">
                    <div className="space-y-4">
                      {selectedImgModel === "flux-fill-pro" && (
                        <>
                          <div className="space-y-2">
                            <Label>Steps (1-50)</Label>
                            <Slider
                              min={1}
                              max={50}
                              step={1}
                              value={[params.imageToImage.steps]}
                              onValueChange={value =>
                                setParams(prev => ({
                                  ...prev,
                                  imageToImage: {
                                    ...prev.imageToImage,
                                    steps: value[0]
                                  }
                                }))
                              }
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Guidance (2-5)</Label>
                            <Slider
                              min={2}
                              max={5}
                              step={0.1}
                              value={[params.imageToImage.guidanceScale]}
                              onValueChange={value =>
                                setParams(prev => ({
                                  ...prev,
                                  imageToImage: {
                                    ...prev.imageToImage,
                                    guidanceScale: value[0]
                                  }
                                }))
                              }
                            />
                          </div>
                        </>
                      )}
                      {/* Add other model-specific settings here */}
                    </div>
                  </Card>

                  <Button
                    type="submit"
                    className="mt-4 w-full"
                    disabled={!previewUrl || isGenerating}
                    form="image-to-image-form"
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
                </form>
              </TabsContent>
            </Tabs>
          </div>

          {/* Generated Images Section - increased from 1/2 to 3/5 */}
          <div className="space-y-4 md:space-y-6 lg:col-span-3">
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
                      <div className="relative aspect-[4/3] overflow-hidden">
                        {!imageLoadErrors[image.timestamp] ? (
                          <Image
                            src={image.url}
                            alt={`Generated image: ${image.prompt.slice(0, 30)}...`}
                            className="absolute inset-0 size-full bg-black/5 object-contain"
                            width={1024}
                            height={1024}
                            unoptimized={true}
                            priority={false}
                            onError={() => handleImageError(image.timestamp)}
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                            <p className="text-sm text-gray-500">
                              Failed to load image
                            </p>
                          </div>
                        )}
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
                            handleDownload(
                              image.url,
                              image.timestamp.toString()
                            )
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
                <DialogContent className="flex h-[95vh] w-[70vw] max-w-[70vw] flex-col overflow-hidden p-0">
                  <DialogHeader className="relative border-b p-4">
                    <DialogClose className="absolute right-4 top-4">
                      <Button variant="ghost" size="icon">
                        <IconX className="size-4" />
                      </Button>
                    </DialogClose>
                    <DialogTitle className="text-center">
                      Image Preview
                    </DialogTitle>
                    <div className="text-muted-foreground mt-2 flex flex-wrap items-center justify-center gap-2 text-sm">
                      <span>
                        {new Date(selectedImage.timestamp).toLocaleString()}
                      </span>
                      <span>•</span>
                      <Badge variant="secondary">
                        {selectedImage.params.style}
                      </Badge>
                      <Badge variant="secondary">
                        {selectedImage.params.aspectRatio}
                      </Badge>
                    </div>
                  </DialogHeader>

                  <div className="relative flex-1 overflow-auto p-4">
                    <div className="flex size-full items-center justify-center">
                      <Image
                        src={selectedImage.url}
                        alt={selectedImage.prompt}
                        className="max-h-[85vh] w-full max-w-[90vw] rounded-lg object-contain"
                        width={2048}
                        height={2048}
                        unoptimized={true}
                        priority={true}
                      />
                    </div>
                  </div>

                  <div className="bg-background/80 sticky bottom-0 border-t p-4 backdrop-blur">
                    <div className="flex flex-col gap-4">
                      <div className="max-h-[80px] overflow-y-auto">
                        <p
                          className="mx-auto max-w-[60ch] cursor-pointer text-center text-sm hover:opacity-80"
                          onClick={() => {
                            navigator.clipboard
                              .writeText(selectedImage.prompt)
                              .then(() =>
                                toast.success("Prompt copied to clipboard!")
                              )
                              .catch(() => toast.error("Failed to copy prompt"))
                          }}
                          title="Click to copy prompt"
                        >
                          {selectedImage.prompt}
                        </p>
                      </div>
                      <div className="flex justify-center gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() =>
                            handleDownload(
                              selectedImage.url,
                              selectedImage.timestamp.toString()
                            )
                          }
                          disabled={isDownloading}
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
                          onClick={() => {
                            setShowImagePreview(false)
                            handleDeleteImage(selectedImage)
                          }}
                        >
                          <IconTrash className="mr-2 size-4" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </div>

      {/* Timeline Drawer - adjust positioning for iPad */}
      <div className="fixed inset-x-0 bottom-0 z-50">
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
                      ? "grid max-h-[60vh] grid-cols-2 gap-4 overflow-y-auto sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8"
                      : "flex h-24 gap-4 overflow-x-auto pb-2"
                  )}
                >
                  {allImages.map((image, index) => (
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
                      <Image
                        src={image.url}
                        alt={image.prompt}
                        className="size-full rounded-md object-cover"
                        width={96}
                        height={96}
                        loading={index > 20 ? "lazy" : "eager"}
                        unoptimized
                      />
                    </div>
                  ))}

                  {/* Load more trigger */}
                  {hasNextPage && (
                    <div ref={loadMoreRef} className="col-span-full py-4">
                      {isFetchingNextPage ? (
                        <div className="flex justify-center">
                          <Loader2 className="size-6 animate-spin" />
                        </div>
                      ) : (
                        <div className="text-muted-foreground text-center text-sm">
                          Scroll to load more
                        </div>
                      )}
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

      {/* Increase bottom padding to ensure content isn't hidden behind drawer */}
      <div className="pb-40" />

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
