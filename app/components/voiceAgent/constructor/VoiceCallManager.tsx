// app/components/voiceAgent/VoiceCallManager.ts
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRingtone } from "@/hooks/voiceAgent/useRingtone";

type CallState = "idle" | "connecting" | "connected";

export type ConnectOptions = {
  localOnly?: boolean;
  model?: string;
  voice?: string;
  instructions?: string;
  autoGreetText?: string;
  onUserUtterance?: (txt: string) => void;
  onAiMessage?: (txt: string) => void;
  onAiDelta?: (partial: string) => void;
};

type TranscriptEntry = {
  who: "user" | "agent";
  text: string;
  at: number;
  t: number;
};

export type ManagerReturn = {
  state: CallState;
  error: string | null;
  connect: (opts: ConnectOptions) => Promise<void>;
  disconnect: () => void;
  audioRef: React.MutableRefObject<HTMLAudioElement | null>;
  partialText: string | null;
  sttSupported: boolean;
  micLevel: number;
  durationSec: number;
  aiSpeaking: boolean;
  debug: {
    gotToken: boolean;
    micReady: boolean;
    pcReady: boolean;
    offerCreated: boolean;
    answerSet: boolean;
    dcOpen: boolean;
    remoteTrack: boolean;
    iceState: RTCIceConnectionState | "unknown";
    connState: RTCPeerConnectionState | "unknown";
    lastEventType?: string;
    lastErrorText?: string;
  };
  transcript: TranscriptEntry[];
};

export function useVoiceCallManager(): ManagerReturn {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const startedAtRef = useRef<number | null>(null);
  const greetRef = useRef<string | null>(null);

  const [state, setState] = useState<CallState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [partialText, setPartialText] = useState<string | null>(null);
  const [micLevel, setMicLevel] = useState<number>(0);
  const [durationSec, setDurationSec] = useState<number>(0);
  const [aiSpeaking, setAiSpeaking] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const turnRef = useRef(0);

  const [debug, setDebug] = useState<ManagerReturn["debug"]>({
    gotToken: false,
    micReady: false,
    pcReady: false,
    offerCreated: false,
    answerSet: false,
    dcOpen: false,
    remoteTrack: false,
    iceState: "unknown",
    connState: "unknown",
  });

  const sttSupported = true;
  const { start: startRing, stop: stopRing } = useRingtone();

  // ===== Medidor de micrófono =====
  const rafRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const stopMeters = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    try {
      analyserRef.current?.disconnect();
    } catch {}
    analyserRef.current = null;
    if (audioCtxRef.current) {
      try {
        audioCtxRef.current.close();
      } catch {}
      audioCtxRef.current = null;
    }
  };

  const startMicMeter = (stream: MediaStream) => {
    stopMeters();
    const Ctx =
      (window.AudioContext ||
        (window as any).webkitAudioContext) as typeof AudioContext;
    const ctx = new Ctx();
    audioCtxRef.current = ctx;

    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 1024;
    analyserRef.current = analyser;
    source.connect(analyser);

    const data = new Uint8Array(analyser.frequencyBinCount);
    const tick = () => {
      analyser.getByteTimeDomainData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i++) {
        const v = (data[i] - 128) / 128;
        sum += v * v;
      }
      const rms = Math.sqrt(sum / data.length);
      setMicLevel(Math.min(1, rms * 4));
      rafRef.current = requestAnimationFrame(tick);
    };
    tick();
  };

  // ===== Medidor IA =====
  const remoteRafRef = useRef<number | null>(null);
  const remoteAnalyserRef = useRef<AnalyserNode | null>(null);
  const remoteAudioCtxRef = useRef<AudioContext | null>(null);

  const stopRemoteMeter = () => {
    if (remoteRafRef.current) cancelAnimationFrame(remoteRafRef.current);
    remoteRafRef.current = null;
    try {
      remoteAnalyserRef.current?.disconnect();
    } catch {}
    remoteAnalyserRef.current = null;
    if (remoteAudioCtxRef.current) {
      try {
        remoteAudioCtxRef.current.close();
      } catch {}
      remoteAudioCtxRef.current = null;
    }
  };

  const startRemoteMeter = (stream: MediaStream) => {
    stopRemoteMeter();
    const Ctx =
      (window.AudioContext ||
        (window as any).webkitAudioContext) as typeof AudioContext;
    const ctx = new Ctx();
    remoteAudioCtxRef.current = ctx;

    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 1024;
    remoteAnalyserRef.current = analyser;
    source.connect(analyser);

    const data = new Uint8Array(analyser.frequencyBinCount);
    const THR = 0.02;
    const tick = () => {
      analyser.getByteTimeDomainData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i++) {
        const v = (data[i] - 128) / 128;
        sum += v * v;
      }
      const rms = Math.sqrt(sum / data.length);
      setAiSpeaking(rms > THR);
      remoteRafRef.current = requestAnimationFrame(tick);
    };
    tick();
  };

  // ===== Limpieza =====
  const stopAll = useCallback(() => {
    stopRing(); // 🔕 Detiene tono si sigue sonando

    try {
      pcRef.current?.getSenders().forEach((s) => s.track && s.track.stop());
      pcRef.current?.close();
    } catch {}
    pcRef.current = null;

    try {
      dcRef.current?.close();
    } catch {}
    dcRef.current = null;

    try {
      micStreamRef.current?.getTracks().forEach((t) => t.stop());
    } catch {}
    micStreamRef.current = null;

    if (audioRef.current) {
      try {
        (audioRef.current.srcObject as MediaStream | null) = null;
        audioRef.current.pause();
      } catch {}
    }

    stopMeters();
    stopRemoteMeter();

    startedAtRef.current = null;
    setDurationSec(0);
    setAiSpeaking(false);
    setPartialText(null);
    setTranscript([]);
    turnRef.current = 0;
    setState("idle");
    setDebug((d) => ({
      ...d,
      micReady: false,
      pcReady: false,
      offerCreated: false,
      answerSet: false,
      dcOpen: false,
      remoteTrack: false,
      iceState: "unknown",
      connState: "unknown",
    }));
  }, [stopRing]);

  useEffect(() => stopAll, []);

  // Duración
  useEffect(() => {
    if (state !== "connected") return;
    const id = setInterval(() => {
      if (startedAtRef.current) {
        const diff = Math.floor((Date.now() - startedAtRef.current) / 1000);
        setDurationSec(diff);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [state]);

  function sendGreet(dc: RTCDataChannel, text: string) {
    try {
      dc.send(JSON.stringify({ type: "input_text", text }));
      dc.send(
        JSON.stringify({
          type: "response.create",
          response: { modalities: ["text", "audio"] },
        })
      );
      setDebug((d) => ({ ...d, lastEventType: "auto-greet" }));
    } catch {}
  }

  // ===== Conectar =====
  const connect = useCallback(
    async (opts: ConnectOptions) => {
      setError(null);
      setAiSpeaking(false);
      setPartialText(null);

      // 🔔 tono al iniciar conexión
      startRing();
      setTimeout(() => stopRing(), 1000); // 1 segundo tipo iPhone

      if (opts.localOnly) {
        setState("connecting");
        try {
          const mic = await navigator.mediaDevices.getUserMedia({ audio: true });
          micStreamRef.current = mic;
          startMicMeter(mic);
          startedAtRef.current = Date.now();
          setState("connected");
          setDebug((d) => ({ ...d, micReady: true }));
          return;
        } catch (e: any) {
          setError(`Mic error: ${String(e?.message ?? e)}`);
          setState("idle");
          setDebug((d) => ({ ...d, lastErrorText: String(e?.message ?? e) }));
          return;
        }
      }

      setState("connecting");
      try {
        const r = await fetch("/api/voiceagent/realtime/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: opts.model ?? "gpt-4o-realtime-preview",
            voice: opts.voice ?? "alloy",
            instructions: opts.instructions,
            temperature: 0.6,
          }),
        });
        if (!r.ok) throw new Error(`Session error: ${await r.text()}`);
        const sess = await r.json();
        const token: string | undefined = sess?.client_secret?.value;
        const model = sess?.model ?? "gpt-4o-realtime-preview";
        if (!token) throw new Error("No client_secret in response");
        setDebug((d) => ({ ...d, gotToken: true }));

        const pc = new RTCPeerConnection({
          iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        });
        pcRef.current = pc;
        setDebug((d) => ({ ...d, pcReady: true }));

        try {
          pc.addTransceiver("audio");
        } catch {}

        pc.onconnectionstatechange = () => {
          setDebug((d) => ({ ...d, connState: pc.connectionState }));
          if (["failed", "disconnected", "closed"].includes(pc.connectionState)) {
            stopAll();
          }
        };

        const dc = pc.createDataChannel("oai-events");
        dcRef.current = dc;

        dc.onopen = () => {
          setDebug((d) => ({ ...d, dcOpen: true }));
          stopRing(); // 🛑 detener ring al abrir canal (descuelga)
          if (greetRef.current) {
            sendGreet(dc, greetRef.current);
            greetRef.current = null;
          }
        };

        dc.onmessage = (ev) => {
          try {
            const evt = JSON.parse(ev.data);
            const t = evt?.type as string | undefined;

            if (t === "conversation.item.input_audio_transcription.completed") {
              const final = (evt.transcript ?? "").toString();
              setPartialText(null);
              if (final) {
                setTranscript((xs) => [
                  ...xs,
                  {
                    who: "user",
                    text: final,
                    at: Date.now(),
                    t: turnRef.current++,
                  },
                ]);
                opts.onUserUtterance?.(final);
              }
            }

            if (t === "response.text.done") {
              const final =
                ((dc as any)._aiTextBuf || "").trim() ||
                ((dc as any)._aiAudioTrBuf || "").trim();
              if (final) {
                setTranscript((xs) => [
                  ...xs,
                  {
                    who: "agent",
                    text: final,
                    at: Date.now(),
                    t: turnRef.current++,
                  },
                ]);
                opts.onAiMessage?.(final);
              }
              (dc as any)._aiTextBuf = "";
              (dc as any)._aiAudioTrBuf = "";
            }
          } catch {}
        };

        pc.ontrack = (ev) => {
          stopRing(); // 🛑 detener ring si ya hay audio remoto
          const s = ev.streams[0];
          if (audioRef.current) {
            audioRef.current.srcObject = s;
            audioRef.current.play().catch(() => {});
          }
          startRemoteMeter(s);
        };

        const mic = await navigator.mediaDevices.getUserMedia({ audio: true });
        micStreamRef.current = mic;
        startMicMeter(mic);
        mic.getTracks().forEach((t) => pc.addTrack(t, mic));

        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: false,
        });
        await pc.setLocalDescription(offer);

        const sdpResp = await fetch(
          `https://api.openai.com/v1/realtime?model=${encodeURIComponent(model)}`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/sdp",
              "OpenAI-Beta": "realtime=v1",
            },
            body: offer.sdp ?? "",
          }
        );

        if (!sdpResp.ok) throw new Error(await sdpResp.text());
        const answerSdp = await sdpResp.text();
        await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });

        startedAtRef.current = Date.now();
        setState("connected");

        greetRef.current = opts.autoGreetText || null;
        if (greetRef.current && dc.readyState === "open") {
          sendGreet(dc, greetRef.current);
          greetRef.current = null;
        }
      } catch (e: any) {
        const msg = String(e?.message ?? e);
        setError(msg);
        stopAll();
      }
    },
    [stopAll, startRing, stopRing]
  );

  const disconnect = useCallback(() => {
    stopAll();
  }, [stopAll]);

  return {
    state,
    error,
    connect,
    disconnect,
    audioRef,
    partialText,
    sttSupported,
    micLevel,
    durationSec,
    aiSpeaking,
    debug,
    transcript,
  };
}
