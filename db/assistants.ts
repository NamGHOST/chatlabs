import { supabase } from "@/lib/supabase/browser-client"
import { Tables, TablesInsert, TablesUpdate } from "@/supabase/types"
import { SupabaseClient } from "@supabase/supabase-js"

export const getAssistantById = async (
  assistantId: string,
  client: SupabaseClient = supabase
) => {
  const { data: assistant, error } = await client
    .from("assistants")
    .select("*, messages (count)")
    .eq("id", assistantId)
    .single()

  if (!assistant) {
    throw new Error(error?.message)
  }

  return assistant
}

export const getAssistantByHashId = async (
  hashId: string,
  client: SupabaseClient = supabase
) => {
  const { data: assistant, error } = await client
    .from("assistants")
    .select("*")
    .eq("hashid", hashId)
    .single()

  if (!assistant) {
    throw new Error(error?.message)
  }

  return assistant
}

export const getAssistantWorkspacesByWorkspaceId = async (
  workspaceId: string
) => {
  const { data: workspace, error } = await supabase
    .from("workspaces")
    .select(
      `
      id,
      name,
      assistants (*)
    `
    )
    .eq("id", workspaceId)
    .single()

  if (!workspace) {
    throw new Error(error.message)
  }

  return workspace
}

export const getAssistantWorkspacesOrderedByMessageCountDesc = async (
  userId: string,
  client: SupabaseClient = supabase
) => {
  const { data: assistants, error } = await client
    .from("assistants")
    .select("*, chats(count)", { count: "exact" })
    .eq("sharing", "private")
    .eq("chats.user_id", userId)
    .order("count", { ascending: false, referencedTable: "chats" })

  if (error) {
    throw new Error(error.message)
  }

  return assistants.sort((a, b) => b.chats[0].count - a.chats[0].count)
}

export const getPopularAssistants = async (
  userId: string,
  client: SupabaseClient = supabase
) => {
  const response = await fetch("/api/assistants")
  const data = await response.json()
  return data.assistants as Tables<"assistants">[]
}

export const getPublicAssistantsOrderedByMessageCountDesc = async (
  client: SupabaseClient = supabase
) => {
  const { data: assistants, error } = await client
    .from("assistants")
    .select("*, chats (count)", { count: "exact" })
    .eq("sharing", "public")
    .order("count", { ascending: false, referencedTable: "chats" })
  if (error) {
    throw new Error(error.message)
  }

  return assistants.sort((a, b) => b.chats[0].count - a.chats[0].count)
}

export const getAssistantWorkspacesByAssistantId = async (
  assistantId: string
) => {
  const { data: assistant, error } = await supabase
    .from("assistants")
    .select(
      `
      id, 
      name, 
      workspaces (*)
    `
    )
    .eq("id", assistantId)
    .single()

  if (!assistant) {
    throw new Error(error.message)
  }

  return assistant
}

export const createAssistant = async (
  assistant: TablesInsert<"assistants">,
  workspace_id: string
) => {
  const { data: createdAssistant, error } = await supabase
    .from("assistants")
    .insert([assistant])
    .select("*")
    .single()

  if (error) {
    throw new Error(error.message)
  }

  await createAssistantWorkspace({
    user_id: createdAssistant.user_id,
    assistant_id: createdAssistant.id,
    workspace_id
  })

  return createdAssistant
}

export const createAssistants = async (
  assistants: TablesInsert<"assistants">[],
  workspace_id: string
) => {
  const { data: createdAssistants, error } = await supabase
    .from("assistants")
    .insert(assistants)
    .select("*")

  if (error) {
    throw new Error(error.message)
  }

  await createAssistantWorkspaces(
    createdAssistants.map(assistant => ({
      user_id: assistant.user_id,
      assistant_id: assistant.id,
      workspace_id
    }))
  )

  return createdAssistants
}

export const createAssistantWorkspace = async (item: {
  user_id: string
  assistant_id: string
  workspace_id: string
}) => {
  const { data: createdAssistantWorkspace, error } = await supabase
    .from("assistant_workspaces")
    .insert([item])
    .select("*")
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return createdAssistantWorkspace
}

export const createAssistantWorkspaces = async (
  items: { user_id: string; assistant_id: string; workspace_id: string }[]
) => {
  const { data: createdAssistantWorkspaces, error } = await supabase
    .from("assistant_workspaces")
    .insert(items)
    .select("*")

  if (error) throw new Error(error.message)

  return createdAssistantWorkspaces
}

export const updateAssistant = async (
  assistantId: string,
  assistant: TablesUpdate<"assistants">
) => {
  const { data: updatedAssistant, error } = await supabase
    .from("assistants")
    .update(assistant)
    .eq("id", assistantId)
    .select("*")
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return updatedAssistant
}

export const deleteAssistant = async (assistantId: string) => {
  const { error } = await supabase
    .from("assistants")
    .delete()
    .eq("id", assistantId)

  if (error) {
    throw new Error(error.message)
  }

  return true
}

export const deleteAssistantWorkspace = async (
  assistantId: string,
  workspaceId: string
) => {
  const { error } = await supabase
    .from("assistant_workspaces")
    .delete()
    .eq("assistant_id", assistantId)
    .eq("workspace_id", workspaceId)

  if (error) throw new Error(error.message)

  return true
}
