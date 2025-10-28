"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Label } from "@/app/components/ui/label";
import type { ResponseSettings } from "@/app/schemas/response-settings";
import AnimatedSlider from "@/app/components/crussader/UX/controls/AnimatedSlider";

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
    <>
      {/* Modelo */}
      <div className="space-y-2">
        <Label>Modelo</Label>
        <Select
          value={settings.model}
          onValueChange={(value) => onUpdate({ model: value as ResponseSettings["model"] })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecciona modelo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="gpt-4o">GPT-4o (Recomendado)</SelectItem>
            <SelectItem value="gpt-4o-mini">GPT-4o Mini (Más rápido)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Creatividad */}
      <div className="space-y-3 mt-6">
        <Label>Creatividad / Temperatura</Label>
        <AnimatedSlider
          id="creativity-slider"
          value={settings.creativity}
          onChange={(value) => onUpdate({ creativity: value })}
          options={creativityOptions}
          gradientFromTo="from-slate-400 to-violet-400"
          thicknessPx={12}
          widthPercent={100}
          showLabels={true}
          emphasizeSelected={true}
        />
      </div>
    </>
  );
}
