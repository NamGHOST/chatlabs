"use client"

import { useContext, useState } from "react"
import { ChatbotUIContext } from "@/context/context"
import { Tables } from "@/supabase/types"
import { Card } from "@/components/ui/card"
import { FileIcon } from "@/components/ui/file-icon"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { Tldraw } from "tldraw"
import "tldraw/tldraw.css"
import { createMindMapShapes, MindMapNode } from "@/lib/tldraw/shapes"
import { Editor } from "@tldraw/tldraw"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { IconChevronDown, IconChevronUp, IconX } from "@tabler/icons-react"
import { createTextShape } from "@/lib/tldraw/text-shapes"
import { IconWand, IconBrain, IconTypography } from "@tabler/icons-react"

const InputWithIcon = ({
  placeholder,
  value,
  onChange,
  onKeyDown,
  disabled,
  onGenerate,
  onTypeChange,
  generationType
}: {
  placeholder: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onKeyDown?: (e: React.KeyboardEvent) => void
  disabled?: boolean
  onGenerate: () => void
  onTypeChange: () => void
  generationType: "mindmap" | "text"
}) => {
  return (
    <div className="relative flex items-center">
      <Input
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        disabled={disabled}
        className="focus-visible:ring-primary/20 border-2 bg-white/50 pr-24 backdrop-blur-sm dark:bg-black/50"
      />
      <div className="absolute right-2 flex gap-1">
        <Button
          size="icon"
          variant="ghost"
          className="hover:bg-primary/5 size-8"
          onClick={onTypeChange}
          disabled={disabled}
        >
          {generationType === "mindmap" ? (
            <IconBrain className="size-4 text-violet-500" />
          ) : (
            <IconTypography className="size-4 text-emerald-500" />
          )}
        </Button>
        <Button
          size="icon"
          className="size-8 bg-gradient-to-r from-violet-500/80 to-pink-500/80 text-white shadow-lg transition-all duration-200 hover:from-violet-500/80 hover:to-pink-500/80"
          onClick={onGenerate}
          disabled={disabled}
        >
          {disabled ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <IconWand className="size-4" />
          )}
        </Button>
      </div>
    </div>
  )
}

export default function DocumentVisualizationPage() {
  const { files } = useContext(ChatbotUIContext)
  const [selectedFile, setSelectedFile] = useState<Tables<"files"> | null>(null)
  const [mindMapPrompt, setMindMapPrompt] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationType, setGenerationType] = useState<"mindmap" | "text">(
    "mindmap"
  )
  const [textPrompt, setTextPrompt] = useState("")
  const [isInputVisible, setIsInputVisible] = useState(true)

  const handleGenerateMindMap = async () => {
    if (!mindMapPrompt.trim()) {
      toast.error("Please enter a topic for your mind map")
      return
    }

    setIsGenerating(true)
    try {
      const response = await fetch("/api/chat/openrouter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          chatSettings: {
            model: "openai/gpt-4o-mini",
            temperature: 0.7,
            maxTokens: 2000
          },
          messages: [
            {
              role: "system",
              content: `You are a mind map generator. Generate a mind map structure where:
              - The root node should be at (0,0) with id 'root'
              - Each subtopic should be positioned in a circular layout around the root
              - For each subtopic, provide coordinates that point AWAY from the root
              - Respond with a JSON object containing a nodes array
              - Each node should have: id, text, x, y, and connections array
              - The root node should connect TO the subtopics (not the other way around)
              - NO markdown formatting or explanation - ONLY the JSON object.`
            },
            {
              role: "user",
              content: `Create a mind map about: ${mindMapPrompt}. Place 5-8 subtopics around the main topic, each positioned 800 units away from the center in a circular layout.`
            }
          ]
        })
      })

      const data = await response.json()
      console.log("Raw API response:", data)

      if (!data || !Array.isArray(data.nodes)) {
        throw new Error("Invalid mind map data structure")
      }

      const editor = window.editor
      if (editor) {
        createMindMap(editor, data.nodes)
      }

      setSelectedFile({
        id: "generated",
        name: mindMapPrompt
      } as Tables<"files">)
    } catch (error) {
      console.error("Error generating mind map:", error)
      toast.error(
        error instanceof Error ? error.message : "Failed to generate mind map"
      )
    } finally {
      setIsGenerating(false)
    }
  }

  const handleGenerateText = async () => {
    if (!textPrompt.trim()) {
      toast.error("Please enter text to generate passage")
      return
    }

    setIsGenerating(true)
    try {
      const response = await fetch("/api/chat/openrouter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          chatSettings: {
            model: "openai/gpt-4o-mini",
            temperature: 0.7,
            maxTokens: 1000
          },
          messages: [
            {
              role: "system",
              content:
                "You are a helpful assistant. Generate text based on the user's prompt."
            },
            {
              role: "user",
              content: textPrompt
            }
          ]
        })
      })

      // Get the response as text instead of trying to parse as JSON
      const generatedText = await response.text()

      const editor = window.editor
      if (editor) {
        const textShape = createTextShape(generatedText, editor)
        editor.createShape(textShape)
      }
    } catch (error) {
      console.error("Error generating text:", error)
      toast.error(
        error instanceof Error ? error.message : "Failed to generate text"
      )
    } finally {
      setIsGenerating(false)
    }
  }

  const handleMount = (editor: Editor) => {
    window.editor = editor

    const shapes = editor.getSelectedShapes()
    shapes.forEach(shape => editor.deleteShape(shape.id))

    editor.createShape({
      type: "text",
      x: 0,
      y: 0,
      props: {
        text: "This feature is now in Beta. Your progress will not be save here. 此功能正在測試階段",
        size: "l",
        color: "black"
      }
    })
  }

  const createMindMap = (editor: Editor, nodes: MindMapNode[]) => {
    const shapes = editor.getSelectedShapes()
    shapes.forEach(shape => editor.deleteShape(shape.id))

    const mindMapShapes = createMindMapShapes(nodes, editor)
    mindMapShapes.forEach(shape => editor.createShape(shape))
    editor.zoomToFit()
  }

  const toggleGenerationType = () => {
    setGenerationType(prev => (prev === "mindmap" ? "text" : "mindmap"))
  }

  return (
    <div className="relative size-full">
      {/* Floating Input Bar */}
      <div className="absolute left-1/2 top-4 z-10 w-full max-w-2xl -translate-x-1/2 px-4">
        <Card className="relative border-none bg-gradient-to-r from-violet-500/10 via-amber-500/10 to-emerald-500/10 shadow-lg backdrop-blur-sm">
          {/* Toggle visibility button */}
          <Button
            size="icon"
            variant="ghost"
            className="absolute -bottom-12 left-1/2 -translate-x-1/2 rounded-full bg-white/50 shadow-md backdrop-blur-sm transition-all duration-200 hover:bg-white/80 dark:bg-black/50 dark:hover:bg-black/80"
            onClick={() => setIsInputVisible(!isInputVisible)}
          >
            {isInputVisible ? (
              <IconChevronUp className="size-4" />
            ) : (
              <IconChevronDown className="size-4" />
            )}
          </Button>

          {isInputVisible && (
            <div className="p-4">
              {generationType === "mindmap" ? (
                <InputWithIcon
                  placeholder="Enter a topic for your mind map..."
                  value={mindMapPrompt}
                  onChange={e => setMindMapPrompt(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter" && !isGenerating) {
                      handleGenerateMindMap()
                    }
                  }}
                  disabled={isGenerating}
                  onGenerate={handleGenerateMindMap}
                  onTypeChange={toggleGenerationType}
                  generationType={generationType}
                />
              ) : (
                <InputWithIcon
                  placeholder="Enter text to generate..."
                  value={textPrompt}
                  onChange={e => setTextPrompt(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter" && !isGenerating) {
                      handleGenerateText()
                    }
                  }}
                  disabled={isGenerating}
                  onGenerate={handleGenerateText}
                  onTypeChange={toggleGenerationType}
                  generationType={generationType}
                />
              )}
            </div>
          )}
        </Card>
      </div>

      {/* Tldraw Canvas */}
      <div style={{ position: "fixed", inset: 0 }}>
        <Tldraw onMount={handleMount} persistenceKey="mind-map-visualization" />
      </div>
    </div>
  )
}

// Add type declaration for the global editor
declare global {
  interface Window {
    editor: Editor | undefined
  }
}
