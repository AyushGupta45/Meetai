"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { twMerge } from "tailwind-merge";
import { useAgentCall } from "@/lib/useAgentCall";
import { MicIcon, MicOff } from "lucide-react";
import { useRouter } from "next/navigation";

interface Props {
  meetingId: string;
  meetingName: string;
  userName: string;
  userImage: string;
  agentName: string;
  agentImage: string;
  agentInstructions: string;
  onLeave: () => void;
  onHold: () => void;
  conversationHistory?: { role: "user" | "assistant"; content: string, "timestamp": string }[];
}

export const CallActive = ({
  onLeave,
  onHold,
  meetingId,
  meetingName,
  userName,
  userImage,
  agentName,
  agentImage,
  agentInstructions,
  conversationHistory,
}: Props) => {
  const [inCall, setInCall] = useState(true);

  const {
    isSpeaking: isAgentSpeaking,
    isUserSpeaking,
    onCallEnd,
    onCallHold,
  } = useAgentCall({
    userName,
    agentName,
    agentInstructions,
    inCall,
    conversationHistory,
    onMessageComplete: (finalReply) => {
      console.log("✅ Agent Finished Speaking:", finalReply);
    },
  });

  useEffect(() => {
    const checkMicPermission = async () => {
      try {
        const permissionStatus = await navigator.permissions.query({
          name: "microphone" as PermissionName,
        });

        if (permissionStatus.state === "granted") {
        } else if (permissionStatus.state === "prompt") {
          try {
            await navigator.mediaDevices.getUserMedia({ audio: true });
          } catch {
            alert("Microphone access is required to continue.");
          }
        } else if (permissionStatus.state === "denied") {
          alert(
            "Microphone access is blocked. Please enable it from browser settings."
          );
        }
      } catch (err) {
        console.error("Permission check failed:", err);
      }
    };

    checkMicPermission();
  }, []);

  const handleLeave = async () => {
    setInCall(false);
    onLeave();
    await onCallEnd({ meetingId });
  };

  const handleHold = async () => {
    setInCall(false);
    onHold();
    await onCallHold({ meetingId });
  };

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      handleHold();
      event.preventDefault();
    };

    const handleRouteChange = () => {
      handleHold();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("popstate", handleRouteChange);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handleRouteChange);
    };
  }, []);

  const SpeakingBars = ({ active }: { active: boolean }) =>
    active ? (
      <span className="flex items-center gap-0.5 ml-2">
        <span className="w-1 h-2 bg-blue-400 animate-wave1 rounded-sm" />
        <span className="w-1 h-3 bg-blue-400 animate-wave2 rounded-sm" />
        <span className="w-1 h-2 bg-blue-400 animate-wave3 rounded-sm" />
      </span>
    ) : (
      <span className="flex items-center gap-0.5 ml-2">
        <span className="w-1 h-1 bg-blue-400 rounded-sm" />
        <span className="w-1 h-1 bg-blue-400 rounded-sm" />
        <span className="w-1 h-1 bg-blue-400 rounded-sm" />
      </span>
    );

  return (
    <div className="flex flex-col justify-between p-4 h-full text-white">
      {/* Top Bar */}
      <div className="bg-[#101213] rounded-full p-4 flex items-center justify-between gap-4">
        <div className="flex justify-center items-center gap-3">
          <div className="flex items-center justify-center p-1 bg-white/10 rounded-full w-fit">
            <Image src="/logo.svg" width={22} height={22} alt="Logo" />
          </div>
          <h4 className="text-lg">{meetingName}</h4>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleHold} variant="secondary">
            Hold Meeting
          </Button>
          <Button onClick={handleLeave} variant="destructive">
            Leave Meeting
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col items-center justify-center gap-6 flex-1">
        {/* Agent Card */}
        <Card
          className={twMerge(
            "w-full sm:w-3/4 md:w-2/4 h-[350px] bg-[#161e25] rounded-lg flex items-center justify-center shadow-md border-2 relative transition-all duration-150",
            isAgentSpeaking ? "border-green-500" : "border-black"
          )}
        >
          <Image
            src={agentImage}
            width={90}
            height={90}
            alt={agentName}
            className="object-cover rounded-full"
          />
          <div className="absolute bottom-0 left-0 bg-[#101213] rounded-bl-lg rounded-tr-sm flex items-center px-2 py-1">
            <p className="text-white text-xs">{agentName}</p>
            <SpeakingBars active={isAgentSpeaking} />
          </div>
        </Card>

        {/* User Card */}
        <Card
          className={twMerge(
            "w-full sm:w-3/4 md:w-1/5 h-[150px] bg-[#161e25] rounded-lg flex items-center justify-center shadow-md border-2 relative transition-all duration-150",
            isUserSpeaking ? "border-blue-500" : "border-black"
          )}
        >
          <Image
            src={userImage}
            width={90}
            height={90}
            alt={userName}
            className="object-cover rounded-full"
          />
          <div className="absolute bottom-0 left-0 bg-[#101213] rounded-bl-sm rounded-tr-sm flex items-center px-2 py-1">
            <p className="text-white text-xs">{userName}</p>
            <SpeakingBars active={isUserSpeaking} />
          </div>

          <div className="absolute top-0 right-0 rounded-bl-sm rounded-tr-sm flex items-center px-2 py-1 text-white">
            {isUserSpeaking ? <MicIcon size={20} /> : <MicOff size={20} />}
          </div>
        </Card>
      </div>
    </div>
  );
};
