"use client";

import { useEffect, useRef, useState } from "react";

type UseSmartAudioOpts = {
  iaSpeaking: boolean;                 // si la IA está locutando (para ducking)
  onUserSpeechStart?: () => void;      // barge-in: cortar TTS al detectar voz humana
  vadThresholdRms?: number;            // umbral VAD (por defecto 0.02)
  vadMinActiveMs?: number;             // ms mínimos de voz para considerar “hablando”
  vadHangMs?: number;                  // ms de hangover tras bajar de umbral
  duckingDb?: number;                  // atenuación cuando habla la IA (por defecto -9 dB)
};

export function useSmartAudio({
  iaSpeaking,
  onUserSpeechStart,
  vadThresholdRms = 0.02,
  vadMinActiveMs = 150,
  vadHangMs = 200,
  duckingDb = -9,
}: UseSmartAudioOpts) {
  const [micLevel, setMicLevel] = useState(0); // 0..1 (solo UI)
  const [vadActive, setVadActive] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [supported, setSupported] = useState<boolean>(true);

  const streamRef = useRef<MediaStream | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const procRef = useRef<ScriptProcessorNode | null>(null);
  const lastActiveTsRef = useRef<number>(0);
  const firstOverTsRef = useRef<number | null>(null);

  // Ducking: convierte dB a factor lineal (0..1)
  const duckingGain = iaSpeaking ? Math.pow(10, duckingDb / 20) : 1;

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          setSupported(false);
          setLastError("getUserMedia no soportado");
          return;
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: false,
          },
        });
        if (!mounted) return;

        streamRef.current = stream;

        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        ctxRef.current = ctx;

        const source = ctx.createMediaStreamSource(stream);
        // Nota: ScriptProcessor está deprecado pero sigue siendo soportado de forma amplia.
        const proc = ctx.createScriptProcessor(1024, 1, 1);
        procRef.current = proc;

        const analyser = ctx.createAnalyser();
        analyser.fftSize = 2048;
        const buf = new Float32Array(analyser.fftSize);

        source.connect(analyser);
        analyser.connect(proc);
        proc.connect(ctx.destination);

        proc.onaudioprocess = () => {
          analyser.getFloatTimeDomainData(buf);
          let sum = 0;
          for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
          const rms = Math.sqrt(sum / buf.length);

          // Nivel normalizado para UI
          const db = 20 * Math.log10(rms + 1e-6);
          const norm = Math.min(1, Math.max(0, (db + 60) / 60)); // ~[-60..0] dB → [0..1]
          setMicLevel(norm);

          const now = performance.now();
          if (rms > vadThresholdRms) {
            if (firstOverTsRef.current === null) firstOverTsRef.current = now;
            const overMs = now - firstOverTsRef.current;
            if (overMs >= vadMinActiveMs && !vadActive) {
              setVadActive(true);
              lastActiveTsRef.current = now;
              onUserSpeechStart?.(); // barge-in
            }
          } else {
            firstOverTsRef.current = null;
            if (vadActive) {
              // hangover para no cortar entre palabras
              if (now - lastActiveTsRef.current >= vadHangMs) {
                setVadActive(false);
              }
            }
          }
          if (vadActive) lastActiveTsRef.current = now;
        };
      } catch (err: any) {
        if (!mounted) return;
        setLastError(err?.message ?? String(err));
      }
    }

    init();

    return () => {
      mounted = false;
      try {
        procRef.current?.disconnect();
      } catch {}
      try {
        ctxRef.current?.close();
      } catch {}
      try {
        streamRef.current?.getTracks().forEach((t) => t.stop());
      } catch {}
    };
  }, [onUserSpeechStart, vadThresholdRms, vadMinActiveMs, vadHangMs]);

  return {
    sttSupported: supported,
    lastError,
    micLevel,         // 0..1 para tu VU
    vadActive,        // voz humana detectada (para lógica)
    duckingGain,      // 0..1 para atenuar lo que envías al STT cuando habla la IA
    stream: streamRef.current, // MediaStream crudo del micro (para Deepgram/WebRTC)
  };
}
