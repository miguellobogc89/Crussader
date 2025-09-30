"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useContinuousSTT(
  lang: "es" | "en",
  onFinal: (text: string) => void,
  onStart?: () => void, // barge-in
) {
  const recogRef = useRef<any>(null);
  const keepAliveRef = useRef(false);
  const [supported, setSupported] = useState(true);
  const [listening, setListening] = useState(false);
  const [partial, setPartial] = useState("");
  const [lastError, setLastError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setSupported(false); return; }

    const r = new SR();
    r.lang = lang === "en" ? "en-US" : "es-ES";
    r.continuous = true;
    r.interimResults = true;
    r.maxAlternatives = 1;

    r.onstart = () => {
      setLastError(null);
      onStart?.();
      setListening(true);
      setPartial("");
    };

    r.onresult = (ev: any) => {
      let interim = "";
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const res = ev.results[i];
        if (res.isFinal) {
          const finalText = (res[0]?.transcript || "").trim();
          if (finalText) onFinal(finalText);
          setPartial("");
        } else {
          interim += res[0]?.transcript || "";
        }
      }
      const p = interim.trim();
      setPartial(p);
      if (p) onStart?.(); // barge-in con parciales
    };

    r.onerror = (e: any) => {
      // e.error: "no-speech" | "audio-capture" | "not-allowed" | "aborted" | "network"
      const msg = `${e?.error || "unknown"}${e?.message ? `: ${e.message}` : ""}`;
      setLastError(msg);
      console.error("[STT error]", e);
      setListening(false);
      if (keepAliveRef.current) {
        setTimeout(() => {
          try { r.start(); } catch (err) { console.warn("STT restart failed:", err); }
        }, 250);
      }
    };

    r.onend = () => {
      setListening(false);
      if (keepAliveRef.current) {
        try { r.start(); } catch (err) { console.warn("STT restart failed:", err); }
      }
    };

    recogRef.current = r;
    return () => {
      try { r.stop(); } catch {}
      recogRef.current = null;
      keepAliveRef.current = false;
    };
  }, [lang, onFinal, onStart]);

  const start = useCallback(() => {
    if (!recogRef.current) return;
    try { recogRef.current.stop(); } catch {}
    keepAliveRef.current = true;
    try { recogRef.current.start(); } catch (e) {
      setLastError((e as any)?.message || "start failed");
      console.error("STT start failed:", e);
    }
  }, []);

  const stop = useCallback(() => {
    keepAliveRef.current = false;
    try { recogRef.current?.stop(); } catch {}
  }, []);

  return { supported, listening, partial, lastError, start, stop };
}
