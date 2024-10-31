import { LLMID } from "./llms"

export interface MeetingParticipant {
  seatNumber: number
  llmId: LLMID | null
  name: string
  prompt: string
}

export interface MeetingSetupType {
  topic: string
  participants: MeetingParticipant[]
  currentTurn: number
  isActive: boolean
}

export const DEFAULT_MEETING_SEATS = 6
export const meetingSetupInitialState: MeetingSetupType = {
  topic: "",
  participants: [],
  currentTurn: 0,
  isActive: false
}
