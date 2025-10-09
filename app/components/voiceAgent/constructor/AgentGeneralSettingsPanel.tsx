
// app/components/voiceAgent/constructor/AgentGeneralSettingsPanel.tsx
"use client";

import React from "react";
import {
  Settings as SettingsIcon,
  Mic,
  Waves,
  Volume2,
  MessageSquare,
  Shield,
  Database,
  Zap,
  Languages,
  Info,
} from "lucide-react";

/* === TIPOS ORIGINALES (sin cambios) === */
export type VadMode = "relaxed" | "balanced" | "strict";

export type AgentGeneralSettings = {
  ttsRate: number;
  bargeIn: boolean;

  vadMode: VadMode;
  endOfSpeechMs: number;
  minSpeechMs: number;
  confidenceMin: number;
  endpointSensitivity: number;
  noiseSuppression: boolean;
  echoCancellation: boolean;

  stickToKnowledge: boolean;
  refusalGuard: boolean;
  hallucinationGuard: number;

  lang: string;
  showInterim: boolean;
};

export const DEFAULT_AGENT_GENERAL_SETTINGS: AgentGeneralSettings = {
  ttsRate: 1.0,
  bargeIn: true,
  vadMode: "balanced",
  endOfSpeechMs: 650,
  minSpeechMs: 180,
  confidenceMin: 0.6,
  endpointSensitivity: 60,
  noiseSuppression: true,
  echoCancellation: true,
  stickToKnowledge: true,
  refusalGuard: true,
  hallucinationGuard: 80,
  lang: "es-ES",
  showInterim: false,
};

/* === PRIMITIVAS COMPACTAS === */

function Row({
  label,
  hint,
  icon,
  right,
  children,
}: {
  label: string;
  hint?: string;
  icon?: React.ReactNode;
  right?: React.ReactNode;
  children?: React.ReactNode; // <- ✅ ahora opcional
}) {
  return (
    <div className="py-2.5">
      <div className="mb-1 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          {icon ? <span className="text-slate-500">{icon}</span> : null}
          <span className="truncate text-sm font-medium text-slate-800">{label}</span>
        </div>
        {right ? <div className="shrink-0 text-[11px] text-slate-500">{right}</div> : null}
      </div>
      {hint ? <div className="mb-2 text-[11px] leading-snug text-slate-500">{hint}</div> : null}
      {children ? <div>{children}</div> : null}
      <div className="mt-2 h-px w-full bg-slate-200/70" />
    </div>
  );
}

/** Slider 0..4 con marcas + mapeo externo */
function DiscreteSlider({
  stepValue,
  onChange,
  disabled,
}: {
  stepValue: number; // 0..4
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="range"
        min={0}
        max={4}
        step={1}
        value={stepValue}
        onChange={(e) => onChange(Number(e.target.value))}
        disabled={disabled}
        className="w-full accent-indigo-600 disabled:opacity-50"
      />
      <div className="grid grid-cols-5 gap-1 text-[10px] text-slate-500">
        <span>0</span><span>1</span><span>2</span><span>3</span><span>4</span>
      </div>
    </div>
  );
}

function SwitchTiny({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  const bg = checked ? "bg-indigo-600" : "bg-slate-300";
  const knob = checked ? "left-5" : "left-0.5";
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      disabled={disabled}
      className={`relative h-5 w-10 rounded-full ${bg} transition disabled:opacity-50`}
    >
      <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow ${knob} transition`} />
    </button>
  );
}

/* === PANEL === */
export default function AgentGeneralSettingsPanel({
  settings,
  onChange,
  disabled,
}: {
  settings: AgentGeneralSettings;
  onChange: (next: AgentGeneralSettings) => void;
  disabled?: boolean;
}) {
  const s = settings ?? DEFAULT_AGENT_GENERAL_SETTINGS;
  const set = <K extends keyof AgentGeneralSettings,>(k: K, v: AgentGeneralSettings[K]) =>
    onChange({ ...s, [k]: v });

  // mapeos discretos
  const MAP = {
    ttsRate: [0.7, 0.85, 1.0, 1.3, 1.6] as const,
    endOfSpeechMs: [250, 400, 600, 900, 1200] as const,
    minSpeechMs: [80, 150, 250, 400, 600] as const,
    confidenceMinPct: [0, 30, 50, 70, 90] as const,
    endpointSensitivity: [10, 30, 50, 70, 90] as const,
    hallucinationGuard: [0, 25, 50, 75, 100] as const,
  };
  const toStep = (arr: ReadonlyArray<number>, real: number) =>
    arr.reduce((bi, v, i) => (Math.abs(v - real) < Math.abs(arr[bi] - real) ? i : bi), 0);
  const fromStep = (arr: ReadonlyArray<number>, st: number) => arr[Math.max(0, Math.min(4, st))];

  const steps = {
    ttsRate: toStep(MAP.ttsRate, s.ttsRate),
    endOfSpeechMs: toStep(MAP.endOfSpeechMs, s.endOfSpeechMs),
    minSpeechMs: toStep(MAP.minSpeechMs, s.minSpeechMs),
    confidenceMin: toStep(MAP.confidenceMinPct, Math.round(s.confidenceMin * 100)),
    endpointSensitivity: toStep(MAP.endpointSensitivity, s.endpointSensitivity),
    hallucinationGuard: toStep(MAP.hallucinationGuard, s.hallucinationGuard),
  };

  return (
    <div className="h-full rounded-3xl border border-slate-200 bg-white/70 p-3 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/60">
      {/* Header compacto */}
      <div className="mb-1 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SettingsIcon className="h-4 w-4 text-slate-600" />
          <div className="text-sm font-semibold text-slate-800">Ajustes globales del agente</div>
        </div>
        <div className="hidden gap-3 text-[11px] text-slate-500 md:flex">
          <span>🌐 {s.lang}</span>
          <span>🎚 {s.ttsRate.toFixed(2)}×</span>
          <span>🎧 {s.vadMode}</span>
          <span>⛔ {s.bargeIn ? "Barge-in On" : "Off"}</span>
        </div>
      </div>

      {/* GRID 3 columnas, denso */}
      <div className="grid auto-rows-max grid-cols-1 gap-x-6 md:grid-cols-3">
        {/* ===== VOZ Y TURNOS ===== */}
        <div className="col-span-1">
          <div className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
            <Volume2 className="h-3.5 w-3.5" /> Voz y turnos
          </div>

          <Row
            label="Velocidad de habla (TTS)"
            hint="0 = muy lenta · 4 = más rápida (la velocidad real depende del motor)."
            icon={<Volume2 className="h-4 w-4" />}
            right={<span>{s.ttsRate.toFixed(2)}×</span>}
          >
            <DiscreteSlider
              stepValue={steps.ttsRate}
              onChange={(st) => set("ttsRate", fromStep(MAP.ttsRate, st))}
              disabled={disabled}
            />
          </Row>

          <Row
            label="Interrupción inteligente (barge-in)"
            hint="Si el usuario habla, el agente se calla y le cede el turno."
            icon={<Zap className="h-4 w-4" />}
            right={<SwitchTiny checked={s.bargeIn} onChange={(v) => set("bargeIn", v)} disabled={disabled} />}
          />
        </div>

        {/* ===== STT / VAD ===== */}
        <div className="col-span-1">
          <div className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
            <Mic className="h-3.5 w-3.5" /> STT / Detección de voz (VAD)
          </div>

          <Row label="Modo VAD" hint="Equilibrado funciona bien en la mayoría de entornos." icon={<Waves className="h-4 w-4" />}>
            <select
              className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm"
              value={s.vadMode}
              onChange={(e) => set("vadMode", e.target.value as VadMode)}
              disabled={disabled}
            >
              <option value="relaxed">Relajado (más permisivo)</option>
              <option value="balanced">Equilibrado (recomendado)</option>
              <option value="strict">Estricto (más preciso)</option>
            </select>
          </Row>

          <Row
            label="Fin de frase por silencio"
            hint="Tras cuánto silencio se cierra la intervención del usuario."
            icon={<Waves className="h-4 w-4" />}
            right={<span>{s.endOfSpeechMs} ms</span>}
          >
            <DiscreteSlider
              stepValue={steps.endOfSpeechMs}
              onChange={(st) => set("endOfSpeechMs", fromStep(MAP.endOfSpeechMs, st))}
              disabled={disabled}
            />
          </Row>

          <Row
            label="Duración mínima de voz"
            hint="Ignora microcortes y ruiditos por debajo de este tiempo."
            icon={<Mic className="h-4 w-4" />}
            right={<span>{s.minSpeechMs} ms</span>}
          >
            <DiscreteSlider
              stepValue={steps.minSpeechMs}
              onChange={(st) => set("minSpeechMs", fromStep(MAP.minSpeechMs, st))}
              disabled={disabled}
            />
          </Row>

          <Row
            label="Umbral de confianza STT"
            hint="Descarta transcripciones con baja seguridad."
            icon={<Mic className="h-4 w-4" />}
            right={<span>{Math.round(s.confidenceMin * 100)}%</span>}
          >
            <DiscreteSlider
              stepValue={steps.confidenceMin}
              onChange={(st) => set("confidenceMin", fromStep(MAP.confidenceMinPct, st) / 100)}
              disabled={disabled}
            />
          </Row>

          <Row
            label="Sensibilidad de endpointing"
            hint="Más alto = decide antes que ya no hablas."
            icon={<Waves className="h-4 w-4" />}
            right={<span>{s.endpointSensitivity}%</span>}
          >
            <DiscreteSlider
              stepValue={steps.endpointSensitivity}
              onChange={(st) => set("endpointSensitivity", fromStep(MAP.endpointSensitivity, st))}
              disabled={disabled}
            />
          </Row>

          <Row
            label="Supresión de ruido"
            icon={<Mic className="h-4 w-4" />}
            right={
              <SwitchTiny
                checked={s.noiseSuppression}
                onChange={(v) => set("noiseSuppression", v)}
                disabled={disabled}
              />
            }
          />

          <Row
            label="Cancelación de eco"
            icon={<Mic className="h-4 w-4" />}
            right={
              <SwitchTiny
                checked={s.echoCancellation}
                onChange={(v) => set("echoCancellation", v)}
                disabled={disabled}
              />
            }
          />
        </div>

        {/* ===== POLÍTICAS / IDIOMA / DEBUG ===== */}
        <div className="col-span-1">
          <div className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
            <Shield className="h-3.5 w-3.5" /> Políticas y conocimiento
          </div>

          <Row
            label="Ceñirse al Knowledge"
            hint="Responde solo con info verificada. Si falta, pide más datos."
            icon={<Database className="h-4 w-4" />}
            right={<SwitchTiny checked={s.stickToKnowledge} onChange={(v) => set("stickToKnowledge", v)} disabled={disabled} />}
          />

          <Row
            label="No alucinar (rechazo seguro)"
            hint="Si no está seguro, que lo diga y pregunte."
            icon={<Shield className="h-4 w-4" />}
            right={<SwitchTiny checked={s.refusalGuard} onChange={(v) => set("refusalGuard", v)} disabled={disabled} />}
          />

          <Row
            label="Nivel anti-alucinación"
            hint="0 = más libre · 4 = muy conservador."
            icon={<Shield className="h-4 w-4" />}
            right={<span>{s.hallucinationGuard}%</span>}
          >
            <DiscreteSlider
              stepValue={steps.hallucinationGuard}
              onChange={(st) => set("hallucinationGuard", fromStep(MAP.hallucinationGuard, st))}
              disabled={disabled}
            />
          </Row>

          <div className="mt-2 mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
            <Languages className="h-3.5 w-3.5" /> Idioma y depuración
          </div>

          <Row label="Idioma de transcripción" hint="Afecta a la puntuación y a las tildes." icon={<MessageSquare className="h-4 w-4" />}>
            <select
              className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm"
              value={s.lang}
              onChange={(e) => set("lang", e.target.value)}
              disabled={disabled}
            >
              <option value="es-ES">Español (España) – es-ES</option>
              <option value="es-419">Español (LatAm) – es-419</option>
              <option value="en-US">Inglés (EE. UU.) – en-US</option>
            </select>
          </Row>

          <Row
            label="Mostrar transcripciones interinas"
            icon={<Info className="h-4 w-4" />}
            right={<SwitchTiny checked={s.showInterim} onChange={(v) => set("showInterim", v)} disabled={disabled} />}
          />
        </div>
      </div>
    </div>
  );
}
