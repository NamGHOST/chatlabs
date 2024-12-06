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

  // Create text shapes for each node
  nodes.forEach((node, i) => {
    const shapeId = createShapeId()
    nodeShapeMap.set(node.id, { x: node.x, y: node.y })

    // For non-root nodes, we'll update the position later
    if (node.id !== "root") {
      shapes.push({
        type: "text",
        id: shapeId,
        x: node.x,
        y: node.y,
        rotation: 0,
        isLocked: false,
        opacity: 1,
        parentId: pageId,
        meta: {},
        typeName: "shape",
        index: `a${i}` as IndexKey,
        props: {
          text: node.text,
          size: "l",
          color: "black"
        }
      })
    } else {
      // Root node stays at its original position
      shapes.push({
        type: "text",
        id: shapeId,
        x: node.x,
        y: node.y,
        rotation: 0,
        isLocked: false,
        opacity: 1,
        parentId: pageId,
        meta: {},
        typeName: "shape",
        index: `a${i}` as IndexKey,
        props: {
          text: node.text,
          size: "l",
          color: "black"
        }
      })
    }
  })

  // Create arrows between connected nodes
  nodes.forEach(node => {
    if (node.connections?.length) {
      node.connections.forEach(targetId => {
        const sourcePosition = nodeShapeMap.get(node.id)
        const targetPosition = nodeShapeMap.get(targetId)

        if (sourcePosition && targetPosition) {
          const isFromRoot = node.id === "root"

          if (isFromRoot) {
            // For root connections, calculate positions relative to root
            const dx = targetPosition.x
            const dy = targetPosition.y
            const distance = Math.sqrt(dx * dx + dy * dy)

            // Normalize the direction vector
            const nx = dx / distance
            const ny = dy / distance

            const arrowStart = {
              x: nx * 500, // Start 300 units away from root
              y: ny * 500
            }

            const arrowEnd = {
              x: nx * 1000, // End 600 units away from root
              y: ny * 1000
            }

            // Update the target text position
            const textShape = shapes.find(
              s =>
                s.type === "text" &&
                nodeShapeMap.get(targetId)?.x === s.x &&
                nodeShapeMap.get(targetId)?.y === s.y
            )
            if (textShape) {
              textShape.x = arrowEnd.x + nx * 100 // Place text 100 units beyond arrow end
              textShape.y = arrowEnd.y + ny * 100 - 25 // Slight vertical offset
            }

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
        }
      })
    }
  })

  return shapes
}
