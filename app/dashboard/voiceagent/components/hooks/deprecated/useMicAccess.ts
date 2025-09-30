// app/dashboard/voiceagent/components/hooks/useMicAccess.ts
"use client";

import { useCallback, useRef } from "react";

export function useMicAccess() {
  const streamRef = useRef<MediaStream | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);

  function ensureAudioSink(): HTMLAudioElement {
    if (audioElRef.current) return audioElRef.current;

    const el = document.createElement("audio");
    el.autoplay = true;
    el.muted = true;                         // autoplay sin interacción
    el.setAttribute("playsinline", "");      // evitar fullscreen en iOS (atributo válido)
    el.style.position = "fixed";
    el.style.left = "-9999px";
    el.style.width = "1px";
    el.style.height = "1px";
    document.body.appendChild(el);
    audioElRef.current = el;
    return el;
  }

  const open = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) return;

    if (streamRef.current) return streamRef.current; // ya abierto

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
      video: false,
    });
    streamRef.current = stream;

    // “Anclamos” el stream a un <audio muted> oculto para mantener viva la ruta
    const el = ensureAudioSink();
    try {
      (el as any).srcObject = stream; // cast para compatibilidad TS
      await el.play().catch(() => {});
    } catch {
      // fallback antiguo (rara vez necesario)
      (el as HTMLAudioElement).src = URL.createObjectURL(stream as any);
      (el as HTMLAudioElement).play().catch(() => {});
    }

    return stream;
  }, []);

  const close = useCallback(() => {
    if (audioElRef.current) {
      try { (audioElRef.current as any).srcObject = null; } catch {}
      try { audioElRef.current.pause(); } catch {}
      try { audioElRef.current.remove(); } catch {}
      audioElRef.current = null;
    }
    streamRef.current?.getTracks()?.forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  return { open, close, streamRef };
}
