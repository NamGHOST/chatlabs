import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog"
import { Button } from "../ui/button"
import { IconDownload } from "@tabler/icons-react"
import Markdown from "react-markdown"
import { cn } from "@/lib/utils"
import { FC } from "react"

interface MeetingSummaryDialogProps {
  isOpen: boolean
  onClose: () => void
  summary: string | null
  topic: string
}

export const MeetingSummaryDialog: FC<MeetingSummaryDialogProps> = ({
  isOpen,
  onClose,
  summary,
  topic
}) => {
  const handleExportSummary = () => {
    const blob = new Blob([summary || ""], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `summary-${topic}-${new Date().toISOString().split("T")[0]}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl">
            Meeting Summary: {topic}
          </DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <div className="prose prose-invert bg-muted max-w-none rounded-lg p-6">
            <Markdown
              components={{
                h3: ({ children }) => (
                  <h3 className="text-primary mb-2 mt-6 text-lg font-semibold">
                    {children}
                  </h3>
                ),
                ul: ({ children }) => (
                  <ul className="my-2 list-inside list-disc space-y-1">
                    {children}
                  </ul>
                ),
                li: ({ children }) => (
                  <li className="text-muted-foreground">{children}</li>
                )
              }}
            >
              {summary || ""}
            </Markdown>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button onClick={handleExportSummary} variant="outline">
            <IconDownload className="mr-2" size={16} />
            Export Summary
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
