import { useEffect, useState, useRef, useCallback } from "react";
import SpeechToText from "speech-to-text";
import debounce from "lodash/debounce";

interface UseAgentCallProps {
  userName: string;
  agentName: string;
  agentInstructions: string;
  inCall: boolean;
  onMessageComplete?: (msg: string) => void;
}

export const useAgentCall = ({
  userName,
  agentName,
  agentInstructions,
  inCall,
  onMessageComplete,
}: UseAgentCallProps) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const listenerRef = useRef<SpeechToText | null>(null);
  const speechQueueRef = useRef<string[]>([]);
  const isSpeakingRef = useRef(false);

  const conversationHistoryRef = useRef<{ role: "user" | "assistant"; content: string }[]>([]);
  const finalTextTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastFinalTextRef = useRef<string | null>(null);

  const stopListening = () => {
    try {
      listenerRef.current?.stopListening();
    } catch (e) {
      console.warn("Stop called on non-started recognizer:", e);
    }
    setIsListening(false);
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

    utterance.onend = () => {
      speakQueue(rest);
    };

    speechSynthesis.speak(utterance);
  };

  const speak = (fullText: string) => {
    speechSynthesis.cancel();
    isSpeakingRef.current = true;
    setIsSpeaking(true);

    const chunks = fullText.match(/[^\.!\?]+[\.!\?]+/g) || [fullText];
    speechQueueRef.current = chunks;
    speakQueue(chunks);
  };

  const fetchAgentResponse = async (userText: string) => {
    conversationHistoryRef.current.push({ role: "user", content: userText });

    const res = await fetch("/api/agent-stream", {
      method: "POST",
      body: JSON.stringify({
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

    conversationHistoryRef.current.push({ role: "assistant", content: fullAgentText.trim() });

    speak(fullAgentText.trim());
    onMessageComplete?.(fullAgentText.trim());
  };

  const rawStartListening = () => {
    if (!inCall || isListening || isSpeakingRef.current) return;

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
          if (!finalText || finalText.trim().split(" ").length < 2) return;

          // Save the latest final text
          lastFinalTextRef.current = finalText;

          // Clear any existing timeout
          if (finalTextTimeoutRef.current) {
            clearTimeout(finalTextTimeoutRef.current);
          }

          // Start new timeout to allow more speech
          finalTextTimeoutRef.current = setTimeout(() => {
            const userText = lastFinalTextRef.current;
            if (!userText) return;

            speechSynthesis.cancel();
            isSpeakingRef.current = false;
            setIsSpeaking(false);

            stopListening();
            fetchAgentResponse(userText);

            // Clean up
            lastFinalTextRef.current = null;
            finalTextTimeoutRef.current = null;
          }, 3000); // 3-second silence
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

  const debouncedStartListening = useCallback(debounce(rawStartListening, 300), [
    inCall,
    isListening,
  ]);

  useEffect(() => {
    if (inCall) {
      const greeting = `Hello ${userName}, I am ${agentName}, here to help you out.`;
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
  };
};
