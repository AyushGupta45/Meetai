import { useState } from "react";
import { CallActive } from "./call-active";
import { CallEnd } from "./call-end";
import { CallLobby } from "./call-lobby";
import { meetings } from "@/db/schema";
import { and, not, eq } from "drizzle-orm";
import { db } from "@/db";
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

  const handleJoin = async () => {
    try {
      const res = await fetch("/api/join-meeting", {
        method: "POST",
        body: JSON.stringify({ meetingId }),
      });

      const result = await res.json();

      if (!res.ok) {
        console.warn(result.error || "Failed to join meeting");
        return;
      }

      setShow("call");
    } catch (err) {
      console.error("Join error", err);
    }
  };

  const handleLeave = () => {
    // if (!call) return;

    // call.endCall();
    setShow("ended");
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
