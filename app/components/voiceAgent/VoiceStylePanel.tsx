// app/dashboard/voiceagent/components/VoiceStylePanel.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { loadAgentSettings, saveAgentSettings } from "@app/dashboard/admin/voiceagents/actions/actions";
import { Button } from "@/app/components/ui/button";
import { Label } from "@/app/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/app/components/ui/radio-group";
import { Loader2, CheckCircle2, RotateCcw } from "lucide-react";

type Tone = 0 | 1 | 2;                  // 0=cercano 1=neutral 2=formal
type Gender = "male" | "female" | "mixed";
type IdentityMode = "branded" | "named" | "anonymous";

export default function VoiceStylePanel({
  companyId,
  onPreviewChange,                   // {controls:{formality}}
  onVoiceConfigChange,              // {gender}
  onIdentityChange,                 // {mode,name?}
  onClosingChange,                  // boolean
  onTemperatureChange,              // number
  onTtsRateChange,                  // number (0.8..1.6)
  onPickSystemVoice,                // voiceURI | undefined
  onResetChat,                      // () => void
}: {
  companyId: string;
  onPreviewChange?: (style: any) => void;
  onVoiceConfigChange?: (v: { gender: Gender }) => void;
  onIdentityChange?: (v: { mode: IdentityMode; name?: string }) => void;
  onClosingChange?: (closing: boolean) => void;
  onTemperatureChange?: (temp: number) => void;
  onTtsRateChange?: (rate: number) => void;
  onPickSystemVoice?: (voiceURI: string | undefined) => void;
  onResetChat?: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<Record<string, any>>({});

  // ===== Estado =====
  const [tone, setTone] = useState<Tone>(1);
  const [gender, setGender] = useState<Gender>("mixed");
  const [closingQuestion, setClosingQuestion] = useState<boolean>(true);
  const [temperature, setTemperature] = useState<number>(0.5);
  const [identityMode, setIdentityMode] = useState<IdentityMode>("branded");
  const [identityName, setIdentityName] = useState<string>("");

  // TTS
  const [ttsRate, setTtsRate] = useState<number>(1.25);
  const [systemVoices, setSystemVoices] = useState<{ uri: string; name: string; lang: string }[]>([]);
  const [pickedVoiceId, setPickedVoiceId] = useState<string | "">("");

  // ===== Carga =====
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const data = await loadAgentSettings(companyId);
        if (!alive) return;
        setSettings(data || {});

        const curTone = data?.style?.controls?.formality;
        setTone(curTone === 0 || curTone === 1 || curTone === 2 ? curTone : 1);

        const curGender = data?.style?.voice?.gender as Gender | undefined;
        setGender(curGender === "male" || curGender === "female" || curGender === "mixed" ? curGender : "mixed");

        setClosingQuestion(typeof data?.style?.closingQuestion === "boolean" ? data.style.closingQuestion : true);

        const t = data?.llm?.temperature;
        setTemperature(typeof t === "number" ? clamp(t, 0, 1) : 0.5);

        const im = data?.style?.identity?.mode as IdentityMode | undefined;
        const iname = (data?.style?.identity?.name as string | undefined) ?? "";
        setIdentityMode(im === "named" || im === "anonymous" || im === "branded" ? im : "branded");
        setIdentityName(iname);

        const r = data?.style?.voice?.rate;
        setTtsRate(typeof r === "number" ? clamp(r, 0.5, 2) : 1.25);

        const voiceURI = data?.style?.voice?.voiceURI as string | undefined;
        setPickedVoiceId(voiceURI ?? "");
        onPickSystemVoice?.(voiceURI);
      } catch (e: any) {
        setError(e?.message || "No se pudieron cargar los ajustes");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  // Voces del sistema (solo cliente)
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const synth = window.speechSynthesis;
    const load = () => {
      const vs = synth.getVoices().map(v => ({ uri: v.voiceURI, name: v.name, lang: v.lang || "" }));
      const sorted = vs.sort((a, b) => {
        const aEs = a.lang.toLowerCase().startsWith("es") ? 1 : 0;
        const bEs = b.lang.toLowerCase().startsWith("es") ? 1 : 0;
        return bEs - aEs || a.name.localeCompare(b.name);
      });
      setSystemVoices(sorted);
    };
    load();
    synth.onvoiceschanged = load;
  }, []);

  // ===== Live preview =====
  useEffect(() => { onPreviewChange?.({ controls: { formality: tone } }); /* eslint-disable-next-line */ }, [tone]);
  useEffect(() => { onVoiceConfigChange?.({ gender }); /* eslint-disable-next-line */ }, [gender]);
  useEffect(() => { onIdentityChange?.({ mode: identityMode, name: identityName?.trim() || undefined }); /* eslint-disable-next-line */ }, [identityMode, identityName]);
  useEffect(() => { onClosingChange?.(closingQuestion); /* eslint-disable-next-line */ }, [closingQuestion]);
  useEffect(() => { onTemperatureChange?.(temperature); /* eslint-disable-next-line */ }, [temperature]);
  useEffect(() => { onTtsRateChange?.(ttsRate); /* eslint-disable-next-line */ }, [ttsRate]);

  // Dirty
  const dirty = useMemo(() => {
    const curTone = settings?.style?.controls?.formality;
    const savedTone: Tone = curTone === 0 || curTone === 1 || curTone === 2 ? curTone : 1;

    const savedGender: Gender =
      settings?.style?.voice?.gender === "male" || settings?.style?.voice?.gender === "female" || settings?.style?.voice?.gender === "mixed"
        ? settings.style.voice.gender
        : "mixed";

    const savedClosing = typeof settings?.style?.closingQuestion === "boolean" ? settings.style.closingQuestion : true;
    const savedTemp = typeof settings?.llm?.temperature === "number" ? clamp(settings.llm.temperature, 0, 1) : 0.5;

    const savedIMode: IdentityMode =
      settings?.style?.identity?.mode === "named" ||
      settings?.style?.identity?.mode === "anonymous" ||
      settings?.style?.identity?.mode === "branded"
        ? settings.style.identity.mode
        : "branded";
    const savedIName = (settings?.style?.identity?.name as string | undefined) ?? "";

    const savedRate = typeof settings?.style?.voice?.rate === "number" ? clamp(settings.style.voice.rate, 0.5, 2) : 1.25;
    const savedVoiceURI = (settings?.style?.voice?.voiceURI as string | undefined) ?? "";

    return (
      savedTone !== tone ||
      savedGender !== gender ||
      savedClosing !== closingQuestion ||
      Math.abs(savedTemp - temperature) > 1e-4 ||
      savedIMode !== identityMode ||
      savedIName !== identityName ||
      Math.abs(savedRate - ttsRate) > 1e-4 ||
      savedVoiceURI !== pickedVoiceId
    );
  }, [settings, tone, gender, closingQuestion, temperature, identityMode, identityName, ttsRate, pickedVoiceId]);

  // Guardar
  async function onSave() {
    try {
      setSaving(true);
      setError(null);
      const next = {
        ...settings,
        llm: { ...(settings?.llm || {}), temperature: clamp(temperature, 0, 1) },
        style: {
          ...(settings?.style || {}),
          closingQuestion,
          controls: { ...(settings?.style?.controls || {}), formality: tone },
          voice: {
            ...(settings?.style?.voice || {}),
            gender,
            rate: clamp(ttsRate, 0.5, 2),
            voiceURI: pickedVoiceId || undefined,
          },
          identity: { ...(settings?.style?.identity || {}), mode: identityMode, name: identityName?.trim() || undefined },
        },
      };
      await saveAgentSettings(companyId, next);
      setSettings(next);
    } catch (e: any) {
      setError(e?.message || "No se pudieron guardar los ajustes");
    } finally {
      setSaving(false);
    }
  }

  return (
    <aside className="flex h-full flex-col rounded-3xl border border-slate-200 bg-white/80 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/60">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-3xl border-b border-slate-200 bg-white/80 px-4 py-3">
        <div>
          <div className="text-sm font-semibold text-slate-800">Ajustes rápidos</div>
          <div className="text-xs text-slate-500">Impactan en el chat y en voz (demo web).</div>
        </div>
        <Button type="button" variant="ghost" className="h-8 gap-1 rounded-xl text-xs" onClick={() => onResetChat?.()} title="Reiniciar conversación">
          <RotateCcw className="h-4 w-4" />
          Reset
        </Button>
      </div>

      {/* Contenido */}
      <div className="flex-1 space-y-6 overflow-auto px-4 py-4">
        {/* Estilo */}
        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Estilo</h3>

          {/* Tono */}
          <div className="space-y-2">
            <Label className="text-sm text-slate-700">Tono de respuesta</Label>
            <RadioGroup value={String(tone)} onValueChange={(v) => setTone(Number(v) as Tone)} className="flex gap-2">
              <Pill value="0" label="Cercano" />
              <Pill value="1" label="Neutral" />
              <Pill value="2" label="Formal" />
            </RadioGroup>
          </div>

          {/* Cierre con pregunta */}
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-slate-700">Cierre con pregunta</div>
            <label className="inline-flex cursor-pointer items-center">
              <input type="checkbox" className="peer sr-only" checked={closingQuestion} onChange={(e) => setClosingQuestion(e.target.checked)} />
              <span className="relative h-6 w-10 rounded-full bg-slate-300 transition peer-checked:bg-slate-800">
                <span className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition peer-checked:translate-x-4" />
              </span>
            </label>
          </div>

          {/* Temperatura */}
          <div className="mt-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm text-slate-700">Temperatura</Label>
              <span className="text-xs font-medium text-slate-600">{temperature.toFixed(2)}</span>
            </div>
            <input type="range" min={0} max={1} step={0.01} value={temperature} onChange={(e) => setTemperature(Number(e.target.value))} className="mt-2 w-full accent-slate-800" />
            <div className="mt-1 flex justify-between text-[10px] text-slate-500">
              <span>Más determinista</span><span>Más creativo</span>
            </div>
          </div>
        </section>

        <hr className="border-slate-200" />

        {/* Presentación */}
        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Presentación</h3>

          <div className="space-y-2">
            <Label className="text-sm text-slate-700">Modo</Label>
            <RadioGroup value={identityMode} onValueChange={(v) => setIdentityMode(v as IdentityMode)} className="flex flex-wrap gap-2">
              <Pill value="branded" label="Asistente de la marca" />
              <Pill value="named" label="Con nombre" />
              <Pill value="anonymous" label="Anónimo" />
            </RadioGroup>
          </div>

          {identityMode === "named" && (
            <div className="mt-3">
              <Label htmlFor="assistant_name" className="text-sm text-slate-700">Nombre del asistente</Label>
              <input id="assistant_name" value={identityName} onChange={(e) => setIdentityName(e.target.value)} placeholder="Ej. Alex / Emily"
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white/70 px-3 py-2 text-sm outline-none ring-0 focus:border-slate-400" />
              <p className="mt-1 text-[11px] text-slate-500">Se usará en la presentación inicial y no se repetirá.</p>
            </div>
          )}
        </section>

        <hr className="border-slate-200" />

        {/* Voz (demo web) */}
        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Voz (demo web)</h3>

          <div className="space-y-2">
            <Label className="text-sm text-slate-700">Género</Label>
            <RadioGroup value={gender} onValueChange={(v) => setGender(v as Gender)} className="flex gap-2">
              <Pill value="female" label="Femenina" />
              <Pill value="male" label="Masculina" />
              <Pill value="mixed" label="Mixta" />
            </RadioGroup>
          </div>

          {/* Velocidad TTS */}
          <div className="mt-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm text-slate-700">Velocidad de voz</Label>
              <span className="text-xs font-medium text-slate-600">{ttsRate.toFixed(2)}×</span>
            </div>
            <input type="range" min={0.8} max={1.6} step={0.01} value={ttsRate} onChange={(e) => setTtsRate(Number(e.target.value))}
              className="mt-2 w-full accent-slate-800" />
            <div className="mt-1 flex justify-between text-[10px] text-slate-500">
              <span>Más lenta</span><span>Más rápida</span>
            </div>
          </div>

          {/* Selector de voz del sistema */}
          <div className="mt-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm text-slate-700">Voz del sistema (opcional)</Label>
            </div>
            <select
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white/70 px-3 py-2 text-sm outline-none focus:border-slate-400"
              value={pickedVoiceId}
              onChange={(e) => {
                const v = e.target.value;
                setPickedVoiceId(v);
                onPickSystemVoice?.(v || undefined);
              }}
            >
              <option value="">(Automática por género)</option>
              {systemVoices.map((v) => (
                <option key={v.uri} value={v.uri}>
                  {v.name} — {v.lang}
                </option>
              ))}
            </select>
            <p className="mt-1 text-[11px] text-slate-500">
              Si eliges una voz concreta (p. ej. <em>Microsoft Pablo</em> / <em>Jorge</em>), se usará siempre.
            </p>
          </div>

          <p className="mt-2 text-[11px] text-slate-500">
            La voz depende del sistema/navegador. En producción usaremos proveedor TTS para control total.
          </p>
        </section>

        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      </div>

      {/* Footer */}
      <div className="sticky bottom-0 z-10 flex items-center justify-between gap-3 rounded-b-3xl border-t border-slate-200 bg-white/80 px-4 py-3">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <CheckCircle2 className="h-4 w-4" />
          {loading ? "Cargando…" : dirty ? "Cambios sin guardar" : "Ajustes al día"}
        </div>
        <Button onClick={onSave} disabled={!dirty || saving} className="rounded-xl" title="Guardar ajustes">
          {saving ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Guardando…</>) : "Guardar"}
        </Button>
      </div>
    </aside>
  );
}

/* ===== Utils ===== */
function clamp(n: number, min: number, max: number) { return Math.min(max, Math.max(min, n)); }
function Pill({ value, label }: { value: string; label: string }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white/70 px-3 py-2 hover:bg-slate-50">
      <RadioGroupItem value={value} id={`opt_${value}`} />
      <span className="text-sm text-slate-700">{label}</span>
    </label>
  );
}
