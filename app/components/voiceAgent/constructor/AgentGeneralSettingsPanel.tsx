"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/app/components/ui/card";
import { Label } from "@/app/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/app/components/ui/select";

// ===== Lista blanca (podemos moverla a constants luego) =====
export const OPENAI_REALTIME_MODELS = [
  "gpt-realtime",
  "gpt-4o-realtime-preview-2024-12-17", // legacy por compatibilidad si lo sigues usando
];

export const OPENAI_REALTIME_VOICES = [
  "marin",
  "cedar",
  "verse",
  "sage",
  "coral",
  "ballad",
  "ash",
  "alloy", // clásica, por si la tienes en presets
];

export const VOICE_STYLES = [
  "neutral",
  "friendly",
  "energetic",
  "serious",
];

export type AgentVoiceSettings = {
  model: string;
  voice: string;
  style: string;
};

export default function AgentGeneralSettingsPanel({
  value,
  onChange,
}: {
  value: AgentVoiceSettings;
  onChange: (next: AgentVoiceSettings) => void;
}) {
  const v = value ?? { model: OPENAI_REALTIME_MODELS[0], voice: "marin", style: "neutral" };

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Ajustes del agente</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Modelo */}
        <div className="space-y-2">
          <Label className="text-xs text-slate-600">Modelo (Realtime)</Label>
          <Select
            value={v.model}
            onValueChange={(model) => onChange({ ...v, model })}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Selecciona modelo" />
            </SelectTrigger>
            <SelectContent>
              {OPENAI_REALTIME_MODELS.map((m) => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Voz */}
        <div className="space-y-2">
          <Label className="text-xs text-slate-600">Voz</Label>
          <Select
            value={v.voice}
            onValueChange={(voice) => onChange({ ...v, voice })}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Selecciona voz" />
            </SelectTrigger>
            <SelectContent>
              {OPENAI_REALTIME_VOICES.map((vv) => (
                <SelectItem key={vv} value={vv}>{vv}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Estilo */}
        <div className="space-y-2">
          <Label className="text-xs text-slate-600">Estilo</Label>
          <Select
            value={v.style}
            onValueChange={(style) => onChange({ ...v, style })}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Selecciona estilo" />
            </SelectTrigger>
            <SelectContent>
              {VOICE_STYLES.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
