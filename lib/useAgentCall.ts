import { useEffect, useState, useRef, useCallback } from "react";
import SpeechToText from "speech-to-text";
import debounce from "lodash/debounce";

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
}

export const useAgentCall = ({
  userName,
  agentName,
  agentInstructions,
  inCall,
  onMessageComplete,
  conversationHistory,
}: UseAgentCallProps) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);

  const listenerRef = useRef<SpeechToText | null>(null);
  const speechQueueRef = useRef<string[]>([]);
  const isSpeakingRef = useRef(false);
  const conversationHistoryRef = useRef<
    { role: "user" | "assistant"; content: string; timestamp: string }[]
  >([]);
  const callStartTimeRef = useRef<number | null>(null);

  const finalTextTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
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

  const speakQueue = (chunks: string[]) => {
    if (chunks.length === 0) {
      isSpeakingRef.current = false;
      setIsSpeaking(false);
      debouncedStartListening();
      return;
    }

    const [current, ...rest] = chunks;
    const utterance = new SpeechSynthesisUtterance(current);
    utterance.lang = "en-US";

    utterance.onstart = () => {
      stopListening();
    };

    utterance.onend = () => {
      speakQueue(rest);
    };

    speechSynthesis.speak(utterance);
  };

  const speak = (fullText: string) => {
    speechSynthesis.cancel();
    isSpeakingRef.current = true;
    setIsSpeaking(true);

    const cleanedText = fullText
      .replace(/\*+/g, "")
      .replace(/#+\s*/g, "")
      .replace(/[_~`]+/g, "")
      .replace(/\[(.*?)\]\(.*?\)/g, "$1")
      .replace(/<\/?[^>]+(>|$)/g, "");

    const chunks = cleanedText.match(/[^\.!\?]+[\.!\?]+/g) || [cleanedText];
    speechQueueRef.current = chunks;
    speakQueue(chunks);
  };

  const fetchAgentResponse = async (userText: string) => {
    conversationHistoryRef.current.push({
      role: "user",
      content: userText,
      timestamp: getCallTimestamp(),
    });

    const res = await fetch("/api/agent-stream", {
      method: "POST",
      body: JSON.stringify({
        agentName,
        agentInstructions,
        conversationHistory: conversationHistoryRef.current,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    const reader = res.body?.getReader();
    const decoder = new TextDecoder();
    let fullAgentText = "";

    if (!reader) return;

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      fullAgentText += chunk;
    }

    conversationHistoryRef.current.push({
      role: "assistant",
      content: fullAgentText.trim(),
      timestamp: getCallTimestamp(),
    });

    speak(fullAgentText.trim());
    onMessageComplete?.(fullAgentText.trim());
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
        (finalText) => {
          if (!finalText) return;

          lastFinalTextRef.current = finalText;

          if (finalTextTimeoutRef.current) {
            clearTimeout(finalTextTimeoutRef.current);
          }

          finalTextTimeoutRef.current = setTimeout(() => {
            const userText = lastFinalTextRef.current;
            if (!userText) return;

            speechSynthesis.cancel();
            isSpeakingRef.current = false;
            setIsSpeaking(false);

            stopListening();
            fetchAgentResponse(userText);

            lastFinalTextRef.current = null;
            finalTextTimeoutRef.current = null;
          }, 3000);
        },
        () => {
          if (inCall && !isSpeakingRef.current) {
            debouncedStartListening();
          }
        },
        () => {}
      );

      listenerRef.current = listener;
      listener.startListening();
      setIsListening(true);
    } catch (error) {
      console.error("Speech recognition setup error:", error);
    }
  };

  const debouncedStartListening = useCallback(
    debounce(rawStartListening, 300),
    [inCall, isListening]
  );

  const onCallEnd = async ({ meetingId }: { meetingId: string }) => {
    try {
      const res = await fetch("/api/process-summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversationHistory: conversationHistoryRef.current,
          meetingId,
        }),
      });

      if (!res.ok) {
        console.error("Failed to send conversation history.");
      } else {
        console.log("Conversation history sent successfully.");
      }
    } catch (error) {
      console.error("Error sending conversation history:", error);
    }
  };

  const onCallHold = async ({ meetingId }: { meetingId: string }) => {
    try {
      const res = await fetch("/api/save-conversation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversationHistory: conversationHistoryRef.current,
          meetingId,
        }),
      });

      if (!res.ok) {
        console.error("Failed to send conversation history.");
      } else {
        console.log("Conversation history sent successfully.");
      }
    } catch (error) {
      console.error("Error sending conversation history:", error);
    }
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
    history: { timestamp: string }[]
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
      speak(greeting);
    } else {
      stopListening();
      speechSynthesis.cancel();
    }

    return () => {
      stopListening();
      speechSynthesis.cancel();

      if (finalTextTimeoutRef.current) {
        clearTimeout(finalTextTimeoutRef.current);
      }
    };
  }, [inCall]);

  return {
    startListening: debouncedStartListening,
    stopListening,
    isListening,
    isSpeaking,
    isUserSpeaking,
    onCallEnd,
    onCallHold,
  };
};
