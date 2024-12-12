import { TLShape, createShapeId, Editor, IndexKey } from "@tldraw/tldraw"

export function createTextShape(text: string, editor: Editor): TLShape {
  const pageId = editor.getCurrentPageId()

  return {
    type: "text",
    id: createShapeId(),
    x: Math.random() * 1000 - 500,
    y: Math.random() * 1000 - 500,
    rotation: 0,
    isLocked: false,
    opacity: 1,
    parentId: pageId,
    meta: {},
    typeName: "shape",
    index: "a1" as IndexKey,
    props: {
      text: text,
      size: "m",
      color: "black"
    }
  }
}
