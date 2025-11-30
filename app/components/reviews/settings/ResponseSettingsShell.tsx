// app/components/reviews/setting/ResponseSettingsShell.tsx
"use client";

import { useMemo, useState } from "react";
import type { ResponseSettings } from "@/app/schemas/response-settings";

import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from "@/app/components/ui/card";
import { Label } from "@/app/components/ui/label";
import { Badge } from "@/app/components/ui/badge";
import { Textarea } from "@/app/components/ui/textarea";
import { MessageCircle } from "lucide-react";

import { BrandIdentitySection } from "@/app/components/reviews/settings/sections/BrandIdentitySection";
import { StarRulesSection } from "@/app/components/reviews/settings/sections/StarRulesSection";
import { ChannelsCtaSection } from "@/app/components/reviews/settings/sections/ChannelsCtaSection";
import { PublishingSection } from "@/app/components/reviews/settings/sections/PublishingSection";

import { ConfigBadgesBar } from "@/app/components/reviews/settings/ConfigBadgesBar";
import type { BadgesComputed } from "@/app/components/reviews/settings/ConfigBadgesBar";

import { buildMessagesFromSettings } from "@/lib/ai/reviews/prompt/promptBuilder";

// utils
function isPlainObject(v: unknown): v is Record<string, any> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
function deepMerge<T extends Record<string, any>, U extends Record<string, any>>(a: T, b: U): T & U {
  const out: any = { ...a };
  for (const k of Object.keys(b)) {
    const av = (a as any)[k];
    const bv = (b as any)[k];
    if (isPlainObject(av) && isPlainObject(bv)) out[k] = deepMerge(av, bv);
    else out[k] = bv;
  }
  return out;
}

type ShellProps = {
  initialSettings: ResponseSettings;
  onSettingsChange?: (next: ResponseSettings) => void;
  showPromptDebug?: boolean;
};

export function ResponseSettingsShell({
  initialSettings,
  onSettingsChange,
  showPromptDebug = true,
}: ShellProps) {
  const [settings, setSettings] = useState<ResponseSettings>(initialSettings);
  const [selectedStar, setSelectedStar] = useState<1 | 3 | 5>(5);

  const handleUpdate = (updates: Partial<ResponseSettings> & Record<string, any>) => {
    setSettings((prev) => {
      const next = deepMerge(prev, updates);
      onSettingsChange?.(next);
      return next;
    });
  };

  // mock de reseña para el builder (solo para la preview)
  const reviewMock = useMemo(() => {
    const rating = selectedStar;
    const comment =
      rating <= 2
        ? "Experiencia regular, el servicio podría mejorar..."
        : rating === 3
        ? "Estuvo bien, aunque hay cosas que podrían mejorar..."
        : "¡Excelente experiencia! Todo perfecto, muy recomendable...";
    return { rating, comment, languageCode: null as string | null, reviewerName: "Cliente Ejemplo" };
  }, [selectedStar]);

  // mensajes reales del builder
  const messages = useMemo(
    () => buildMessagesFromSettings(settings, reviewMock),
    [settings, reviewMock]
  );

  // ➜ datos efectivos para la barra (mismos que usa el prompt)
const computedBadges: BadgesComputed = useMemo(() => {
  // bucket por estrella seleccionada
  const bucket = selectedStar <= 2 ? "1-2" : selectedStar === 3 ? "3" : "4-5" as const;
  const starCfg = settings.starSettings[bucket];

  // etiquetas de longitud (coherentes con tus sliders)
  const lengthLabels = ["Breve", "Media", "Detallada"] as const;
  const lengthLabel = lengthLabels[starCfg.length] ?? "—";

  // objetivo localizado (igual que en el builder)
  const objectiveMap: Record<string, Record<"es" | "en" | "pt", string>> = {
    apology: { es: "Disculpa + solución", en: "Apologize + solution", pt: "Desculpa + solução" },
    neutral: { es: "Neutral y cortés", en: "Neutral and polite", pt: "Neutro e educado" },
    thanks:  { es: "Agradecer y fidelizar", en: "Thank and retain", pt: "Agradecer e fidelizar" },
  };
  const targetLang = messages.targetLang as "es" | "en" | "pt";
  const objectiveLabel =
    objectiveMap[starCfg.objective]?.[targetLang] ?? objectiveMap.neutral[targetLang];

  // ✅ CTA efectiva (usa ctaByRating)
  const ruleAllows =
    settings.showCTAWhen === "always" ||
    (settings.showCTAWhen === "below3" && selectedStar < 3) ||
    (settings.showCTAWhen === "above4" && selectedStar >= 4);

  const ctaConfig = settings.ctaByRating?.[bucket];
  const showCTA = Boolean(
    ruleAllows &&
    starCfg.enableCTA &&
    ctaConfig &&
    ctaConfig.text.trim().length > 0
  );

  return {
    targetLang,
    bucket,
    objectiveLabel,
    lengthLabel,
    showCTA,
  };
}, [settings, selectedStar, messages.targetLang]);


  // banner dev: system + user
  const promptPreview = useMemo(
    () => `# system\n${messages.system}\n\n# user\n${messages.user}`,
    [messages]
  );

  return (
    <div className="h-full flex flex-col">
      {/* contenedor scrolleable */}
      <div className="flex-1 overflow-y-auto">
        {/* barra sticky con datos del prompt */}
        <ConfigBadgesBar settings={settings} computed={computedBadges} />

        {/* contenido */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 mx-auto max-w-7xl px-3 py-4">
          <div className="lg:col-span-7 space-y-6">
            <BrandIdentitySection settings={settings} onUpdate={handleUpdate} />
            <StarRulesSection settings={settings} onUpdate={handleUpdate} />
            <ChannelsCtaSection settings={settings} onUpdate={handleUpdate} />
            <PublishingSection settings={settings} onUpdate={handleUpdate} />
          </div>

          <div className="lg:col-span-5 space-y-6">

            {showPromptDebug && (
              <Card className="border-none shadow-none bg-white/60 backdrop-blur-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5 text-primary" />
                    Prompt (solo dev)
                  </CardTitle>
                  <CardDescription>
                    Vista de los mensajes generados a partir de la configuración actual
                  </CardDescription>
                  <div className="pt-2">
                    <Badge variant="secondary" className="text-xs">Reactivo</Badge>
                    <Badge variant="outline" className="text-xs ml-2">Sin guardar</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <Label htmlFor="prompt-preview" className="text-xs text-muted-foreground">
                    Mensajes system + user
                  </Label>
                  <Textarea id="prompt-preview" className="min-h-[240px] text-sm" value={promptPreview} readOnly />
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
