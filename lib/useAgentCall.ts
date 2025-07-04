import { useEffect, useState, useRef, useCallback } from "react";
import SpeechToText from "speech-to-text";
import debounce from "lodash/debounce";

interface UseAgentCallProps {
  userName: string;
  agentName: string;
  agentInstructions: string;
  inCall: boolean;
  onMessageComplete?: (msg: string) => void;
  conversationHistory?: { role: "user" | "assistant"; content: string }[];
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
    { role: "user" | "assistant"; content: string }[]
  >([]);
  const finalTextTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const lastFinalTextRef = useRef<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const volumeCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

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
    conversationHistoryRef.current.push({ role: "user", content: userText });

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
    });

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

  const startUserSpeakingDetection = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;

      const micSource = audioContext.createMediaStreamSource(stream);
      micSource.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      micStreamRef.current = micSource;

      volumeCheckIntervalRef.current = setInterval(() => {
        analyser.getByteFrequencyData(dataArray);
        const volume = dataArray.reduce((a, b) => a + b) / dataArray.length;

        setIsUserSpeaking(volume > 20); // Adjust threshold as needed
      }, 200);
    } catch (err) {
      console.error("Error accessing microphone:", err);
    }
  };

  const stopUserSpeakingDetection = () => {
    if (volumeCheckIntervalRef.current) {
      clearInterval(volumeCheckIntervalRef.current);
    }

    audioContextRef.current?.close();
    audioContextRef.current = null;
    analyserRef.current = null;
    micStreamRef.current = null;
    setIsUserSpeaking(false);
  };

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

  useEffect(() => {
    if (inCall) {
      if (conversationHistory && conversationHistory.length > 0) {
        // Load conversation history
        conversationHistoryRef.current = [...conversationHistory];

        // Greet with continuation prompt
        const greeting = `Hello, shall we continue?`;
        speak(greeting);
      } else {
        const greeting = `Hello, I am ${agentName}, here to help you out.`;
        speak(greeting);
      }

      startUserSpeakingDetection();
    } else {
      stopListening();
      speechSynthesis.cancel();
      stopUserSpeakingDetection();
    }

    return () => {
      stopListening();
      speechSynthesis.cancel();
      stopUserSpeakingDetection();
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
