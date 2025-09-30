// app/dashboard/voiceagent/components/TestMic.tsx
"use client";

import { useState } from "react";
import { useTranscriber } from "./hooks/useTranscriber";
import { useMicLevel } from "./hooks/useMicLevel";

export default function TestMic() {
  const [running, setRunning] = useState(false);

  const {
    start,
    stop,
    connected,
    partial,
    lastError,
    streamRef,
  } = useTranscriber({
    getWsUrl: async () => {
      const r = await fetch("/api/deepgram-token");
      const j = await r.json();
      return j.url;
    },
    onPartial: (t) => console.debug("[Partial]", t),
    onFinal: (t) => console.debug("[Final]", t),
  });

  // nivel del micro (VU)
  const micLevel = useMicLevel(streamRef, running);

  const toggle = async () => {
    if (running) {
      stop();
      setRunning(false);
    } else {
      await start();
      setRunning(true);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <button
        onClick={toggle}
        className={`rounded px-4 py-2 text-white ${running ? "bg-red-600" : "bg-green-600"}`}
      >
        {running ? "Stop Mic Test" : "Start Mic Test"}
      </button>

      <div className="text-sm text-slate-700">
        <div>Connected: {connected ? "✅" : "❌"}</div>
        <div>Partial: {partial}</div>
        <div>Error: {lastError ?? "—"}</div>
        <div>Mic level: {micLevel.toFixed(2)}</div>
      </div>

      {/* barra simple */}
      <div className="h-2 w-full bg-slate-200 rounded">
        <div
          className="h-2 bg-sky-500 rounded"
          style={{ width: `${Math.min(100, micLevel * 100)}%` }}
        />
      </div>
    </div>
  );
}
