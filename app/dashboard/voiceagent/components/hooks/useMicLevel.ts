// app/dashboard/voiceagent/components/hooks/useMicLevel.ts
"use client";

import { useEffect, useRef, useState } from "react";

type MSRef = React.MutableRefObject<MediaStream | null>;

/**
 * Lee el nivel RMS (0..1 aprox) del micro desde streamRef mientras `active` sea true.
 * - Mantiene un único AudioContext (suspend/resume en vez de close).
 * - Se reconecta si cambia el stream.
 * - No rompe si streamRef aún es null (nivel=0).
 */
export function useMicLevel(streamRef: MSRef, active: boolean) {
  const [level, setLevel] = useState(0);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastStreamRef = useRef<MediaStream | null>(null);

  // Crea o reutiliza contexto
  const ensureContext = async () => {
    if (!audioCtxRef.current) {
      const Ctx = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
      audioCtxRef.current = new Ctx();
    }
    if (audioCtxRef.current.state === "suspended") {
      try { await audioCtxRef.current.resume(); } catch {}
    }
    return audioCtxRef.current;
  };

  const stopLoop = () => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  const disconnectNodes = () => {
    try { sourceRef.current?.disconnect(); } catch {}
    try { analyserRef.current?.disconnect(); } catch {}
    sourceRef.current = null;
    analyserRef.current = null;
  };

  useEffect(() => {
    let cancelled = false;

    const start = async () => {
      // Solo si el hook está "activo" y hay stream listo
      if (!active || !streamRef.current) {
        setLevel(0);
        return;
      }

      const stream = streamRef.current;

      // Evita reconectar si es el mismo stream y ya hay nodos
      if (lastStreamRef.current === stream && analyserRef.current) {
        runLoop();
        return;
      }

      lastStreamRef.current = stream;

      // Prepara AudioContext y nodos
      const ctx = await ensureContext();
      disconnectNodes(); // limpia conexiones previas

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.8;

      source.connect(analyser);
      sourceRef.current = source;
      analyserRef.current = analyser;

      runLoop();
    };

    const runLoop = () => {
      stopLoop();
      const analyser = analyserRef.current;
      if (!analyser) return;

      const buf = new Uint8Array(analyser.frequencyBinCount);

      const tick = () => {
        if (!active || !analyserRef.current) {
          stopLoop();
          return;
        }
        analyser.getByteTimeDomainData(buf);

        // RMS sencillo (0..1 aproximado)
        let sum = 0;
        for (let i = 0; i < buf.length; i++) {
          const v = (buf[i] - 128) / 128; // -1..1
          sum += v * v;
        }
        const rms = Math.sqrt(sum / buf.length);
        // Suavizado pequeño para UI
        const display = Math.max(0, Math.min(1, rms * 2.2)); // factor para escalar un poco
        if (!cancelled) setLevel(display);

        rafRef.current = requestAnimationFrame(tick);
      };

      rafRef.current = requestAnimationFrame(tick);
    };

    start();

    return () => {
      cancelled = true;
      stopLoop();
      // No cerramos el AudioContext (evita InvalidStateError); solo desconectamos
      disconnectNodes();
      // Si quieres ser más agresivo cuando todo el app se desmonta, puedes cerrar fuera.
      // audioCtxRef.current?.close(); // ⚠️ no lo hacemos aquí
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, streamRef.current]); // reintenta cuando cambia el stream o active

  // Si el usuario desactiva (active=false), suspende el contexto para ahorrar
  useEffect(() => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    if (!active && ctx.state === "running") {
      ctx.suspend().catch(() => {});
    }
  }, [active]);

  return level;
}
