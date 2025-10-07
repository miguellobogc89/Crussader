// app/components/voiceAgent/constructor/AgentGeneralSettingsDock.tsx
"use client";

import React, { useMemo, useState } from "react";
import {
  Settings as SettingsIcon,
  ChevronDown,
  ChevronUp,
  Volume2,
  Zap,
  Mic,
  Waves,
  Shield,
  Database,
  Languages,
  Info,
} from "lucide-react";

/** ====== Tipos exportados (compatibles con tu panel anterior) ====== */
export type VadMode = "relaxed" | "balanced" | "strict";

export type AgentGeneralSettings = {
  ttsRate: number;                 // 0.6–1.8 (1.0 normal)
  bargeIn: boolean;
  vadMode: VadMode;
  endOfSpeechMs: number;
  minSpeechMs: number;
  confidenceMin: number;           // 0..1
  endpointSensitivity: number;     // 0..100
  noiseSuppression: boolean;
  echoCancellation: boolean;
  stickToKnowledge: boolean;
  refusalGuard: boolean;
  hallucinationGuard: number;      // 0..100
  lang: string;                    // "es-ES" | ...
  showInterim: boolean;
};

/** ====== Barra compacta: chips resumen ====== */
function Chip({ children, title }: { children: React.ReactNode; title?: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] text-slate-700 ring-1 ring-slate-200"
      title={title}
    >
      {children}
    </span>
  );
}

/** ====== Input simples SIN bordes individuales ====== */
function Row({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="space-y-1">
      <div className="text-sm font-medium text-slate-800">{label}</div>
      {hint ? <div className="text-[11px] text-slate-500">{hint}</div> : null}
      <div className="pt-1">{children}</div>
    </div>
  );
}

function Slider({
  value, min, max, step = 1, onChange, ariaLabel,
}: { value: number; min: number; max: number; step?: number; onChange: (v: number) => void; ariaLabel?: string; }) {
  return (
    <input
      type="range"
      className="w-full accent-indigo-600"
      min={min}
      max={max}
      step={step}
      value={value}
      aria-label={ariaLabel}
      onChange={(e) => onChange(Number(e.target.value))}
    />
  );
}

function Switch({
  value, onChange, ariaLabel,
}: { value: boolean; onChange: (v: boolean) => void; ariaLabel?: string; }) {
  const bg = value ? "bg-indigo-600" : "bg-slate-300";
  const knob = value ? "left-6" : "left-0.5";
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      aria-label={ariaLabel}
      onClick={() => onChange(!value)}
      className={`relative h-6 w-11 rounded-full ${bg}`}
    >
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${knob}`} />
    </button>
  );
}

/** ====== Sección con título e icono, SIN cajas de borde internas ====== */
function Section({
  icon, title, children,
}: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 rounded-xl bg-white/40 p-3">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {icon}
        {title}
      </div>
      <div className="grid gap-4 md:grid-cols-2">{children}</div>
    </section>
  );
}

/** ====== Dock principal (controlado) ====== */
export default function AgentGeneralSettingsDock({
  settings,
  onChange,
  disabled,
}: {
  settings: AgentGeneralSettings;
  onChange: (next: AgentGeneralSettings) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const s = settings;

  const set = <K extends keyof AgentGeneralSettings,>(k: K, v: AgentGeneralSettings[K]) =>
    onChange({ ...s, [k]: v });

  // Resumen compacto
  const summaryChips = useMemo(() => {
    const chips: React.ReactNode[] = [];
    chips.push(
      <Chip key="lang" title="Idioma">
        <Languages className="h-3.5 w-3.5" />
        {s.lang}
      </Chip>
    );
    chips.push(
      <Chip key="tts" title="Velocidad TTS">
        <Volume2 className="h-3.5 w-3.5" />
        {s.ttsRate.toFixed(2)}×
      </Chip>
    );
    chips.push(
      <Chip key="vad" title="VAD">
        <Waves className="h-3.5 w-3.5" />
        {s.vadMode}
      </Chip>
    );
    chips.push(
      <Chip key="barge" title="Barge-in">
        <Zap className="h-3.5 w-3.5" />
        {s.bargeIn ? "On" : "Off"}
      </Chip>
    );
    chips.push(
      <Chip key="guard" title="No alucinar">
        <Shield className="h-3.5 w-3.5" />
        {s.refusalGuard ? "Guard On" : "Guard Off"}
      </Chip>
    );
    return chips;
  }, [s]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white/70 shadow-sm">
      {/* Barra compacta */}
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <SettingsIcon className="h-4 w-4 text-slate-700" />
          <div className="truncate text-sm font-semibold text-slate-900">
            Ajustes globales del agente
          </div>
        </div>

        <div className="hidden flex-1 flex-wrap items-center gap-2 px-3 md:flex">
          {summaryChips}
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          aria-expanded={open}
        >
          {open ? (
            <>
              Contraer <ChevronUp className="h-4 w-4" />
            </>
          ) : (
            <>
              Ampliar <ChevronDown className="h-4 w-4" />
            </>
          )}
        </button>
      </div>

      {/* Panel expandido (ancho total) */}
      {open && (
        <div className="space-y-4 border-t border-slate-200 px-3 pb-3 pt-2">
          {/* Voz y turnos */}
          <Section icon={<Volume2 className="h-3.5 w-3.5" />} title="Voz y turnos">
            <Row label="Velocidad de habla (TTS)" hint="1.0 es normal. 0.6–1.8× para notar cambios.">
              <div className="flex items-center gap-3">
                <Slider
                  value={Number(s.ttsRate.toFixed(2))}
                  min={0.6}
                  max={1.8}
                  step={0.02}
                  onChange={(v) => set("ttsRate", v)}
                  ariaLabel="Velocidad TTS"
                />
                <div className="w-14 text-right text-xs text-slate-600">
                  {s.ttsRate.toFixed(2)}×
                </div>
              </div>
            </Row>

            <Row label="Interrupción inteligente (barge-in)" hint="Permite interrumpir a la IA al detectar voz real.">
              <Switch value={s.bargeIn} onChange={(v) => set("bargeIn", v)} ariaLabel="Barge-in" />
            </Row>
          </Section>

          {/* STT / VAD */}
          <Section icon={<Mic className="h-3.5 w-3.5" />} title="STT / Detección de voz (VAD)">
            <Row label="Modo VAD">
              <select
                className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm"
                value={s.vadMode}
                onChange={(e) => set("vadMode", e.target.value as VadMode)}
                disabled={disabled}
              >
                <option value="relaxed">Relajado (más fluido)</option>
                <option value="balanced">Equilibrado (recomendado)</option>
                <option value="strict">Estricto (preciso)</option>
              </select>
            </Row>

            <Row label="Fin de frase por silencio" hint="Cierra la intervención del usuario tras este silencio.">
              <div className="flex items-center gap-3">
                <Slider
                  value={s.endOfSpeechMs}
                  min={200}
                  max={1500}
                  step={10}
                  onChange={(v) => set("endOfSpeechMs", v)}
                  ariaLabel="Fin de frase por silencio"
                />
                <div className="w-16 text-right text-xs text-slate-600">{s.endOfSpeechMs} ms</div>
              </div>
            </Row>

            <Row label="Duración mínima de voz" hint="Ignora micro-fragmentos por debajo de este umbral.">
              <div className="flex items-center gap-3">
                <Slider
                  value={s.minSpeechMs}
                  min={80}
                  max={600}
                  step={10}
                  onChange={(v) => set("minSpeechMs", v)}
                  ariaLabel="Duración mínima de voz"
                />
                <div className="w-16 text-right text-xs text-slate-600">{s.minSpeechMs} ms</div>
              </div>
            </Row>

            <Row label="Umbral de confianza STT" hint="Descarta transcripciones poco fiables.">
              <div className="flex items-center gap-3">
                <Slider
                  value={Math.round(s.confidenceMin * 100)}
                  min={0}
                  max={100}
                  step={1}
                  onChange={(v) => set("confidenceMin", v / 100)}
                  ariaLabel="Umbral de confianza STT"
                />
                <div className="w-12 text-right text-xs text-slate-600">
                  {Math.round(s.confidenceMin * 100)}%
                </div>
              </div>
            </Row>

            <Row label="Sensibilidad de endpointing" hint="Cuán rápido decide que ya no hablas.">
              <div className="flex items-center gap-3">
                <Slider
                  value={s.endpointSensitivity}
                  min={0}
                  max={100}
                  step={1}
                  onChange={(v) => set("endpointSensitivity", v)}
                  ariaLabel="Sensibilidad de endpointing"
                />
                <div className="w-10 text-right text-xs text-slate-600">{s.endpointSensitivity}%</div>
              </div>
            </Row>

            <Row label="Supresión de ruido">
              <Switch
                value={s.noiseSuppression}
                onChange={(v) => set("noiseSuppression", v)}
                ariaLabel="Supresión de ruido"
              />
            </Row>

            <Row label="Cancelación de eco">
              <Switch
                value={s.echoCancellation}
                onChange={(v) => set("echoCancellation", v)}
                ariaLabel="Cancelación de eco"
              />
            </Row>
          </Section>

          {/* Políticas y conocimiento */}
          <Section icon={<Shield className="h-3.5 w-3.5" />} title="Políticas y conocimiento">
            <Row label="Ceñirse al Knowledge" hint="Solo responde con info disponible; si no, pide datos o deriva.">
              <Switch
                value={s.stickToKnowledge}
                onChange={(v) => set("stickToKnowledge", v)}
                ariaLabel="Ceñirse al Knowledge"
              />
            </Row>

            <Row label="No alucinar (rechazo seguro)" hint="Si no estás seguro, dilo y pide aclaración.">
              <Switch
                value={s.refusalGuard}
                onChange={(v) => set("refusalGuard", v)}
                ariaLabel="No alucinar"
              />
            </Row>

            <Row label="Guardia de alucinación" hint="Más alto = más conservador (menos creatividad).">
              <div className="flex items-center gap-3">
                <Slider
                  value={s.hallucinationGuard}
                  min={0}
                  max={100}
                  step={1}
                  onChange={(v) => set("hallucinationGuard", v)}
                  ariaLabel="Guardia de alucinación"
                />
                <div className="w-10 text-right text-xs text-slate-600">{s.hallucinationGuard}%</div>
              </div>
            </Row>
          </Section>

          {/* Idioma y depuración */}
          <Section icon={<Languages className="h-3.5 w-3.5" />} title="Idioma y depuración">
            <Row label="Idioma de transcripción" hint="Afecta puntuación y mayúsculas.">
              <select
                className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm"
                value={s.lang}
                onChange={(e) => set("lang", e.target.value)}
                disabled={disabled}
              >
                <option value="es-ES">Español (España) – es-ES</option>
                <option value="es-419">Español (LatAm) – es-419</option>
                <option value="en-US">Inglés (EE. UU.) – en-US</option>
              </select>
            </Row>

            <Row label="Mostrar transcripciones interinas">
              <Switch
                value={s.showInterim}
                onChange={(v) => set("showInterim", v)}
                ariaLabel="Mostrar interinas"
              />
            </Row>
          </Section>

          {/* Pie: estado breve */}
          <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500">
            <div className="inline-flex items-center gap-1">
              <Languages className="h-3.5 w-3.5" /> {s.lang}
            </div>
            <div className="inline-flex items-center gap-1">
              <Waves className="h-3.5 w-3.5" /> VAD: {s.vadMode}
            </div>
            <div className="inline-flex items-center gap-1">
              <Volume2 className="h-3.5 w-3.5" /> TTS: {s.ttsRate.toFixed(2)}×
            </div>
            <div className="inline-flex items-center gap-1">
              <Database className="h-3.5 w-3.5" /> Knowledge: {s.stickToKnowledge ? "On" : "Off"}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
