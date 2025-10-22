// app/components/reviews/settings/sections/BrandIdentitySection.tsx
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { MessageCircle } from "lucide-react";
import type { ResponseSettings } from "@/app/types/response-settings";
import { GradualSlider } from "@/app/components/ui/gradual-slider";
import { SegmentedControl } from "@/app/components/ui/segmented-control";

export function BrandIdentitySection({
  settings,
  onUpdate,
}: {
  settings: ResponseSettings;
  onUpdate: (updates: Partial<ResponseSettings>) => void;
}) {
  const toneOptions = [
    { value: 0, label: "Sereno", emoji: "😌" },
    { value: 1, label: "Neutral", emoji: "😐" },
    { value: 2, label: "Profesional", emoji: "🧐" },
    { value: 3, label: "Cercano", emoji: "😊" },
    { value: 4, label: "Amable", emoji: "🙂" },
    { value: 5, label: "Entusiasta", emoji: "🤩" },
  ];

  const emojiIntensityOptions = [
    { value: 0, label: "Sin emojis", emoji: "🚫" },
    { value: 1, label: "Pocos", emoji: "🙂" },
    { value: 2, label: "Moderado", emoji: "😄" },
    { value: 3, label: "Muchos", emoji: "🎉" },
  ];

  return (
    <section id="general">
      <Card className="border-none shadow-elegant bg-white/60 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            Identidad y voz de marca
          </CardTitle>
          <CardDescription>Define cómo se presenta tu negocio en las respuestas</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="businessName">Nombre del negocio</Label>
              <Input id="businessName" value={settings.businessName} disabled className="bg-muted/50" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sector">Sector</Label>
              <Input
                id="sector"
                value={settings.sector}
                onChange={(e) => onUpdate({ sector: e.target.value })}
                placeholder="ej. Restauración, Belleza, Retail..."
              />
              <p className="text-xs text-muted-foreground">Ayuda a la IA a entender tu contexto</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tratamiento</Label>
              <SegmentedControl
                options={[
                  { value: "tu", label: "Tú", icon: "👋" },
                  { value: "usted", label: "Usted", icon: "🧍" },
                ]}
                value={settings.treatment}
                onChange={(value) => onUpdate({ treatment: value as "tu" | "usted" })}
              />
            </div>

            <div className="space-y-3">
              <Label>Tono de comunicación</Label>
              <GradualSlider
                value={settings.tone}
                onChange={(value) => onUpdate({ tone: value })}
                options={toneOptions}
                gradient="from-blue-400 to-orange-400"
              />
            </div>

            <div className="space-y-3">
              <Label>Intensidad de emojis</Label>
              <GradualSlider
                value={settings.emojiIntensity}
                onChange={(value) => onUpdate({ emojiIntensity: value })}
                options={emojiIntensityOptions}
                gradient="from-gray-400 to-yellow-400"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="signature">Firma estándar</Label>
              <Input
                id="signature"
                value={settings.standardSignature}
                onChange={(e) => onUpdate({ standardSignature: e.target.value })}
                placeholder="— Equipo {businessName}"
              />
              <p className="text-xs text-muted-foreground">{`{businessName}`} se reemplazará automáticamente</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
