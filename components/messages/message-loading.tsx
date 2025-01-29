import React, { useState, useEffect } from "react"
import { ThinkingProcess } from "./thinking-process"
import { AnimatePresence } from "framer-motion"

const THINKING_STAGES = [
  {
    stage: "analyzing" as const,
    messages: [
      "Analyzing context and formulating approach...",
      "Examining input and identifying key elements...",
      "Evaluating requirements and constraints..."
    ]
  },
  {
    stage: "processing" as const,
    messages: [
      "Processing information and applying logic...",
      "Synthesizing knowledge from multiple sources...",
      "Integrating relevant concepts and patterns..."
    ]
  },
  {
    stage: "generating" as const,
    messages: [
      "Generating comprehensive response...",
      "Formulating clear and accurate answer...",
      "Preparing detailed explanation..."
    ]
  }
]

interface LoadingMessageProps {
  isGenerating: boolean
}

export const LoadingMessage: React.FC<LoadingMessageProps> = ({
  isGenerating
}) => {
  const [stageIndex, setStageIndex] = useState(0)
  const [messageIndex, setMessageIndex] = useState(0)

  useEffect(() => {
    if (!isGenerating) return

    const messageInterval = setInterval(() => {
      setMessageIndex(
        prev => (prev + 1) % THINKING_STAGES[stageIndex].messages.length
      )
    }, 3000)

    const stageInterval = setInterval(() => {
      setStageIndex(prev => (prev + 1) % THINKING_STAGES.length)
    }, 9000)

    return () => {
      clearInterval(messageInterval)
      clearInterval(stageInterval)
    }
  }, [isGenerating, stageIndex])

  if (!isGenerating) return null

  const currentStage = THINKING_STAGES[stageIndex]
  const currentMessage = currentStage.messages[messageIndex]

  return (
    <AnimatePresence mode="wait">
      <ThinkingProcess
        key={`${currentStage.stage}-${messageIndex}`}
        stage={currentStage.stage}
        message={currentMessage}
      />
    </AnimatePresence>
  )
}
