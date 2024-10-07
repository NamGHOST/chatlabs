import { ChatMessage, CodeBlock } from "@/types"
import { Tables } from "@/supabase/types"

export const parseCodeBlocksAndContent = (
  content: string,
  messageId: string
): { parsedContent: string; codeBlocks: CodeBlock[] } => {
  const blocks: CodeBlock[] = []
  let remainingContent = content

  // Parse complete code blocks
  const completeBlockRegex = /```(\w+)?\s*(?:#filename=(.+?)#)?\n([\s\S]*?)```/g
  remainingContent = remainingContent.replace(
    completeBlockRegex,
    (_, lang, filename, code) => {
      blocks.push({
        language: lang || "text",
        code: code.trim(),
        filename: filename,
        sequenceNo: blocks.length,
        messageId: messageId
      })
      return `[CODE_BLOCK_${blocks.length - 1}]`
    }
  )

  const FILENAME_PREFIX = "#filename="

  // Check for an unfinished code block at the end

  // this is not working

  // I want to be able to capture unfinished tags like "#filename=test#"
  const unfinishedBlockRegex = /```(\w+)?\s*(#(?:(?!#).)*?#)?\n([\s\S]*?)$/
  const unfinishedMatch = remainingContent.match(unfinishedBlockRegex)
  if (unfinishedMatch) {
    const [fullMatch, lang, filenameTag, code] = unfinishedMatch

    console.log("unfinishedMatch", filenameTag)
    console.log("code", code)

    if (!code) {
      return {
        parsedContent: remainingContent,
        codeBlocks: blocks
      }
    }

    remainingContent = remainingContent.replace(fullMatch, "")

    if (!filenameTag && FILENAME_PREFIX.startsWith(code)) {
      return {
        parsedContent: remainingContent,
        codeBlocks: blocks
      }
    }

    if (typeof filenameTag === "undefined") {
      return {
        parsedContent: remainingContent,
        codeBlocks: blocks
      }
    }

    let filename = undefined
    const filenameMatch = filenameTag.match(`${FILENAME_PREFIX}(.+?)#`)
    if (!filenameMatch) {
      return {
        parsedContent: remainingContent,
        codeBlocks: blocks
      }
    }

    filename = filenameMatch[1]

    blocks.push({
      language: lang || "text",
      code: code.trim(),
      filename: filename,
      sequenceNo: blocks.length,
      messageId: messageId
    })

    remainingContent = [
      remainingContent,
      `[CODE_BLOCK_${blocks.length - 1}]`
    ].join("")
  }

  return { parsedContent: remainingContent, codeBlocks: blocks }
}

export function parseChatMessageCodeBlocksAndContent(
  message: ChatMessage
): ChatMessage {
  if (message.codeBlocks && message.codeBlocks.length > 0) {
    // update message ID
    message.codeBlocks.forEach(block => {
      block.messageId = message.message.id
    })
    return message
  }

  const { parsedContent, codeBlocks } = parseCodeBlocksAndContent(
    message.message.content,
    message.message.id
  )
  return {
    ...message,
    message: {
      ...message.message,
      content: parsedContent
    },
    codeBlocks
  }
}

export const parseDBMessageCodeBlocksAndContent = (
  message: Tables<"messages"> & {
    file_items?: { id: string }[]
  }
): ChatMessage => {
  const { parsedContent, codeBlocks } = parseCodeBlocksAndContent(
    message.content,
    message.id
  )
  return {
    message: {
      ...message,
      content: parsedContent
    },
    fileItems: message.file_items?.map(item => item.id) || [],
    codeBlocks
  }
}

export const reconstructContentWithCodeBlocks = (
  parsedContent: string,
  codeBlocks: CodeBlock[]
): string => {
  let reconstructedContent = parsedContent

  codeBlocks.forEach((block, index) => {
    const placeholder = `[CODE_BLOCK_${index}]`
    const codeBlockContent = `\`\`\`${block.language}${block.filename ? `\n#filename=${block.filename}#` : ""}\n${block.code}\n\`\`\``
    reconstructedContent = reconstructedContent.replace(
      placeholder,
      codeBlockContent
    )
  })

  return reconstructedContent
}

export const reconstructContentWithCodeBlocksInChatMessage = (
  chatMessage: ChatMessage
): ChatMessage => {
  return {
    ...chatMessage,
    message: {
      ...chatMessage.message,
      content: reconstructContentWithCodeBlocks(
        chatMessage.message.content,
        chatMessage.codeBlocks ?? []
      )
    }
  }
}
