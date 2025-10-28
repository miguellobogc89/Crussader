// app/components/reviews/settings/sections/BrandIdentitySection.tsx
"use client";

import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import type { ResponseSettings } from "@/app/schemas/response-settings";
import { SegmentedControl } from "@/app/components/ui/segmented-control";
import AnimatedSlider from "@/app/components/crussader/UX/controls/AnimatedSlider";

export function BrandIdentitySection({
  settings,
  onUpdate,
}: {
  settings: ResponseSettings;
  onUpdate: (updates: Partial<ResponseSettings>) => void;
}) {
  const setTone = (v: number) => onUpdate({ tone: Math.round(v) });
  const setEmoji = (v: number) => onUpdate({ emojiIntensity: Math.round(v) });

  return (
    <>
      {/* FILA 0: Tipo de negocio */}
      <div className="mb-6">
        <Label htmlFor="business-type" className="mb-1 block">
          Tipo de negocio
        </Label>
        <Input
          id="business-type"
          value={settings.sector ?? ""}
          onChange={(e) => onUpdate({ sector: e.target.value })}
          placeholder="Ejemplo: heladería y cafetería"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Describe tu tipo de negocio (se usará para contextualizar las respuestas automáticas).
        </p>
      </div>

      {/* FILA 1: Tratamiento + Firma */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-12 md:items-end">
        <div className="md:col-span-4">
          <Label className="mb-1 block">Tratamiento</Label>
          <SegmentedControl
            className="w-fit segmented-strong"
            options={[
              { value: "tu", label: "Tú" },
              { value: "usted", label: "Usted" },
            ]}
            value={settings.treatment}
            onChange={(v) => onUpdate({ treatment: v as "tu" | "usted" })}
          />
        </div>

        <div className="md:col-span-8">
          <Label htmlFor="signature" className="mb-1 block">
            Firma estándar
          </Label>
          <Input
            id="signature"
            value={settings.standardSignature}
            onChange={(e) => onUpdate({ standardSignature: e.target.value })}
            placeholder="— Equipo de tu negocio"
          />
        </div>
      </div>

      {/* FILA 2: Sliders (tono / emojis) */}
      <div className="mt-8 flex flex-col gap-8">
        <div>
          <Label className="mb-2 block">Tono de comunicación</Label>
          <AnimatedSlider
            id="tone-slider"
            value={settings.tone}
            options={[
              { value: 0, label: "Sereno", emoji: "😌" },
              { value: 1, label: "Neutral", emoji: "😐" },
              { value: 2, label: "Profesional", emoji: "🧐" },
              { value: 3, label: "Cercano", emoji: "😊" },
              { value: 4, label: "Amable", emoji: "🙂" },
              { value: 5, label: "Entusiasta", emoji: "🤩" },
            ]}
            onChange={setTone}
            gradientFromTo="from-blue-400 to-orange-400"
            thicknessPx={12}
            widthPercent={100}
            showLabels={true}
            emphasizeSelected={true}
            className="pt-1 pb-2"
          />
        </div>

        <div>
          <Label className="mb-2 block">Intensidad de emojis</Label>
          <AnimatedSlider
            id="emoji-intensity-slider"
            value={settings.emojiIntensity}
            options={[
              { value: 0, label: "Sin emojis", emoji: "🚫" },
              { value: 1, label: "Pocos", emoji: "🙂" },
              { value: 2, label: "Moderado", emoji: "😄" },
              { value: 3, label: "Muchos", emoji: "🎉" },
            ]}
            onChange={setEmoji}
            gradientFromTo="from-gray-400 to-yellow-400"
            thicknessPx={12}
            widthPercent={100}
            showLabels={true}
            emphasizeSelected={true}
            className="pt-1 pb-2"
          />
        </div>
      </div>

      {/* estilo activo del segmented */}
      <style jsx global>{`
        .segmented-strong [aria-pressed="true"],
        .segmented-strong [data-state="on"] {
          background-color: hsl(var(--primary) / 0.12) !important;
          border-color: hsl(var(--primary) / 0.35) !important;
          color: hsl(var(--primary)) !important;
          box-shadow: 0 0 0 2px hsl(var(--primary) / 0.12) inset !important;
        }
      `}</style>
    </>
  );
}
