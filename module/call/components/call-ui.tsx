import { useState } from "react";
import { CallActive } from "./call-active";
import { CallEnd } from "./call-end";
import { CallLobby } from "./call-lobby";
import { meetings } from "@/db/schema";
import { and, not, eq } from "drizzle-orm";
import { db } from "@/db";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

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

  const handleLeave = async () => {
   try {
      const res = await fetch("/api/meeting-status", {
        method: "POST",
        body: JSON.stringify({ meetingId, status: "processing" }),
      });

      const result = await res.json();

      if (!res.ok) {
        toast.error("Failed to leave the call", result.error);
        router.push(`/meetings/${meetingId}`);
        return;
      }

      setShow("ended");
    } catch (err) {
      console.error("Join error", err);
    }
  };

  return (
    <div className="h-full">
      {show === "lobby" && <CallLobby onJoin={handleJoin} />}
      {show === "call" && (
        <CallActive
          onLeave={handleLeave}
          meetingName={meetingName}
          userName={userName}
          userImage={userImage}
          agentName={agentName}
          agentImage={agentImage}
          agentInstructions={agentInstructions}
        />
      )}
      {show === "ended" && <CallEnd />}
    </div>
  );
};
