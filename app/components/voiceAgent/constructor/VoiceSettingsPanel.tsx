"use client";

import React from "react";

export type VoiceSettings = {
  model: string;
  voice: string;
  persona: string;
};

export default function VoiceSettingsPanel({
  value,
  onChange,
  disabled,
  title = "Ajustes del agente",
}: {
  value: VoiceSettings;
  onChange: (v: VoiceSettings) => void;
  disabled?: boolean;
  /** Por si quieres renombrar el encabezado desde fuera */
  title?: string;
}) {
  const set = (patch: Partial<VoiceSettings>) => onChange({ ...value, ...patch });

  return (
    <div className="rounded-2xl border border-slate-200 bg-white/70 p-3 shadow-sm">
      <div className="mb-2 text-sm font-semibold text-slate-900">{title}</div>

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

      <label className="mb-2 block text-xs font-medium text-slate-700">Voz</label>
      <select
        className="mb-3 w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm disabled:opacity-60"
        value={value.voice}
        onChange={(e) => set({ voice: e.target.value })}
        disabled={disabled}
      >
        <option value="alloy">alloy</option>
        <option value="verse">verse</option>
        <option value="aria">aria</option>
      </select>

      <label className="mb-2 block text-xs font-medium text-slate-700">Persona / estilo</label>
      <textarea
        className="mb-2 h-24 w-full resize-none rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm disabled:opacity-60"
        value={value.persona}
        onChange={(e) => set({ persona: e.target.value })}
        disabled={disabled}
        placeholder="Tono de voz, actitud, formalidad…"
      />

      <p className="mt-2 text-[11px] leading-snug text-slate-500">
        Los cambios aplican en la próxima llamada. Durante una llamada, los controles se bloquean.
      </p>
    </div>
  );
}
