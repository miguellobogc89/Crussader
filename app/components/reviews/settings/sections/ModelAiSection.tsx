// app/components/reviews/settings/sections/ModelAiSection.tsx
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Label } from "@/app/components/ui/label";
import { Badge } from "@/app/components/ui/badge";
import { Sparkles } from "lucide-react";
import type { ResponseSettings } from "@/app/types/response-settings";
import { GradualSlider } from "@/app/components/ui/gradual-slider";

export function ModelAiSection({
  settings,
  onUpdate,
}: {
  settings: ResponseSettings;
  onUpdate: (updates: Partial<ResponseSettings>) => void;
}) {
  const creativityOptions = [
    { value: 0, label: "Conservadora", emoji: "💼" },
    { value: 0.3, label: "Equilibrada", emoji: "⚖️" },
    { value: 0.6, label: "Creativa", emoji: "💡" },
    { value: 0.9, label: "Muy creativa", emoji: "✨" },
  ];

  return (
    <section id="model">
      <Card className="border-none shadow-elegant bg-white/60 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Modelo y creatividad (IA)
          </CardTitle>
          <CardDescription>Configuración técnica del modelo de IA</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Modelo</Label>
            <Select value={settings.model} onValueChange={(value) => onUpdate({ model: value as any })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="gpt-4o">GPT-4o (Recomendado)</SelectItem>
                <SelectItem value="gpt-4o-mini">GPT-4o Mini (Más rápido)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label>Creatividad/Temperatura</Label>
            <GradualSlider
              value={settings.creativity}
              onChange={(value) => onUpdate({ creativity: value })}
              options={creativityOptions}
              gradient="from-slate-400 to-violet-400"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxChars">Máximo de caracteres</Label>
            <div className="flex items-center space-x-4">
              <input
                type="range"
                id="maxChars"
                min={100}
                max={1000}
                step={50}
                value={settings.maxCharacters}
                onChange={(e) => onUpdate({ maxCharacters: parseInt(e.target.value) })}
                className="flex-1"
              />
              <Badge variant="outline" className="min-w-20 justify-center">
                {settings.maxCharacters}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
