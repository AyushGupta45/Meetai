"use client";

import { useEffect, useRef, useCallback, useState } from "react";

interface UseWaveformOptions {
  /** The media stream to analyze (from VAD or getUserMedia) */
  stream: MediaStream | null;
  /** Whether the analyzer should actively update */
  enabled?: boolean;
  /** FFT size for the analyzer (must be power of 2). Defaults to 256. */
  fftSize?: number;
}

interface UseWaveformReturn {
  /** Ref to attach to a <canvas> element */
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  /** Current average volume level 0..1 */
  volume: number;
}

export function useWaveform({
  stream,
  enabled = true,
  fftSize = 256,
}: UseWaveformOptions): UseWaveformReturn {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [volume, setVolume] = useState(0);

  const animFrameRef = useRef<number>(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  const draw = useCallback(() => {
    const analyser = analyserRef.current;
    const canvas = canvasRef.current;
    if (!analyser || !canvas || !enabled) {
      animFrameRef.current = requestAnimationFrame(draw);
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);

    // Calculate average volume
    const avg = dataArray.reduce((a, b) => a + b, 0) / bufferLength / 255;
    setVolume(avg);

    // Draw waveform bars
    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);

    const barCount = Math.min(bufferLength, 32);
    const barWidth = width / barCount;
    const gap = 2;

    for (let i = 0; i < barCount; i++) {
      const barHeight = (dataArray[i] / 255) * height;
      const x = i * barWidth;

      // Gradient from cyan to blue
      const hue = 190 + (i / barCount) * 40;
      ctx.fillStyle = `hsla(${hue}, 80%, 60%, 0.9)`;
      ctx.fillRect(x + gap / 2, height - barHeight, barWidth - gap, barHeight);
    }

    animFrameRef.current = requestAnimationFrame(draw);
  }, [enabled]);

  useEffect(() => {
    if (!stream) return;

    const audioCtx = new AudioContext();
    const source = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = fftSize;
    analyser.smoothingTimeConstant = 0.8;
    source.connect(analyser);

    audioCtxRef.current = audioCtx;
    sourceRef.current = source;
    analyserRef.current = analyser;

    animFrameRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      source.disconnect();
      analyser.disconnect();
      audioCtx.close().catch(() => {});
      audioCtxRef.current = null;
      sourceRef.current = null;
      analyserRef.current = null;
      setVolume(0);
    };
  }, [stream, fftSize, draw]);

  return { canvasRef, volume };
}
