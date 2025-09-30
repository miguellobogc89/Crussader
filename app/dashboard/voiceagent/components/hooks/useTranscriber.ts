// app/dashboard/voiceagent/components/hooks/useTranscriber.ts
"use client";

import { useCallback, useRef, useState } from "react";

export type TranscriberOpts = {
  // Deepgram (o tu backend) generará la URL de WS
  getWsUrl: () => Promise<string>; // ej: () => fetch("/api/deepgram-token").then(r=>r.json()).then(j=>j.url)
  language?: "es" | "en";
  onPartial?: (t: string) => void;
  onFinal?: (t: string) => void;
};

export function useTranscriber(opts: TranscriberOpts) {
  const { getWsUrl, onPartial, onFinal } = opts;

  const wsRef = useRef<WebSocket | null>(null);
  const recRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const keepAliveRef = useRef<number | null>(null);

  const [connected, setConnected] = useState(false);
  const [partial, setPartial] = useState("");
  const [lastError, setLastError] = useState<string | null>(null);

  const start = useCallback(async () => {
    // Limpieza defensiva previa
    try { await stop(); } catch {}

    try {
      // 1) Micro con AEC (manos libres)
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: { ideal: 1 },
          sampleRate: { ideal: 48000 },
          // @ts-ignore (experimental en algunos navegadores)
          echoCancellationType: "system",
        },
      });
      streamRef.current = stream;

      // 2) WS a tu proveedor STT (Deepgram realtime)
      const url = await getWsUrl();
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        setLastError(null);

        // Keep-alive
        keepAliveRef.current = window.setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "ping" }));
          }
        }, 20000);

        // 3) Grabar y enviar chunks
        const mimeType =
          (typeof MediaRecorder !== "undefined" &&
            typeof MediaRecorder.isTypeSupported === "function" &&
            (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
              ? "audio/webm;codecs=opus"
              : MediaRecorder.isTypeSupported("audio/webm")
              ? "audio/webm"
              : MediaRecorder.isTypeSupported("audio/ogg;codecs=opus")
              ? "audio/ogg;codecs=opus"
              : "")) || "";

        const rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
        recRef.current = rec;

        rec.ondataavailable = (e) => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(e.data);
          }
        };

        rec.start(250);
      };

      ws.onerror = () => {
        setLastError("STT WebSocket error");
      };

      ws.onclose = (ev) => {
        setConnected(false);
        if (keepAliveRef.current) {
          window.clearInterval(keepAliveRef.current);
          keepAliveRef.current = null;
        }
        // 1000 = cierre normal → no marcar error
        setLastError(ev.code === 1000 ? null : `ws close ${ev.code}`);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);

          // Deepgram manda distintos tipos; nos quedamos con "Results"
          if (msg.type && msg.type !== "Results") return;

          const alt0 = msg.channel?.alternatives?.[0];
          const transcript = alt0?.transcript ?? "";
          if (!transcript) return;

          if (msg.is_final === false) {
            setPartial(transcript);
            onPartial?.(transcript);
          } else if (msg.is_final === true) {
            setPartial("");
            onFinal?.(transcript);
          }
        } catch (e) {
          // ignora errores de parse puntuales
        }
      };
    } catch (err) {
      setLastError("mic unavailable or blocked");
      throw err;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getWsUrl, onPartial, onFinal]);

  const stop = useCallback(async () => {
    // MediaRecorder
    try {
      const rec = recRef.current;
      if (rec && rec.state !== "inactive") {
        rec.ondataavailable = null;
        rec.onerror = null;
        rec.onstop = null;
        rec.stop();
      }
    } catch {}
    recRef.current = null;

    // Ping loop
    if (keepAliveRef.current) {
      window.clearInterval(keepAliveRef.current);
      keepAliveRef.current = null;
    }

    // Micro
    try {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    } catch {}
    streamRef.current = null;

    // WebSocket
    try {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close(1000);
      }
    } catch {}
    wsRef.current = null;

    setConnected(false);
    setPartial("");
  }, []);

  return {
    start,
    stop,
    connected,
    partial,
    lastError,
    streamRef,
  };
}
