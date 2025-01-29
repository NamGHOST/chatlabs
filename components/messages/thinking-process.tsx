import React from "react"
import { IconBrain, IconBulb, IconCircleFilled } from "@tabler/icons-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface ThinkingProcessProps {
  stage: "analyzing" | "processing" | "generating"
  message: string
}

const stageConfig = {
  analyzing: {
    icon: IconBrain,
    color: "text-blue-500",
    label: "Analyzing"
  },
  processing: {
    icon: IconCircleFilled,
    color: "text-purple-500",
    label: "Processing"
  },
  generating: {
    icon: IconBulb,
    color: "text-yellow-500",
    label: "Generating"
  }
}

export const ThinkingProcess: React.FC<ThinkingProcessProps> = ({
  stage,
  message
}) => {
  const config = stageConfig[stage]
  const Icon = config.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-secondary/50 flex flex-col space-y-3 rounded-lg p-4"
    >
      <div className="flex items-center space-x-3">
        <div className={cn("rounded-full p-2", config.color)}>
          <Icon className="size-5" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-medium">{config.label}</span>
          <span className="text-muted-foreground text-xs">{message}</span>
        </div>
        <div className="ml-auto flex items-center space-x-1">
          <motion.div
            className={cn("size-1.5 rounded-full", config.color)}
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
          <motion.div
            className={cn("size-1.5 rounded-full", config.color)}
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1, delay: 0.2, repeat: Infinity }}
          />
          <motion.div
            className={cn("size-1.5 rounded-full", config.color)}
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1, delay: 0.4, repeat: Infinity }}
          />
        </div>
      </div>
    </motion.div>
  )
}
