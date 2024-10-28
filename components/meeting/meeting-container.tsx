import { FC, useState } from "react"
import { MeetingSetupType } from "@/types/meeting"
import { MeetingSetup } from "./meeting-setup"
import { MeetingDiscussion } from "./meeting-discussion"

export const MeetingContainer: FC = () => {
  const [meetingSetup, setMeetingSetup] = useState<MeetingSetupType | null>(
    null
  )

  const handleStartMeeting = (setup: MeetingSetupType) => {
    setMeetingSetup({
      ...setup,
      currentTurn: 0,
      isActive: true
    })
  }

  const handleEndMeeting = () => {
    if (confirm("Are you sure you want to end this meeting?")) {
      setMeetingSetup(null)
    }
  }

  return (
    <div className="h-full">
      {!meetingSetup ? (
        <MeetingSetup onStartMeeting={handleStartMeeting} />
      ) : (
        <MeetingDiscussion
          setup={meetingSetup}
          onEndMeeting={handleEndMeeting}
        />
      )}
    </div>
  )
}
