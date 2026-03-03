import { useEffect, useState, useRef, useCallback } from "react";
import SpeechToText from "speech-to-text";
import debounce from "lodash/debounce";
import { useTRPC } from "@/trpc/client";
import { useMutation } from "@tanstack/react-query";

interface UseAgentCallProps {
  userName: string;
  agentName: string;
  agentInstructions: string;
  inCall: boolean;
  onMessageComplete?: (msg: string) => void;
  conversationHistory?: {
    role: "user" | "assistant";
    content: string;
    timestamp: string;
  }[];
  browserSpeak: (text: string, voiceId?: string) => Promise<void>;
  browserStop: () => void;
  voiceId?: string;
}

export const useAgentCall = ({
  agentName,
  agentInstructions,
  inCall,
  onMessageComplete,
  conversationHistory,
  browserSpeak,
  browserStop,
  voiceId,
}: UseAgentCallProps) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [messages, setMessages] = useState<
    { role: "user" | "assistant"; content: string; timestamp: string }[]
  >([]);

  const trpc = useTRPC();

  const agentRespondMutation = useMutation(
    trpc.meetings.agentRespond.mutationOptions({}),
  );

  const processSummaryMutation = useMutation(
    trpc.meetings.processSummary.mutationOptions({}),
  );

  const saveMeetingStateMutation = useMutation(
    trpc.meetings.saveMeetingState.mutationOptions({}),
  );

  const listenerRef = useRef<SpeechToText | null>(null);
  const isSpeakingRef = useRef(false);
  const conversationHistoryRef = useRef<
    { role: "user" | "assistant"; content: string; timestamp: string }[]
  >([]);
  const callStartTimeRef = useRef<number | null>(null);

  const finalTextTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const lastFinalTextRef = useRef<string | null>(null);

  const stopListening = () => {
    try {
      listenerRef.current?.stopListening();
    } catch (e) {
      console.warn("Stop called on non-started recognizer:", e);
    }
    setIsListening(false);
    setIsUserSpeaking(false);
  };

  const getCallTimestamp = () => {
    if (!callStartTimeRef.current) return "00:00";
    const elapsedMs = Date.now() - callStartTimeRef.current;
    const seconds = Math.floor(elapsedMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  };

  const getMaxTimestampInHistory = (
    history: { timestamp: string }[],
  ): number => {
    let maxSeconds = 0;
    history.forEach((msg) => {
      if (msg.timestamp) {
        const [min, sec] = msg.timestamp.split(":").map(Number);
        const totalSec = min * 60 + sec;
        if (totalSec > maxSeconds) maxSeconds = totalSec;
      }
    });
    return maxSeconds;
  };

  const speak = async (fullText: string) => {
    try {
      browserStop();
      isSpeakingRef.current = true;
      setIsSpeaking(true);
      stopListening();

      await browserSpeak(fullText, voiceId);

      isSpeakingRef.current = false;
      setIsSpeaking(false);
      debouncedStartListening();
    } catch (error) {
      console.error("Error in speak function:", error);
      isSpeakingRef.current = false;
      setIsSpeaking(false);
      debouncedStartListening();
    }
  };

  const fetchAgentResponse = async (userText: string) => {
    const userEntry = {
      role: "user" as const,
      content: userText,
      timestamp: getCallTimestamp(),
    };
    conversationHistoryRef.current.push(userEntry);
    setMessages((prev) => [...prev, userEntry]);

    try {
      const result = await agentRespondMutation.mutateAsync({
        agentName,
        agentInstructions,
        conversationHistory: conversationHistoryRef.current,
      });

      const fullAgentText = result.text;

      const agentEntry = {
        role: "assistant" as const,
        content: fullAgentText,
        timestamp: getCallTimestamp(),
      };
      conversationHistoryRef.current.push(agentEntry);
      setMessages((prev) => [...prev, agentEntry]);

      speak(fullAgentText);
      onMessageComplete?.(fullAgentText);
    } catch (error) {
      console.error("Error fetching agent response:", error);
      isSpeakingRef.current = false;
      setIsSpeaking(false);
      debouncedStartListening();
    }
  };

  const rawStartListening = () => {
    if (!inCall || isListening || isSpeakingRef.current) return;
    setIsUserSpeaking(true);

    if (listenerRef.current) {
      try {
        listenerRef.current.startListening();
        setIsListening(true);
      } catch (err) {
        console.warn("startListening already in progress", err);
      }
      return;
    }

    try {
      const listener = new SpeechToText(
        (finalText: string) => {
          if (!finalText) return;

          lastFinalTextRef.current = finalText;

          if (finalTextTimeoutRef.current) {
            clearTimeout(finalTextTimeoutRef.current);
          }

          finalTextTimeoutRef.current = setTimeout(() => {
            const userText = lastFinalTextRef.current;
            if (!userText) return;

            browserStop();
            isSpeakingRef.current = false;
            setIsSpeaking(false);

            stopListening();
            fetchAgentResponse(userText);

            lastFinalTextRef.current = null;
            finalTextTimeoutRef.current = null;
          }, 1500);
        },
        () => {
          if (inCall && !isSpeakingRef.current) {
            debouncedStartListening();
          }
        },
        () => {},
      );

      listenerRef.current = listener;
      listener.startListening();
      setIsListening(true);
    } catch (error) {
      console.error("Speech recognition setup error:", error);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedStartListening = useCallback(
    debounce(rawStartListening, 300),
    [inCall, isListening],
  );

  const onCallEnd = async ({ meetingId }: { meetingId: string }) => {
    try {
      // Stop all voice-related activities
      stopListening();
      browserStop();
      isSpeakingRef.current = false;
      setIsSpeaking(false);
      setIsListening(false);
      setIsUserSpeaking(false);

      // Clear all timeouts and listeners
      if (finalTextTimeoutRef.current) {
        clearTimeout(finalTextTimeoutRef.current);
        finalTextTimeoutRef.current = null;
      }

      if (listenerRef.current) {
        listenerRef.current.stopListening();
        listenerRef.current = null;
      }

      // Save conversation history and process summary
      await processSummaryMutation.mutateAsync({
        meetingId,
        conversationHistory: conversationHistoryRef.current,
      });

      // Reset all refs
      conversationHistoryRef.current = [];
      callStartTimeRef.current = null;
      setMessages([]);
    } catch (error) {
      console.error("Error sending conversation history:", error);
    }
  };

  const onCallHold = async ({ meetingId }: { meetingId: string }) => {
    try {
      // Stop voice activities before saving
      stopListening();
      browserStop();
      isSpeakingRef.current = false;
      setIsSpeaking(false);

      if (finalTextTimeoutRef.current) {
        clearTimeout(finalTextTimeoutRef.current);
        finalTextTimeoutRef.current = null;
      }

      if (listenerRef.current) {
        listenerRef.current.stopListening();
        listenerRef.current = null;
      }

      await saveMeetingStateMutation.mutateAsync({
        meetingId,
        conversationHistory: conversationHistoryRef.current,
      });
    } catch (error) {
      console.error("Error sending conversation history:", error);
    }
  };

  useEffect(() => {
    if (inCall) {
      let offsetSeconds = 0;
      if (conversationHistory && conversationHistory.length > 0) {
        conversationHistoryRef.current = [...conversationHistory];
        offsetSeconds = getMaxTimestampInHistory(conversationHistory);
      }
      callStartTimeRef.current = Date.now() - offsetSeconds * 1000;

      const greeting =
        conversationHistory && conversationHistory.length > 0
          ? "Hello, shall we continue?"
          : `Hello, I am ${agentName}, here to help you out.`;

      const initial =
        conversationHistory && conversationHistory.length > 0
          ? [...conversationHistory]
          : [];
      initial.push({
        role: "assistant",
        content: greeting,
        timestamp: getCallTimestamp(),
      });
      setMessages(initial);

      speak(greeting);
    } else {
      // Complete cleanup when call ends
      stopListening();
      browserStop();
      isSpeakingRef.current = false;
      setIsSpeaking(false);
      setIsListening(false);
      setIsUserSpeaking(false);
      listenerRef.current?.stopListening();
      listenerRef.current = null;
      conversationHistoryRef.current = [];
      callStartTimeRef.current = null;
      setMessages([]);
      if (finalTextTimeoutRef.current) {
        clearTimeout(finalTextTimeoutRef.current);
        finalTextTimeoutRef.current = null;
      }
    }

    return () => {
      // Cleanup on unmount
      stopListening();
      browserStop();
      if (finalTextTimeoutRef.current) {
        clearTimeout(finalTextTimeoutRef.current);
        finalTextTimeoutRef.current = null;
      }
    };
  }, [inCall]);

  return {
    startListening: debouncedStartListening,
    stopListening,
    isListening,
    isSpeaking,
    isUserSpeaking,
    messages,
    onCallEnd,
    onCallHold,
  };
};
