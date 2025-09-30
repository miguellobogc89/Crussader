"use client";

export function SimpleVoiceSettingsPanel() {
  return (
    <div className="h-[640px] rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="mb-2 text-sm font-semibold text-slate-900">Ajustes (sandbox)</div>

      <label className="mb-2 block text-xs text-slate-600">Voz</label>
      <select className="mb-4 w-full rounded-lg border border-slate-300 bg-white p-2 text-sm" defaultValue="alloy" disabled>
        <option value="alloy">alloy</option>
        <option value="aria">aria</option>
        <option value="verse">verse</option>
      </select>

      <label className="mb-2 block text-xs text-slate-600">Modelo</label>
      <select className="mb-4 w-full rounded-lg border border-slate-300 bg-white p-2 text-sm" defaultValue="gpt-realtime-2025-08-28" disabled>
        <option>gpt-realtime-2025-08-28</option>
      </select>

      <label className="mb-2 block text-xs text-slate-600">Persona</label>
      <textarea
        className="h-40 w-full resize-none rounded-lg border border-slate-300 bg-white p-2 text-sm"
        placeholder="(sin conexión en sandbox)"
        disabled
      />
      <p className="mt-2 text-[11px] text-slate-500">
        Este panel es solo visual. No afecta a la llamada en este sandbox.
      </p>
    </div>
  );
}
