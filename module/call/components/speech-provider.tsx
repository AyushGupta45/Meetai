"use client";

import {
  createContext,
  useContext,
  useRef,
  useCallback,
  useState,
  useEffect,
  type ReactNode,
} from "react";

interface SpeechContextValue {
  speak: (text: string, voiceId?: string) => Promise<void>;
  stop: () => void;
  isSpeaking: boolean;
  voices: SpeechSynthesisVoice[];
}

const SpeechContext = createContext<SpeechContextValue | null>(null);

export function useSpeech() {
  const ctx = useContext(SpeechContext);
  if (!ctx) {
    throw new Error("useSpeech must be used within a SpeechProvider");
  }
  return ctx;
}

export function SpeechProvider({ children }: { children: ReactNode }) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const resolveRef = useRef<(() => void) | null>(null);

  // Load available voices
  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    const loadVoices = () => {
      const available = window.speechSynthesis.getVoices();
      if (available.length > 0) {
        setVoices(available);
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const stop = useCallback(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    if (resolveRef.current) {
      resolveRef.current();
      resolveRef.current = null;
    }
  }, []);

  const speak = useCallback(
    async (text: string, voiceId?: string) => {
      if (typeof window === "undefined" || !window.speechSynthesis) return;

      // Stop any current playback
      stop();

      // Clean markdown formatting
      const cleanedText = text
        .replace(/\*+/g, "")
        .replace(/#+\s*/g, "")
        .replace(/[_~`]+/g, "")
        .replace(/\[(.*?)\]\(.*?\)/g, "$1")
        .replace(/<\/?[^>]+(>|$)/g, "");

      if (!cleanedText.trim()) return;

      return new Promise<void>((resolve) => {
        resolveRef.current = resolve;

        const utterance = new SpeechSynthesisUtterance(cleanedText);

        // Find matching voice by name
        if (voiceId) {
          const availableVoices = window.speechSynthesis.getVoices();
          const match = availableVoices.find((v) => v.name === voiceId);
          if (match) {
            utterance.voice = match;
          }
        }

        utterance.rate = 1;
        utterance.pitch = 1;

        utterance.onstart = () => {
          setIsSpeaking(true);
        };

        utterance.onend = () => {
          setIsSpeaking(false);
          resolveRef.current = null;
          resolve();
        };

        utterance.onerror = (event) => {
          if (event.error !== "canceled" && event.error !== "interrupted") {
            console.error("SpeechSynthesis error:", event.error);
          }
          setIsSpeaking(false);
          resolveRef.current = null;
          resolve();
        };

        window.speechSynthesis.speak(utterance);
      });
    },
    [stop],
  );

  return (
    <SpeechContext.Provider value={{ speak, stop, isSpeaking, voices }}>
      {children}
    </SpeechContext.Provider>
  );
}
