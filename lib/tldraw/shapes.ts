import { TLShape, createShapeId, Editor, IndexKey } from "@tldraw/tldraw"

export interface MindMapNode {
  id: string
  text: string
  x: number
  y: number
  connections?: string[]
}

export function createMindMapShapes(
  nodes: MindMapNode[],
  editor: Editor
): TLShape[] {
  const shapes: TLShape[] = []
  const pageId = editor.getCurrentPageId()
  const nodeShapeMap = new Map<string, { x: number; y: number }>()

  // Create note shapes for each node
  nodes.forEach((node, i) => {
    const shapeId = createShapeId()
    nodeShapeMap.set(node.id, { x: node.x, y: node.y })

    // For root node (main topic)
    if (node.id === "root") {
      shapes.push({
        type: "note",
        id: shapeId,
        x: 0,
        y: 0,
        rotation: 0,
        isLocked: false,
        opacity: 1,
        parentId: pageId,
        meta: {},
        typeName: "shape",
        index: `a${i}` as IndexKey,
        props: {
          text: node.text,
          color: "violet",
          size: "l",
          font: "draw"
        }
      })
    } else {
      // Calculate radial position
      const dx = node.x
      const dy = node.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      const nx = dx / distance
      const ny = dy / distance

      const arrowStart = {
        x: nx * 300, // Start from closer to root
        y: ny * 300
      }

      const arrowEnd = {
        x: nx * 800, // End further out
        y: ny * 800
      }

      // Create note for subtopic
      shapes.push({
        type: "note",
        id: shapeId,
        x: arrowEnd.x - 50, // Offset note position
        y: arrowEnd.y - 30,
        rotation: 0,
        isLocked: false,
        opacity: 1,
        parentId: pageId,
        meta: {},
        typeName: "shape",
        index: `a${i}` as IndexKey,
        props: {
          text: node.text,
          color: "yellow",
          size: "m",
          font: "draw"
        }
      })

      // Create connecting arrow
      shapes.push({
        type: "arrow",
        id: createShapeId(),
        x: 0,
        y: 0,
        rotation: 0,
        isLocked: false,
        opacity: 1,
        parentId: pageId,
        meta: {},
        typeName: "shape",
        index: `a${shapes.length}` as IndexKey,
        props: {
          start: arrowStart,
          end: arrowEnd,
          color: "black",
          size: "m",
          bend: 0
        }
      })
    }
  })

  return shapes
}
