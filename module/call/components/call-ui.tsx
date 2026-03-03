import { useState } from "react";
import { CallActive } from "./call-active";
import { CallEnd } from "./call-end";
import { CallLobby } from "./call-lobby";
import { CallHold } from "./call-hold";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useTRPC } from "@/trpc/client";
import { useMutation } from "@tanstack/react-query";

interface Props {
  meetingId: string;
  meetingName: string;
  userName: string;
  userImage: string;
  agentName: string;
  agentImage: string;
  agentInstructions: string;
  agentVoiceId: string;
  conversationHistory: string;
}

export const CallUI = ({
  meetingId,
  meetingName,
  userName,
  userImage,
  agentName,
  agentImage,
  agentInstructions,
  agentVoiceId,
  conversationHistory,
}: Props) => {
  const router = useRouter();
  const trpc = useTRPC();
  const [show, setShow] = useState<"call" | "ended" | "lobby" | "stalled">(
    "lobby",
  );

  const meetingStatusMutation = useMutation(
    trpc.meetings.meetingStatus.mutationOptions({}),
  );

  const handleJoin = async () => {
    try {
      const result = await meetingStatusMutation.mutateAsync({ meetingId });

      if (!result.success) {
        toast.error(result.message);
        router.push(`/meetings/${meetingId}`);
        return;
      }

      setShow("call");
    } catch (err) {
      console.error("Join error", err);
      toast.error("Failed to join meeting");
    }
  };

  return (
    <div className="h-full">
      {show === "lobby" && <CallLobby onJoin={handleJoin} />}
      {show === "call" && (
        <CallActive
          meetingId={meetingId}
          meetingName={meetingName}
          userName={userName}
          userImage={userImage}
          agentName={agentName}
          agentImage={agentImage}
          agentInstructions={agentInstructions}
          agentVoiceId={agentVoiceId}
          onLeave={() => setShow("ended")}
          onHold={() => setShow("stalled")}
          conversationHistory={
            conversationHistory ? JSON.parse(conversationHistory) : []
          }
        />
      )}
      {show === "ended" && <CallEnd />}
      {show === "stalled" && <CallHold />}
    </div>
  );
};
