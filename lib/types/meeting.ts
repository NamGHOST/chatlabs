export interface MeetingParticipant {
  seatNumber: number
  llmId: string
  name: string
  prompt: string
}

export interface SavedMeeting {
  id: string
  userId?: string
  topic: string
  participants: MeetingParticipant[]
  messages: Message[]
  createdAt: string
}

export interface Message {
  role: "user" | "assistant"
  content: string
  participantIndex: number
  senderName: string
}
