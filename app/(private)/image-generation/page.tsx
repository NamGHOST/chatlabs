"use client"

import TextToImageGenerator from "@/components/image-generation/text-to-image-generator"
import { Suspense } from "react"
import { useUser } from "@/hooks/use-user"
import { Loader2 } from "lucide-react"

export default function ImageGenerationPage() {
  const { user, isLoading } = useUser()

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="size-8 animate-spin" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="mb-2 text-2xl font-bold">Sign in Required</h2>
          <p className="text-muted-foreground">
            Please sign in to access the image generation feature.
          </p>
        </div>
      </div>
    )
  }

  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          <Loader2 className="size-8 animate-spin" />
        </div>
      }
    >
      <TextToImageGenerator user={user} />
    </Suspense>
  )
}
