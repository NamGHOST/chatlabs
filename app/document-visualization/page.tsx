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

export default function DocumentVisualizationPage() {
  const { files } = useContext(ChatbotUIContext)
  const [selectedFile, setSelectedFile] = useState<Tables<"files"> | null>(null)
  const [mindMapPrompt, setMindMapPrompt] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)

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
              content: `Create a mind map about: ${mindMapPrompt}. Place 5-10 subtopics around the main topic, each positioned 800 units away from the center in a circular layout.`
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

  const handleMount = (editor: Editor) => {
    window.editor = editor

    const shapes = editor.getSelectedShapes()
    shapes.forEach(shape => editor.deleteShape(shape.id))

    editor.createShape({
      type: "text",
      x: 0,
      y: 0,
      props: {
        text: "Enter a topic and click Generate",
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

  return (
    <div className="relative size-full">
      {/* Floating Input Bar */}
      <div className="absolute left-1/2 top-4 z-10 w-full max-w-2xl -translate-x-1/2 px-4">
        <Card className="flex items-center gap-2 p-2">
          <Input
            placeholder="Enter a topic for your mind map..."
            value={mindMapPrompt}
            onChange={e => setMindMapPrompt(e.target.value)}
            className="flex-1"
            onKeyDown={e => {
              if (e.key === "Enter" && !isGenerating) {
                handleGenerateMindMap()
              }
            }}
            disabled={isGenerating}
          />
          <Button onClick={handleGenerateMindMap} disabled={isGenerating}>
            {isGenerating ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              "Generate"
            )}
          </Button>
        </Card>
      </div>

      {/* Tldraw Canvas */}
      <div style={{ position: "fixed", inset: 0, top: "80px" }}>
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
