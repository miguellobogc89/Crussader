"use client";

import { useCallback, useEffect, useRef } from "react";

export function useRingtone() {
  const ctxRef = useRef<AudioContext | null>(null);
  const osc1Ref = useRef<OscillatorNode | null>(null);
  const osc2Ref = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const tickRef = useRef<number | null>(null);

  const start = useCallback(async () => {
    if (typeof window === "undefined") return;
    const Ctx: any = (window as any).AudioContext || (window as any).webkitAudioContext;
    const ctx = new Ctx();
    ctxRef.current = ctx;

    const gain = ctx.createGain();
    gain.gain.value = 0;
    gainRef.current = gain;

    const o1 = ctx.createOscillator();
    const o2 = ctx.createOscillator();
    o1.type = "sine"; o2.type = "sine";
    o1.frequency.value = 440;
    o2.frequency.value = 480;
    o1.connect(gain);
    o2.connect(gain);
    gain.connect(ctx.destination);
    o1.start(); o2.start();
    osc1Ref.current = o1; osc2Ref.current = o2;

    let on = false;
    const tick = () => {
      on = !on;
      gain.gain.setTargetAtTime(on ? 0.12 : 0.0, ctx.currentTime, 0.01);
      tickRef.current = window.setTimeout(tick, 1000) as unknown as number;
    };
    tick();
  }, []);

// --- PATCH START: cierre seguro del AudioContext en useRingtone.ts ---

  const stop = useCallback(() => {
    if (tickRef.current) {
      clearTimeout(tickRef.current);
      tickRef.current = null;
    }

    try { osc1Ref.current?.stop(); } catch {}
    try { osc2Ref.current?.stop(); } catch {}
    osc1Ref.current = null;
    osc2Ref.current = null;

    if (ctxRef.current && ctxRef.current.state !== "closed") {
      ctxRef.current.close().catch(() => {});
      console.debug("[RING] AudioContext close()");
    } else {
      console.debug("[RING] AudioContext already closed");
    }

    ctxRef.current = null;
    gainRef.current = null;
  }, []);

// --- PATCH END ---


  useEffect(() => () => { stop(); }, [stop]);

  return { start, stop };
}
