import { useEffect, useRef, useState } from "react";

interface SpeakingDetectorOptions {
  enabled?: boolean;
  sourceNode?: MediaStream | AudioNode | null;
}

export const useSpeakingDetector = ({ enabled = false, sourceNode = null }: SpeakingDetectorOptions) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!enabled && !sourceNode) return;

    let animationFrame: number;

    const detectSpeaking = () => {
      if (!analyserRef.current) return;
      const data = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(data);
      const volume = data.reduce((a, b) => a + b, 0) / data.length;
      setIsSpeaking(volume > 10);
      animationFrame = requestAnimationFrame(detectSpeaking);
    };

    const setupAnalyser = (source: MediaStream | AudioNode) => {
      const audioCtx = new AudioContext();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;

      if (source instanceof MediaStream) {
        const streamSource = audioCtx.createMediaStreamSource(source);
        streamSource.connect(analyser);
        micStreamRef.current = source;
      } else {
        source.connect(analyser);
      }

      analyserRef.current = analyser;
      audioContextRef.current = audioCtx;
      detectSpeaking();
    };

    if (sourceNode) {
      setupAnalyser(sourceNode);
    } else if (enabled) {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => setupAnalyser(stream))
        .catch((err) => {
          console.error("Microphone error:", err);
        });
    }

    return () => {
      micStreamRef.current?.getTracks().forEach((track) => track.stop());
      audioContextRef.current?.close();
      cancelAnimationFrame(animationFrame);
      setIsSpeaking(false);
    };
  }, [enabled, sourceNode]);

  return { isSpeaking };
};
