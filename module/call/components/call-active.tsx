"use client";

import Image from "next/image";
import { useEffect, useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { twMerge } from "tailwind-merge";
import { useAgentCall } from "@/lib/useAgentCall";
import { PhoneOff, PauseIcon, ScrollTextIcon, ClockIcon } from "lucide-react";
import { useSpeech } from "./speech-provider";
import { useVad } from "../hooks/use-vad";
import { useWaveform } from "../hooks/use-waveform";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Props {
  meetingId: string;
  meetingName: string;
  userName: string;
  userImage: string;
  agentName: string;
  agentImage: string;
  agentInstructions: string;
  agentVoiceId: string;
  onLeave: () => void;
  onHold: () => void;
  conversationHistory?: {
    role: "user" | "assistant";
    content: string;
    timestamp: string;
  }[];
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
  agentVoiceId,
  conversationHistory,
}: Props) => {
  const [inCall, setInCall] = useState(true);
  const [showTranscript, setShowTranscript] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  const {
    speak: browserSpeak,
    stop: browserStop,
    isSpeaking: browserIsSpeaking,
  } = useSpeech();

  const {
    isSpeaking: isAgentSpeaking,
    isUserSpeaking,
    messages,
    onCallEnd,
    onCallHold,
  } = useAgentCall({
    userName,
    agentName,
    agentInstructions,
    inCall,
    conversationHistory,
    onMessageComplete: () => {},
    browserSpeak,
    browserStop,
    voiceId: agentVoiceId,
  });

  // VAD for visual indicators only (waveform + speaking glow)
  const {
    isSpeaking: vadSpeaking,
    start: vadStart,
    destroy: vadDestroy,
    stream: micStream,
  } = useVad({
    enabled: inCall,
  });

  // Waveform from mic stream
  const { canvasRef } = useWaveform({
    stream: micStream,
    enabled: inCall,
  });

  // Start VAD when call begins
  useEffect(() => {
    if (inCall) {
      vadStart();
    }
  }, [inCall, vadStart]);

  // Duration timer
  useEffect(() => {
    if (!inCall) return;
    const interval = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [inCall]);

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleLeave = useCallback(async () => {
    setInCall(false);
    vadDestroy();
    onLeave();
    await onCallEnd({ meetingId });
  }, [meetingId, onCallEnd, onLeave, vadDestroy]);

  const handleHold = useCallback(async () => {
    setInCall(false);
    vadDestroy();
    onHold();
    await onCallHold({ meetingId });
  }, [meetingId, onCallHold, onHold, vadDestroy]);

  // Before-unload & popstate handlers
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
  }, [handleHold]);

  // Status text
  const getStatus = () => {
    if (isAgentSpeaking || browserIsSpeaking) return `${agentName} is speaking`;
    if (isUserSpeaking || vadSpeaking) return "Listening...";
    return "Ready";
  };

  return (
    <div className="flex flex-col h-full text-white select-none">
      {/* Top bar */}
      <div className="flex items-center justify-between px-3 sm:px-6 py-3 bg-white/5 backdrop-blur-sm border-b border-white/10">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Image
            src="/logo.svg"
            width={20}
            height={20}
            alt="Logo"
            className="shrink-0"
          />
          <span className="text-sm font-medium truncate max-w-[120px] sm:max-w-[200px]">
            {meetingName}
          </span>
          <span className="text-xs text-white/50 tabular-nums flex items-center gap-1 shrink-0">
            <ClockIcon className="size-3" />
            {String(Math.floor(elapsed / 60)).padStart(2, "0")}:
            {String(elapsed % 60).padStart(2, "0")}
          </span>
        </div>
        <div className="flex gap-1.5 sm:gap-2 shrink-0">
          <Button
            size="sm"
            variant={showTranscript ? "default" : "secondary"}
            onClick={() => setShowTranscript((v) => !v)}
            className="gap-1.5"
          >
            <ScrollTextIcon className="size-3.5" />
            <span className="hidden sm:inline">Transcript</span>
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={handleHold}
            className="gap-1.5"
          >
            <PauseIcon className="size-3.5" />
            <span className="hidden sm:inline">Hold</span>
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={handleLeave}
            className="gap-1.5"
          >
            <PhoneOff className="size-3.5" />
            <span className="hidden sm:inline">Leave</span>
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Center column */}
        <div className="flex-1 flex flex-col items-center justify-center gap-6 sm:gap-8 px-4 sm:px-6 py-6 sm:py-8">
          {/* Avatar pair */}
          <div className="flex items-center gap-8 sm:gap-12">
            {/* Agent avatar */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <div
                  className={twMerge(
                    "absolute -inset-2 rounded-full transition-all duration-300",
                    isAgentSpeaking || browserIsSpeaking
                      ? "bg-blue-500/30 animate-pulse ring-2 ring-blue-400/60"
                      : "bg-transparent",
                  )}
                />
                <Image
                  src={agentImage}
                  width={96}
                  height={96}
                  alt={agentName}
                  className="relative rounded-full object-cover ring-2 ring-white/20 size-16 sm:size-24"
                />
              </div>
              <span className="text-sm font-medium">{agentName}</span>
            </div>

            {/* User avatar */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <div
                  className={twMerge(
                    "absolute -inset-2 rounded-full transition-all duration-300",
                    isUserSpeaking || vadSpeaking
                      ? "bg-green-500/30 animate-pulse ring-2 ring-green-400/60"
                      : "bg-transparent",
                  )}
                />
                <Image
                  src={userImage}
                  width={96}
                  height={96}
                  alt={userName}
                  className="relative rounded-full object-cover ring-2 ring-white/20 size-16 sm:size-24"
                />
              </div>
              <span className="text-sm font-medium">{userName}</span>
            </div>
          </div>

          {/* Status indicator */}
          <div className="flex items-center gap-2 text-sm text-white/60">
            <span>{getStatus()}</span>
          </div>

          {/* Waveform visualizer */}
          <canvas
            ref={canvasRef}
            width={320}
            height={48}
            className="w-60 sm:w-80 h-12 rounded-lg opacity-70"
          />
        </div>

        {/* Live transcript panel */}
        {showTranscript && (
          <div className="absolute inset-0 sm:relative sm:inset-auto w-full sm:w-80 border-l border-white/10 bg-black/95 sm:bg-white/5 flex flex-col z-10">
            <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ScrollTextIcon className="size-4 text-blue-400" />
                <span className="text-xs font-semibold uppercase tracking-wider text-white/60">
                  Live Transcript
                </span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="sm:hidden text-white/60 hover:text-white"
                onClick={() => setShowTranscript(false)}
              >
                Close
              </Button>
            </div>
            <ScrollArea className="flex-1 px-4 py-3">
              <div className="space-y-3">
                {messages.map((msg, i) => (
                  <div key={i} className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={twMerge(
                          "text-[10px] font-bold uppercase tracking-wider",
                          msg.role === "assistant"
                            ? "text-blue-400"
                            : "text-green-400",
                        )}
                      >
                        {msg.role === "assistant" ? agentName : userName}
                      </span>
                      <span className="text-[10px] text-white/30">
                        {msg.timestamp}
                      </span>
                    </div>
                    <p className="text-xs text-white/80 leading-relaxed">
                      {msg.content}
                    </p>
                  </div>
                ))}
                <div ref={transcriptEndRef} />
              </div>
            </ScrollArea>
          </div>
        )}
      </div>

      {/* Bottom controls */}
      <div className="flex items-center justify-center gap-4 px-6 py-5 bg-white/5 backdrop-blur-sm border-t border-white/10">
        <Button
          size="lg"
          variant="destructive"
          className="rounded-full size-14"
          onClick={handleLeave}
        >
          <PhoneOff className="size-5" />
        </Button>
      </div>
    </div>
  );
};
