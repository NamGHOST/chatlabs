import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { Tables } from "@/supabase/types"
import { Tldraw } from "tldraw"

interface FileViewerProps {
  file: Tables<"files">
  content: string
}

export const FileViewer: React.FC<FileViewerProps> = ({ file, content }) => {
  return (
    <Tabs defaultValue="content" className="w-full">
      <TabsList>
        <TabsTrigger value="content">Content</TabsTrigger>
        <TabsTrigger value="mindmap">Mind Map</TabsTrigger>
      </TabsList>

      <TabsContent value="content">
        <div className="prose dark:prose-invert max-w-none">{content}</div>
      </TabsContent>

      <TabsContent value="mindmap" className="h-[600px]">
        <Tldraw persistenceKey={`mindmap-${file.id}`} />
      </TabsContent>
    </Tabs>
  )
}
