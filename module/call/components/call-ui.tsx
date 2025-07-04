import { useState } from "react";
import { CallActive } from "./call-active";
import { CallEnd } from "./call-end";
import { CallLobby } from "./call-lobby";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useAgentCall } from "@/lib/useAgentCall";

interface Props {
  meetingId: string;
  meetingName: string;
  userName: string;
  userImage: string;
  agentName: string;
  agentImage: string;
  agentInstructions: string;
}

export const CallUI = ({
  meetingId,
  meetingName,
  userName,
  userImage,
  agentName,
  agentImage,
  agentInstructions,
}: Props) => {
  const [show, setShow] = useState<"call" | "ended" | "lobby">("lobby");

  const router = useRouter();

  const handleJoin = async () => {
    try {
      const res = await fetch("/api/meeting-status", {
        method: "POST",
        body: JSON.stringify({ meetingId, status: "active" }),
      });

      const result = await res.json();

      if (!res.ok) {
        toast.error("Failed to join meeting", result.error);
        router.push(`/meetings/${meetingId}`);
        return;
      }

      setShow("call");
    } catch (err) {
      console.error("Join error", err);
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
          onLeave={()=>setShow("ended")}
        />
      )}
      {show === "ended" && <CallEnd />}
    </div>
  );
};
