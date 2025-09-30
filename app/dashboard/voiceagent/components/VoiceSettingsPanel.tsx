"use client";

import { useMemo } from "react";

export type VoiceSettings = {
  voice: string;
  model: string;
  persona?: string;
};
export function VoiceSettingsPanel({
  value,
  onChange,
  disabled,
}: {
  value: VoiceSettings;
  onChange: (v: VoiceSettings) => void;
  disabled?: boolean;
}) {
  const voices = useMemo(
    () => ["alloy", "verse", "aria", "luna", "sage"],
    []
  );
  const models = useMemo(
    () => ["gpt-realtime-2025-08-28"],
    []
  );

  return (
    <div className="flex h-[640px] flex-col rounded-2xl border border-slate-200 bg-white/70 p-3 shadow-sm">
      <div className="mb-2 text-sm font-semibold text-slate-900">Ajustes de voz</div>

      <label className="mb-2 block text-xs text-slate-600">Voz</label>
      <select
        className="mb-4 w-full rounded-lg border border-slate-300 bg-white p-2 text-sm"
        value={value.voice}
        onChange={(e) => onChange({ ...value, voice: e.target.value })}
        disabled={disabled}
      >
        {voices.map((v) => (
          <option key={v} value={v}>{v}</option>
        ))}
      </select>

      <label className="mb-2 block text-xs text-slate-600">Modelo</label>
      <select
        className="mb-4 w-full rounded-lg border border-slate-300 bg-white p-2 text-sm"
        value={value.model}
        onChange={(e) => onChange({ ...value, model: e.target.value })}
        disabled={disabled}
      >
        {models.map((m) => (
          <option key={m} value={m}>{m}</option>
        ))}
      </select>

      <label className="mb-2 block text-xs text-slate-600">Persona (visual, sin lógica aún)</label>
      <textarea
        className="h-48 w-full resize-none rounded-lg border border-slate-300 bg-white p-2 text-sm"
        placeholder="Ej: Recepcionista cercana, clara y profesional…"
        value={value.persona || ""}
        onChange={(e) => onChange({ ...value, persona: e.target.value })}
        disabled={disabled}
      />
      <p className="mt-2 text-[11px] text-slate-500">
        Nota: ahora mismo la persona es solo informativa. Luego la conectamos al prompt.
      </p>
    </div>
  );
}
