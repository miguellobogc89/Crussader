// app/components/reviews/settings/sections/BrandIdentitySection.tsx
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Switch } from "@/app/components/ui/switch";
import { MessageCircle } from "lucide-react";
import type { ResponseSettings } from "@/app/schemas/response-settings";
import { SegmentedControl } from "@/app/components/ui/segmented-control";
import AnimatedSlider from "@/app/components/crussader/UX/controls/AnimatedSlider";

// shadcn/ui Select (picklist) para idioma
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";

export function BrandIdentitySection({
  settings,
  onUpdate,
}: {
  settings: ResponseSettings;
  onUpdate: (updates: Partial<ResponseSettings>) => void;
}) {
  // Helpers: aseguramos enteros para cumplir el schema (.int())
  const setTone = (v: number) => onUpdate({ tone: Math.round(v) });
  const setEmoji = (v: number) => onUpdate({ emojiIntensity: Math.round(v) });

  return (
    <section id="general">
      <Card className="border-none shadow-none bg-transparent">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            Identidad y voz de marca
          </CardTitle>
          <CardDescription>
            Define el nombre comercial, el trato, el tono, emojis e idioma de tus respuestas.
          </CardDescription>

          {/* FILA 0: Nombre comercial + Sector */}
          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-12">
            <div className="md:col-span-6">
              <Label htmlFor="businessName" className="mb-1 block">
                Nombre comercial
              </Label>
              <Input
                id="businessName"
                value={settings.businessName}
                onChange={(e) => onUpdate({ businessName: e.target.value })}
                placeholder="Ej. Clínica Sonrisa"
              />
            </div>
            <div className="md:col-span-6">
              <Label htmlFor="sector" className="mb-1 block">
                Sector
              </Label>
              <Input
                id="sector"
                value={settings.sector}
                onChange={(e) => onUpdate({ sector: e.target.value })}
                placeholder="Ej. Odontología"
              />
            </div>
          </div>

          {/* FILA 1: Tratamiento + Firma */}
          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-12 md:items-end mt-4">

            
            {/* Idioma */}
            <div className="md:col-span-6">
              <Label className="mb-1 block">Idioma preferido</Label>
              <Select
                value={settings.language}
                onValueChange={(v) =>
                  onUpdate({ language: v as ResponseSettings["language"] })
                }
              >
                <SelectTrigger
                  className="w-full"
                  disabled={settings.autoDetectLanguage}
                >
                  <SelectValue placeholder="Selecciona un idioma" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="es">Español 🇪🇸</SelectItem>
                  <SelectItem value="en">Inglés 🇺🇸</SelectItem>
                  <SelectItem value="pt">Portugués 🇵🇹</SelectItem>
                </SelectContent>
              </Select>
              {settings.autoDetectLanguage && (
                <p className="text-xs text-muted-foreground mt-1">
                  Auto-detección activa: el idioma se elegirá según la reseña.
                </p>
              )}
            </div>


            {/* Firma */}
            <div className="md:col-span-6">
              <Label htmlFor="signature" className="mb-1 block">
                Firma estándar
              </Label>
              <Input
                id="signature"
                value={settings.standardSignature}
                onChange={(e) => onUpdate({ standardSignature: e.target.value })}
                placeholder="— Equipo {businessName}"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {`{businessName}`} se reemplazará automáticamente.
              </p>
            </div>


          </div>

          {/* FILA 2: Idioma (picklist) + Auto-detección */}
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-12 md:items-end py-auto">
            {/* Tratamiento */}
            <div className="md:col-span-4 mt-0">
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

            {/* Auto-detección */}
            <div className="md:col-span-6">
              <Label htmlFor="autoLang" className="mb-1 block">
                Auto-detectar idioma
              </Label>
              <div className="flex items-center gap-3">
                <Switch
                  id="autoLang"
                  checked={settings.autoDetectLanguage}
                  onCheckedChange={(checked) =>
                    onUpdate({ autoDetectLanguage: Boolean(checked) })
                  }
                />
                <span className="text-sm text-muted-foreground">
                  Detecta el idioma de la reseña automáticamente.
                </span>
              </div>
            </div>
          </div>

          {/* FILA 3: Sliders (tono / emojis) */}
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

        </CardHeader>

        <CardContent className="px-0" />
      </Card>

      {/* Marca clara para la opción activa del SegmentedControl */}
      <style jsx global>{`
        .segmented-strong [aria-pressed="true"],
        .segmented-strong [data-state="on"] {
          background-color: hsl(var(--primary) / 0.12) !important;
         -color: hsl(var(--primary) / 0.35) !important;
          color: hsl(var(--primary)) !important;
          box-shadow: 0 0 0 2px hsl(var(--primary) / 0.12) inset !important;
        }
      `}</style>
    </section>
  );
}
