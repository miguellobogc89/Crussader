// app/components/reviews/settings-test/Header.tsx
"use client";

import { cn } from "@/lib/utils";
import type { ResponseSettings } from "@/app/schemas/response-settings";

export default function Header({
  settings,
  onSave,
  saving = false,
}: {
  settings: ResponseSettings;
  onSave: () => void;
  saving?: boolean;
}) {
  const chipBase =
    "flex items-center gap-1 rounded-full border text-[11px] font-medium px-2.5 py-1 shadow-sm transition-colors";

  const chip = {
    treat: cn(chipBase, "border-sky-200 bg-sky-50 text-sky-700"),
    tone: cn(chipBase, "border-violet-200 bg-violet-50 text-violet-700"),
    emoji: cn(chipBase, "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700"),
    lang: cn(chipBase, "border-indigo-200 bg-indigo-50 text-indigo-700"),
    autodetect: cn(chipBase, "border-indigo-200/60 bg-indigo-50/60 text-indigo-700"),
    biz: cn(chipBase, "border-emerald-200 bg-emerald-50 text-emerald-700"),
    sector: cn(chipBase, "border-teal-200 bg-teal-50 text-teal-700"),
    sig: cn(chipBase, "border-rose-200 bg-rose-50 text-rose-700"),
    cta: cn(chipBase, "border-amber-200 bg-amber-50 text-amber-700"),
    len: cn(chipBase, "border-slate-200 bg-slate-50 text-slate-700"),
    model: cn(chipBase, "border-purple-200 bg-purple-50 text-purple-700"),
    info: cn(chipBase, "border-zinc-200 bg-zinc-50 text-zinc-700"),
  };

  // Derivados seguros
  const tuteo = settings.treatment === "tu" ? "Tuteo" : "Usted";
  const tone = `Tono ${settings.tone}/5`;
  const emojis = `Emojis ${settings.emojiIntensity}/3`;

  const langChip = settings.autoDetectLanguage
    ? null
    : `Idioma: ${(settings.language ?? "es").toUpperCase()}`;
  const autodetectChip = settings.autoDetectLanguage ? "Idioma: Auto" : null;

  const sector = settings.sector ? `Sector: ${settings.sector}` : null;

  const signature =
    settings.standardSignature && settings.standardSignature.trim().length > 0
      ? "Firma: ON"
      : "Firma: OFF";

  const showCTAWhenLabel =
    settings.showCTAWhen === "always"
      ? "CTA: siempre"
      : settings.showCTAWhen === "below3"
      ? "CTA: <3★"
      : "CTA: nunca";

  // Resumen rápido de canales configurados por bucket (si existen)
  const ctas = settings.ctaByRating ?? {};
  const ctaBuckets: string[] = [];
  if (ctas["1-2"]?.channel) ctaBuckets.push(`1-2:${ctas["1-2"]!.channel}`);
  if (ctas["3"]?.channel) ctaBuckets.push(`3:${ctas["3"]!.channel}`);
  if (ctas["4-5"]?.channel) ctaBuckets.push(`4-5:${ctas["4-5"]!.channel}`);
  const ctaDetail = ctaBuckets.length ? `(${ctaBuckets.join(" · ")})` : "";

  const maxChars = `Máx: ${settings.maxCharacters}`;
  const creativity = `Creatividad: ${Math.round((settings.creativity ?? 0) * 100)}%`;
  const model = `Modelo: ${settings.model ?? "gpt-4o"}`;

  return (
    <div
      className="w-full bg-background/80 backdrop-blur-sm border-b"
      style={{ height: 56 }}
    >
      <div className="h-full px-6 flex items-center justify-between">
        {/* Chips dinámicos */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className={chip.treat}>{tuteo}</span>
          <span className={chip.tone}>{tone}</span>
          <span className={chip.emoji}>{emojis}</span>

          {autodetectChip && <span className={chip.autodetect}>{autodetectChip}</span>}
          {langChip && <span className={chip.lang}>{langChip}</span>}


          {sector && <span className={chip.sector}>{sector}</span>}

          <span className={chip.sig}>{signature}</span>

          <span className={chip.cta}>
            {showCTAWhenLabel} {ctaDetail && <span className="opacity-80">{ctaDetail}</span>}
          </span>

          <span className={chip.len}>{maxChars}</span>
          <span className={chip.model}>{model}</span>
          <span className={chip.info}>{creativity}</span>
        </div>

        {/* Botón Guardar */}
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className={cn(
            "text-xs font-medium rounded-full px-3 py-1.5 transition-colors shadow-sm",
            saving
              ? "bg-muted text-muted-foreground cursor-wait"
              : "bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 text-white hover:opacity-90"
          )}
        >
          {saving ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>
    </div>
  );
}
