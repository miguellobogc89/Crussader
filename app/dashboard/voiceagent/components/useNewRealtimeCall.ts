"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type CallState = "idle" | "connecting" | "connected" | "error";
type ConnectOpts = {
  instructions?: string;
  autoGreetText?: string;
  localOnly?: boolean;
  onUserUtterance?: (txt: string) => void;
  onAiMessage?: (txt: string) => void;
};

export function useNewRealtimeCall() {
  const [state, setState] = useState<CallState>("idle");
  const [partialText, setPartialText] = useState<string | null>(null);
  const [sttSupported, setSttSupported] = useState<boolean>(false);
  const [micLevel, setMicLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);

  const recRef = useRef<any>(null);
  const sttOnRef = useRef(false);

  // VU
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);

  const tickVU = useCallback(() => {
    const a = analyserRef.current; if (!a) return;
    const arr = new Uint8Array(a.frequencyBinCount);
    a.getByteTimeDomainData(arr);
    let sum = 0; for (let i = 0; i < arr.length; i++) { const v = (arr[i]-128)/128; sum += v*v; }
    const rms = Math.sqrt(sum / arr.length);
    setMicLevel(Math.min(1, Math.max(0, rms * 2)));
    rafRef.current = requestAnimationFrame(tickVU);
  }, []);

  const startVU = useCallback((stream: MediaStream) => {
    try {
      const Ctx = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
      const ctx = new Ctx();
      audioCtxRef.current = ctx;
      const src = ctx.createMediaStreamSource(stream);
      const an = ctx.createAnalyser();
      an.fftSize = 1024;
      src.connect(an);
      analyserRef.current = an;
      rafRef.current = requestAnimationFrame(tickVU);
    } catch {}
  }, [tickVU]);

  const stopVU = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    try { audioCtxRef.current?.close(); } catch {}
    audioCtxRef.current = null;
    analyserRef.current = null;
    setMicLevel(0);
  }, []);

  // STT local
  const startSTT = useCallback((onFinal?: (txt: string) => void) => {
    const WSR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!WSR) { setSttSupported(false); return; }
    setSttSupported(true);
    const rec = new WSR();
    rec.lang = "es-ES";
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (e: any) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) {
          const t = r[0].transcript?.trim?.();
          if (t) onFinal?.(t);
        } else {
          interim += r[0].transcript;
        }
      }
      setPartialText(interim || null);
    };
    rec.onerror = () => {};
    rec.onend = () => { if (sttOnRef.current) { try { rec.start(); } catch {} } };
    try { rec.start(); recRef.current = rec; sttOnRef.current = true; } catch {}
  }, []);

  const stopSTT = useCallback(() => {
    sttOnRef.current = false;
    try { recRef.current?.stop(); } catch {}
    recRef.current = null;
    setPartialText(null);
  }, []);

  const connect = useCallback(async (opts?: ConnectOpts) => {
    if (state === "connected" || state === "connecting") return;
    setError(null);
    setState("connecting");

    try {
      // mic
      const mic = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      micStreamRef.current = mic;
      startVU(mic);

      // solo prueba de micro
      if (opts?.localOnly) {
        startSTT(opts.onUserUtterance);
        setState("connected");
        return;
      }

      // token efímero (usa tu ruta existente)
      const r = await fetch("/api/voice/realtime-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          voice: "alloy",
          model: "gpt-realtime-2025-08-28",
          instructions: opts?.instructions || "",
        }),
      });
      if (!r.ok) throw new Error(await r.text());
      const j = await r.json();
      const ephemeralKey = j?.client_secret?.value;
      if (!ephemeralKey) throw new Error("sin token efímero");

      // pc
      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      // data channel
      const bindDC = (dc: RTCDataChannel) => {
        dcRef.current = dc;
        dc.onopen = () => {
          if (opts?.autoGreetText) {
            try {
              dc.send(JSON.stringify({
                type: "response.create",
                response: { modalities: ["audio", "text"], instructions: opts.autoGreetText },
              }));
            } catch {}
          }
        };
        dc.onmessage = (e) => {
          try {
            const m = JSON.parse(e.data);
            const t = m?.type as string | undefined;
            if (t === "response.delta" || t === "response.output_text.delta" || t === "response.message.delta") {
              // ignoramos delta en UI sandbox
            }
            if (t === "response.completed" || t === "response.done") {
              let final = "";
              if (Array.isArray(m?.response?.output_text)) final = m.response.output_text.join("");
              else if (typeof m?.response?.output_text === "string") final = m.response.output_text;
              if (final && opts?.onAiMessage) opts.onAiMessage(final.trim());
            }
          } catch {}
        };
      };
      pc.ondatachannel = (ev) => bindDC(ev.channel);
      try { bindDC(pc.createDataChannel("oai-events")); } catch {}

      // audio remoto
      pc.ontrack = (ev) => {
        const [remote] = ev.streams;
        if (audioRef.current) {
          audioRef.current.srcObject = remote;
          audioRef.current.play().catch(() => {});
        }
      };

      // mic out / recv audio
      for (const t of mic.getTracks()) pc.addTrack(t, mic);
      pc.addTransceiver("audio", { direction: "recvonly" });

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const sdpResp = await fetch(`https://api.openai.com/v1/realtime?model=gpt-realtime-2025-08-28`, {
        method: "POST",
        headers: { Authorization: `Bearer ${ephemeralKey}`, "Content-Type": "application/sdp" },
        body: offer.sdp || "",
      });
      if (!sdpResp.ok) throw new Error(await sdpResp.text());
      const answerSdp = await sdpResp.text();
      await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });

      // STT local para ver lo que dice el usuario
      startSTT(opts?.onUserUtterance);

      setState("connected");
    } catch (e: any) {
      setError(e?.message || String(e));
      try { micStreamRef.current?.getTracks().forEach(t => t.stop()); } catch {}
      try { pcRef.current?.close(); } catch {}
      micStreamRef.current = null; pcRef.current = null; dcRef.current = null;
      stopSTT(); stopVU();
      setState("error");
    }
  }, [state, startVU, stopVU, startSTT, stopSTT]);

  const disconnect = useCallback(() => {
    try { micStreamRef.current?.getTracks().forEach(t => t.stop()); } catch {}
    try { pcRef.current?.getSenders().forEach(s => s.track && s.track.stop()); pcRef.current?.close(); } catch {}
    micStreamRef.current = null; pcRef.current = null; dcRef.current = null;
    stopSTT(); stopVU();
    setState("idle"); setError(null);
  }, [stopSTT, stopVU]);

  useEffect(() => () => disconnect(), [disconnect]);

  return { state, connect, disconnect, audioRef, partialText, sttSupported, micLevel, error };
}
