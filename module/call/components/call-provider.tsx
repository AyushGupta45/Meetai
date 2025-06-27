"use client";

import { authClient } from "@/lib/auth-client";
import { LoaderIcon } from "lucide-react";
import { CallConnect } from "./call-connect";
import { GeneratedAvatarUri } from "@/lib/avatar";

interface Props {
  meetingId: string;
  meetingName: string;
  agentName: string;
  agentInstructions: string;
}

export const CallProvider = ({ meetingId, meetingName, agentName, agentInstructions }: Props) => {
  const { data, isPending } = authClient.useSession();

  if (!data || isPending) {
    return (
      <div className="flex h-screen items-center justify-center bg-radial from-sidebar-accent-to-sidebar">
        <LoaderIcon className="size-6 animate-spin text-white" />
      </div>
    );
  }

  return (
    <CallConnect
      meetingId={meetingId}
      meetingName={meetingName}
      userId={data.user.id}
      userName={data.user.name}
      userImage={
        data.user.image ??
        GeneratedAvatarUri({ seed: data.user.name, variant: "initials" })
      }
      agentName={agentName}
      agentImage={GeneratedAvatarUri({ seed: agentName, variant: "botttsNeutral" })}
      agentInstructions={agentInstructions}
    />
  );
};
