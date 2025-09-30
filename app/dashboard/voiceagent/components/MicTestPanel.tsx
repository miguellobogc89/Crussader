// components/MicTestPanel.tsx
"use client";

import React, { useCallback } from "react";
import { useMicTest } from "./hooks/useMicTest";

type Props = {
  getWsUrl: () => Promise<string>; // URL firmada de Deepgram
};

export function MicTestPanel({ getWsUrl }: Props) {
  const {
    start,
    stop,
    partial,
    micLevel,
    error,
    listening,
  } = useMicTest({
    getWsUrl,
    onFinal: (text: string) => {
      console.log("Transcripción final:", text);
    },
  });

  const toggle = useCallback(() => {
    if (listening) stop();
    else start();
  }, [listening, start, stop]);

  return (
    <div className="w-full max-w-md space-y-4 rounded-lg border p-4 shadow-sm bg-white">
      <h2 className="text-lg font-semibold">Prueba de micrófono</h2>

      {/* Botón */}
      <button
        onClick={toggle}
        className={`px-4 py-2 text-sm font-medium rounded ${
          listening
            ? "bg-red-600 text-white hover:bg-red-700"
            : "bg-sky-600 text-white hover:bg-sky-700"
        }`}
      >
        {listening ? "Detener prueba" : "Iniciar prueba"}
      </button>

      {/* Nivel del mic */}
      <div>
        <label className="text-sm text-slate-700">Nivel del micrófono:</label>
        <div className="mt-1 flex h-3 w-full overflow-hidden rounded bg-slate-200">
          <div
            className="h-full bg-sky-500 transition-all duration-100"
            style={{ width: `${Math.min(1, micLevel) * 100}%` }}
          />
        </div>
      </div>

      {/* Transcripción parcial */}
      {listening && (
        <div className="rounded bg-slate-50 p-3 text-sm text-slate-800 ring-1 ring-slate-200">
          <span className="opacity-60">Escuchando… </span>
          <span className="italic">{partial || "…"}</span>
          <span className="ml-1 animate-pulse">▌</span>
        </div>
      )}

      {/* Errores */}
      {error && (
        <div className="rounded bg-rose-100 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-300">
          Error: {error}
        </div>
      )}
    </div>
  );
}
