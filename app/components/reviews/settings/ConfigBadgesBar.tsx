// app/components/reviews/settings/ConfigBadgesBar.tsx
"use client";

import type { ResponseSettings } from "@/app/schemas/response-settings";
import { Badge } from "@/app/components/ui/badge";

type Bucket = "1-2" | "3" | "4-5";

export type BadgesComputed = {
  targetLang: "es" | "en" | "pt";
  bucket: Bucket;
  objectiveLabel: string;    // texto ya localizado
  lengthLabel: string;       // “Breve / Media / Detallada” (o similar)
  showCTA: boolean;          // CTA efectiva con reglas + enableCTA + texto
};

function langFlag(lang: "es" | "en" | "pt") {
  return lang === "es" ? "🇪🇸" : lang === "pt" ? "🇵🇹" : "🇺🇸";
}

export function ConfigBadgesBar({
  settings,
  computed,
}: {
  settings: ResponseSettings;
  computed: BadgesComputed;
}) {
  return (
    <div className="sticky top-0 z-40 w-full bg-white/85 supports-[backdrop-filter]:bg-white/60 backdrop-blur border-b">
      <div className="mx-auto max-w-7xl px-3 py-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {langFlag(computed.targetLang)} {computed.targetLang.toUpperCase()}
          </Badge>

          <Badge variant="outline" className="text-xs">
            Modo: {settings.publishMode === "draft" ? "Borrador" : "Auto"}
          </Badge>

          <Badge variant="outline" className="text-xs">
            Variantes: {settings.variantsToGenerate}
          </Badge>

          <Badge variant="outline" className="text-xs">
            Modelo: {settings.model}
          </Badge>

          <Badge variant="outline" className="text-xs">
            T: {settings.creativity}
          </Badge>

          <Badge variant="outline" className="text-xs">
            Emojis: {settings.emojiIntensity}
          </Badge>

          <Badge variant="outline" className="text-xs">
            Máx: {settings.maxCharacters} chars
          </Badge>

          <Badge variant="outline" className="text-xs">
            Bucket: {computed.bucket}
          </Badge>

          <Badge variant="outline" className="text-xs">
            Objetivo: {computed.objectiveLabel}
          </Badge>

          <Badge variant="outline" className="text-xs">
            Longitud: {computed.lengthLabel}
          </Badge>

          <Badge variant="outline" className="text-xs">
            CTA: {computed.showCTA ? "activa" : "—"}
          </Badge>

          <Badge variant="outline" className="text-xs">
            {settings.standardSignature?.trim() ? "Firma: activa" : "Firma: —"}
          </Badge>
        </div>
      </div>
    </div>
  );
}
