"use client";

import React, { useEffect, useRef, useState } from "react";

type Props = {
  language?: "es" | "en";
  onTranscription: (finalText: string) => void; // se envía al motor cuando hay resultado final
  onStartRecording?: () => void;               // para barge-in: cancelar TTS al empezar a hablar
};

export default function VoiceDictationBar({
  language = "es",
  onTranscription,
  onStartRecording,
}: Props) {
  const [supported, setSupported] = useState<boolean>(true);
  const [listening, setListening] = useState(false);
  const [partial, setPartial] = useState<string>("");
  const recogRef = useRef<any>(null);
  const keepAliveRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const SR: any =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setSupported(false); return; }

    const r = new SR();
    r.lang = language === "en" ? "en-US" : "es-ES";
    r.continuous = true;           // escucha continua
    r.interimResults = true;       // resultados parciales
    r.maxAlternatives = 1;

    r.onstart = () => {
      onStartRecording?.();
      setListening(true);
      setPartial("");
    };

    r.onresult = (ev: any) => {
      let interim = "";
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const res = ev.results[i];
        if (res.isFinal) {
          const finalText = res[0]?.transcript?.trim();
          if (finalText) onTranscription(finalText);
          setPartial("");
        } else {
          interim += res[0]?.transcript || "";
        }
      }
      setPartial(interim.trim());
    };

    r.onerror = (_: any) => {
      // errores típicos: "no-speech", "aborted", "audio-capture"
      // no rompemos la UI; el usuario puede volver a darle a Hablar
    };

    r.onend = () => {
      setListening(false);
      // algunos navegadores cortan sesiones largas; reintenta si el usuario no ha parado manualmente
      if (keepAliveRef.current) {
        try { r.start(); } catch {}
      }
    };

    recogRef.current = r;

    return () => {
      try { r.stop(); } catch {}
      recogRef.current = null;
      keepAliveRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  const start = async () => {
    if (!recogRef.current) return;
    keepAliveRef.current = true;
    try { recogRef.current.start(); } catch {}
  };

  const stop = () => {
    keepAliveRef.current = false;
    try { recogRef.current?.stop(); } catch {}
  };

  if (!supported) {
    return (
      <div className="rounded-2xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
        Dictado no soportado en este navegador. Usa Chrome o vuelve al modo “Grabar/Detener”.
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/70 px-3 py-2">
      <button
        onClick={listening ? stop : start}
        className={`rounded-xl px-3 py-2 text-sm font-medium ${
          listening ? "bg-red-600 text-white" : "bg-slate-900 text-white"
        }`}
      >
        {listening ? "Detener" : "Hablar (continuo)"}
      </button>

      <div className="min-h-[24px] flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-xs text-slate-600">
        {listening ? (partial ? `Escuchando… ${partial}` : "Escuchando…") : "Pulsa para hablar"}
      </div>

      <div
        className={`h-2 w-2 rounded-full ${listening ? "bg-green-500 animate-pulse" : "bg-slate-300"}`}
        title={listening ? "Escuchando" : "Inactivo"}
      />
    </div>
  );
}
