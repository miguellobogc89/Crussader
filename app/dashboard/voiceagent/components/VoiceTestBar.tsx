"use client";

import React, { useEffect, useRef, useState } from "react";

type Props = {
  language?: "es" | "en";
  onTranscription: (text: string) => void;  // lo enviaremos al motor del chat
  onStartRecording?: () => void;            // para barge-in: cancelar TTS
};

export default function VoiceTestBar({ language = "es", onTranscription, onStartRecording }: Props) {
  const [recording, setRecording] = useState(false);
  const [level, setLevel] = useState(0); // vumetro 0..1
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  useEffect(() => {
    return () => {
      stopMeter();
      cleanupAudio();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function stopMeter() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  }

  function cleanupAudio() {
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    mediaStreamRef.current = null;
    sourceRef.current?.disconnect();
    analyserRef.current?.disconnect();
    audioCtxRef.current?.close();
    sourceRef.current = null;
    analyserRef.current = null;
    audioCtxRef.current = null;
  }

  async function start() {
    onStartRecording?.(); // barge-in: cancela TTS actual
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaStreamRef.current = stream;

    // VU meter
    const ctx = new AudioContext();
    audioCtxRef.current = ctx;
    const source = ctx.createMediaStreamSource(stream);
    sourceRef.current = source;
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    analyserRef.current = analyser;
    source.connect(analyser);

    const data = new Uint8Array(analyser.frequencyBinCount);
    const loop = () => {
      analyser.getByteTimeDomainData(data);
      // RMS sencillo
      let sum = 0;
      for (let i = 0; i < data.length; i++) {
        const v = (data[i] - 128) / 128;
        sum += v * v;
      }
      const rms = Math.sqrt(sum / data.length);
      setLevel(rms);
      rafRef.current = requestAnimationFrame(loop);
    };
    loop();

    // Recorder
    const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ? "audio/webm;codecs=opus"
      : "audio/webm";
    const rec = new MediaRecorder(stream, { mimeType: mime });
    mediaRecorderRef.current = rec;
    chunksRef.current = [];

    rec.ondataavailable = (ev) => {
      if (ev.data && ev.data.size > 0) chunksRef.current.push(ev.data);
    };
    rec.onstop = async () => {
      stopMeter();
      cleanupAudio();
      const blob = new Blob(chunksRef.current, { type: mime });
      await sendToSTT(blob);
    };

    rec.start();
    setRecording(true);
  }

  function stop() {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  }

  async function sendToSTT(blob: Blob) {
    const fd = new FormData();
    fd.append("file", blob, "audio.webm");
    fd.append("language", language);

    const r = await fetch("/api/stt", { method: "POST", body: fd });
    const j = await r.json();
    if (j?.text) onTranscription(j.text);
  }

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/70 px-3 py-2">
      <button
        onClick={recording ? stop : start}
        className={`rounded-xl px-3 py-2 text-sm font-medium ${
          recording ? "bg-red-600 text-white" : "bg-slate-900 text-white"
        }`}
      >
        {recording ? "Detener" : "Hablar"}
      </button>

      {/* VU meter */}
      <div className="h-2 flex-1 rounded-full bg-slate-200">
        <div
          className="h-2 rounded-full bg-slate-900 transition-[width]"
          style={{ width: `${Math.min(100, Math.round(level * 160))}%` }}
        />
      </div>

      <div className="text-xs text-slate-600">{recording ? "Grabando…" : "Pulsa para hablar"}</div>
    </div>
  );
}
