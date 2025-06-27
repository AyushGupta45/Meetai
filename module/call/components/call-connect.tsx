"use client";

import { CallUI } from "./call-ui";

interface Props {
  meetingId: string;
  meetingName: string;
  userId: string;
  userName: string;
  userImage: string;
  agentName: string;
  agentImage: string;
  agentInstructions: string;
}

export const CallConnect = ({
  meetingId,
  meetingName,
  userName,
  userImage,
  agentName,
  agentImage,
  agentInstructions,
}: Props) => {
  return (
    <CallUI
      meetingId={meetingId}
      meetingName={meetingName}
      userName={userName}
      userImage={userImage}
      agentName={agentName}
      agentImage={agentImage}
      agentInstructions={agentInstructions}
    />
  );
};
