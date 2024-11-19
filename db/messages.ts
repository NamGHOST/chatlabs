import { supabase } from "@/lib/supabase/browser-client"
import { Tables, TablesInsert, TablesUpdate } from "@/supabase/types"
import { LLM_LIST } from "@/lib/models/llm/llm-list"
import { PLAN_FREE } from "@/lib/subscription"
import { isUsingOwnKey } from "@/lib/utils"

export const getMessageById = async (messageId: string) => {
  const { data: message } = await supabase
    .from("messages")
    .select("*")
    .eq("id", messageId)
    .single()

  if (!message) {
    throw new Error("Message not found")
  }

  return message
}

export const getMessageCountForModel = async (
  userId: string,
  model: string,
  since?: Date
) => {
  if (!since) {
    // one day ago
    // clone date and set it to midnight
    since = new Date()
    since.setHours(0, 0, 0, 0)
  }

  const { count, error } = await supabase
    .from("messages")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .gt("created_at", since.toISOString())
    .eq("role", "user")
    .eq("model", model)

  if (error) {
    throw new Error(error.message)
  }

  return count
}

export const getMessageCount = async (since?: Date) => {
  if (!since) {
    // one day ago
    since = new Date(new Date().getTime() - 24 * 60 * 60 * 1000)
  }

  const { count, error } = await supabase
    .from("messages")
    .select("*", { count: "exact", head: true })
    .gt("created_at", since.toISOString())
    .eq("role", "user")

  if (error) {
    throw new Error(error.message)
  }

  return count
}

export const getMessagesByChatId = async (chatId: string) => {
  const { data: messages } = await supabase
    .from("messages")
    .select("*, file_items (*)")
    .eq("chat_id", chatId)

  if (!messages) {
    throw new Error("Messages not found")
  }

  return messages
}

export const createMessage = async (
  message: TablesInsert<"messages">,
  client = supabase
) => {
  const { data: createdMessage, error } = await client
    .from("messages")
    .insert([message])
    .select("*")
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return createdMessage
}

export const createMessages = async (
  messages: TablesInsert<"messages">[],
  client = supabase
) => {
  const { data: createdMessages, error } = await client
    .from("messages")
    .insert(messages)
    .select("*")

  if (error) {
    // throw new Error(error.message)
  }

  return createdMessages
}

export const updateMessage = async (
  messageId: string,
  message: TablesUpdate<"messages">
) => {
  const { data: updatedMessage, error } = await supabase
    .from("messages")
    .update(message)
    .eq("id", messageId)
    .select("*")
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return updatedMessage
}

export const deleteMessage = async (messageId: string) => {
  const { error } = await supabase.from("messages").delete().eq("id", messageId)

  if (error) {
    throw new Error(error.message)
  }

  return true
}

export async function deleteMessagesIncludingAndAfter(
  userId: string,
  chatId: string,
  sequenceNumber: number
) {
  const { error } = await supabase.rpc("delete_messages_including_and_after", {
    p_user_id: userId,
    p_chat_id: chatId,
    p_sequence_number: sequenceNumber
  })

  if (error) {
    return {
      error: "Failed to delete messages."
    }
  }

  return true
}

export const getMessageCountForTier = async (
  userId: string,
  tier: string,
  plan: string,
  provider?: string,
  subscriptionStartDate?: string,
  chatId?: string
) => {
  const whereClause = chatId
    ? { user_id: userId, chat_id: chatId }
    : { user_id: userId }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .single()

  if (!profile) {
    throw new Error("Profile not found")
  }

  // Get all models for this tier
  const tierModels = LLM_LIST.filter(x => x.tier === tier)

  // Get the current model being used
  const currentModel = provider
    ? tierModels.find(model => model.provider === provider)
    : undefined

  // Only exclude counting for models of the specific provider where user has API key
  const modelsToCount = tierModels.filter(model => {
    const providerKeyName =
      `${model.provider}_api_key` as keyof Tables<"profiles">
    return !(
      profile[providerKeyName] && model.provider === currentModel?.provider
    )
  })

  let since: Date
  if (plan === PLAN_FREE) {
    since = new Date()
    since.setUTCHours(0, 0, 0, 0)
  } else if (subscriptionStartDate) {
    // For paid plans, use the subscription start date
    since = new Date(subscriptionStartDate)
    const now = new Date()
    // If the subscription start date is more than a month ago, use the most recent monthly anniversary
    if (now.getTime() - since.getTime() > 30 * 24 * 60 * 60 * 1000) {
      since.setUTCMonth(now.getUTCMonth())
      since.setUTCFullYear(now.getUTCFullYear())
      if (since > now) {
        since.setUTCMonth(since.getUTCMonth() - 1)
      }
    }
  } else {
    // Fallback to first of the month if no subscription start date is set
    since = new Date()
    since.setUTCDate(1)
    since.setUTCHours(0, 0, 0, 0)
  }

  const { count } = await supabase
    .from("messages")
    .select("*", { count: "exact" })
    .eq("user_id", userId)
    .eq("role", "user")
    .in(
      "model",
      modelsToCount.map(m => m.modelId)
    )
    .gte("created_at", since.toISOString())

  return count || 0
}
