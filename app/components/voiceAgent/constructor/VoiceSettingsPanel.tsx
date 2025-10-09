"use client";

import React, { useMemo } from "react";

export type VoiceSettings = {
  model: string;
  voice: string;
  persona: string;
  rate?: number; // 0.7..1.6 aprox
};

const SAFE_REALTIME_VOICES = ["alloy", "ash"] as const;
type SafeVoice = typeof SAFE_REALTIME_VOICES[number];

function RateSlider({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  // Marcas discretas como en tu panel de admin
  const marks = [0.7, 0.85, 1.0, 1.3, 1.6];
  // Elegimos el más cercano al valor actual para mostrar la marca activa
  const stepIndex = useMemo(() => {
    let bi = 0;
    for (let i = 1; i < marks.length; i++) {
      if (Math.abs(marks[i] - value) < Math.abs(marks[bi] - value)) bi = i;
    }
    return bi;
  }, [value, marks]);

  return (
    <div>
      <div className="flex items-center gap-2">
        <input
          type="range"
          min={0}
          max={4}
          step={1}
          value={stepIndex}
          onChange={(e) => {
            const idx = Number(e.target.value);
            onChange(marks[Math.max(0, Math.min(4, idx))]);
          }}
          disabled={disabled}
          className="w-full accent-indigo-600 disabled:opacity-50"
        />
        <div className="grid grid-cols-5 gap-1 text-[10px] text-slate-500">
          {marks.map((m) => (
            <span key={m}>{m.toFixed(2)}</span>
          ))}
        </div>
      </div>
      <div className="mt-1 text-right text-[11px] text-slate-500">
        Velocidad: <b>{value.toFixed(2)}×</b>
      </div>
    </div>
  );
}

export default function VoiceSettingsPanel({
  value,
  onChange,
  disabled,
  title = "Ajustes del agente",
}: {
  value: VoiceSettings;
  onChange: (v: VoiceSettings) => void;
  disabled?: boolean;
  title?: string;
}) {
  const set = (patch: Partial<VoiceSettings>) => onChange({ ...value, ...patch });

  const isKnownUnsafe = useMemo(() => {
    const v = (value.voice || "").toLowerCase().trim();
    // Voces que suelen fallar en Realtime (ejemplo: 'aria')
    return v === "aria" || v === "verse";
  }, [value.voice]);

  const isCustom = useMemo(() => {
    const v = (value.voice || "").toLowerCase();
    return !SAFE_REALTIME_VOICES.includes(v as SafeVoice);
  }, [value.voice]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white/70 p-3 shadow-sm">
      <div className="mb-2 text-sm font-semibold text-slate-900">{title}</div>

      {/* Modelo */}
      <label className="mb-2 block text-xs font-medium text-slate-700">Modelo (Realtime)</label>
      <select
        className="mb-3 w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm disabled:opacity-60"
        value={value.model}
        onChange={(e) => set({ model: e.target.value })}
        disabled={disabled}
      >
        <option value="gpt-4o-realtime-preview">gpt-4o-realtime-preview</option>
        <option value="gpt-4o-realtime-latest">gpt-4o-realtime-latest</option>
      </select>

      {/* Agente de voz */}
      <label className="mb-2 block text-xs font-medium text-slate-700">Agente de voz</label>
      <div className="mb-3 grid grid-cols-2 gap-2">
        <select
          className="col-span-1 w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm disabled:opacity-60"
          value={
            SAFE_REALTIME_VOICES.includes((value.voice || "").toLowerCase() as SafeVoice)
              ? value.voice
              : "custom"
          }
          onChange={(e) => {
            const v = e.target.value;
            if (v === "custom") return; // deja el input de la derecha para escribir
            set({ voice: v });
          }}
          disabled={disabled}
        >
          {SAFE_REALTIME_VOICES.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
          <option value="custom">Custom…</option>
        </select>

        <input
          type="text"
          className="col-span-1 w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm disabled:opacity-60"
          placeholder="otra voz (p. ej. alloy, ash)"
          value={value.voice}
          onChange={(e) => set({ voice: e.target.value })}
          disabled={disabled || !isCustom}
        />
      </div>

      {isKnownUnsafe && (
        <div className="mb-3 rounded-md border border-amber-200 bg-amber-50 px-2 py-1.5 text-[11px] text-amber-800">
          Esta voz suele <b>no estar soportada</b> en Realtime. Prueba con <b>alloy</b> o <b>ash</b>.
        </div>
      )}

      {/* Velocidad */}
      <label className="mb-2 block text-xs font-medium text-slate-700">Velocidad de habla (TTS)</label>
      <RateSlider
        value={typeof value.rate === "number" ? value.rate : 1.0}
        onChange={(r) => set({ rate: r })}
        disabled={disabled}
      />

      {/* Persona */}
      <label className="mt-4 mb-2 block text-xs font-medium text-slate-700">Persona / estilo</label>
      <textarea
        className="mb-2 h-24 w-full resize-none rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm disabled:opacity-60"
        value={value.persona}
        onChange={(e) => set({ persona: e.target.value })}
        disabled={disabled}
        placeholder="Tono de voz, actitud, formalidad…"
      />

      <p className="mt-2 text-[11px] leading-snug text-slate-500">
        Los cambios se aplican en la <b>próxima llamada</b>. Durante una llamada, los controles se bloquean.
      </p>
    </div>
  );
}
