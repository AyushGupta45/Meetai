"use client";

import { useEffect, useRef, useCallback, useState } from "react";

interface UseVadOptions {
  /** Called when speech segment ends with the audio float32 data */
  onSpeechEnd?: (audio: Float32Array) => void;
  /** Called when speech starts */
  onSpeechStart?: () => void;
  /** Whether VAD should be active */
  enabled?: boolean;
}

interface UseVadReturn {
  /** Whether VAD has been initialized */
  isReady: boolean;
  /** Whether user is currently speaking */
  isSpeaking: boolean;
  /** Start the VAD microphone */
  start: () => Promise<void>;
  /** Pause the VAD (keeps mic but stops detection) */
  pause: () => void;
  /** Resume the VAD */
  resume: () => void;
  /** Full cleanup — releases mic */
  destroy: () => void;
  /** The underlying MediaStream (for waveform) */
  stream: MediaStream | null;
}

export function useVad({
  onSpeechEnd,
  onSpeechStart,
  enabled = true,
}: UseVadOptions = {}): UseVadReturn {
  const [isReady, setIsReady] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const vadRef = useRef<any>(null);
  const onSpeechEndRef = useRef(onSpeechEnd);
  const onSpeechStartRef = useRef(onSpeechStart);
  const enabledRef = useRef(enabled);

  // Keep callback refs in sync
  useEffect(() => {
    onSpeechEndRef.current = onSpeechEnd;
  }, [onSpeechEnd]);

  useEffect(() => {
    onSpeechStartRef.current = onSpeechStart;
  }, [onSpeechStart]);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  const start = useCallback(async () => {
    if (vadRef.current) return;

    try {
      const { MicVAD } = await import("@ricky0123/vad-web");

      // Get mic stream ourselves so we can share it with waveform
      const micStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      setStream(micStream);

      const vad = await MicVAD.new({
        positiveSpeechThreshold: 0.6,
        negativeSpeechThreshold: 0.4,
        minSpeechMs: 250,
        redemptionMs: 400,
        preSpeechPadMs: 100,
        // Serve VAD assets from /public to avoid Next.js route interception
        baseAssetPath: "/",
        onnxWASMBasePath: "/",
        getStream: async () => micStream,
        onSpeechStart: () => {
          if (!enabledRef.current) return;
          setIsSpeaking(true);
          onSpeechStartRef.current?.();
        },
        onSpeechEnd: (audio: Float32Array) => {
          if (!enabledRef.current) return;
          setIsSpeaking(false);
          onSpeechEndRef.current?.(audio);
        },
      });

      vadRef.current = vad;
      vad.start();
      setIsReady(true);
    } catch (err) {
      console.error("VAD initialization failed:", err);
    }
  }, []);

  const pause = useCallback(() => {
    vadRef.current?.pause();
    setIsSpeaking(false);
  }, []);

  const resume = useCallback(() => {
    vadRef.current?.start();
  }, []);

  const destroy = useCallback(() => {
    if (vadRef.current) {
      vadRef.current.destroy();
      vadRef.current = null;
    }
    setStream((prev) => {
      if (prev) {
        prev.getTracks().forEach((t) => t.stop());
      }
      return null;
    });
    setIsReady(false);
    setIsSpeaking(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      destroy();
    };
  }, [destroy]);

  return { isReady, isSpeaking, start, pause, resume, destroy, stream };
}
