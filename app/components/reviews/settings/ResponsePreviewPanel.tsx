"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Star, MessageCircle, Bot, Sparkles } from "lucide-react";
import type { ResponseSettings } from "@/app/schemas/response-settings";
import { SegmentedControl } from "@/app/components/ui/segmented-control";
import { useMemo } from "react";

interface ResponsePreviewPanelProps {
  settings: ResponseSettings;
  selectedStar: 1 | 3 | 5;
  onStarChange: (star: 1 | 3 | 5) => void;
  showConfigBadges?: boolean;
}

/** Etiquetas para la longitud por índice (0,1,2) */
const LENGTH_LABELS = ["Breve", "Media", "Detallada"] as const;
/** Tono por índice */
const TONE_LABELS = [
  "Sereno",
  "Neutral",
  "Profesional",
  "Cercano",
  "Amable",
  "Entusiasta",
] as const;
/** Emojis sugeridos por tono (fallback incluido) */
const TONE_EMOJIS = ["😌", "😐", "🧐", "😊", "🙂", "🤩"] as const;

export function ResponsePreviewPanel({
  settings,
  selectedStar,
  onStarChange,
  showConfigBadges = true,
}: ResponsePreviewPanelProps) {
  /** --- Utilidades --- */
  const getStarBucket = (star: 1 | 3 | 5) =>
    star <= 2 ? "1-2" : star === 3 ? "3" : "4-5";

  const shouldShowCTA = (star: 1 | 3 | 5) => {
    switch (settings.showCTAWhen) {
      case "always":
        return true;
      case "below3":
        return star < 3;
      case "above4":
        return star >= 4;
      case "never":
      default:
        return false;
    }
  };

  const getLanguageFlag = () => {
    if (settings.autoDetectLanguage) return "🌐";
    switch (settings.language) {
      case "es":
        return "🇪🇸";
      case "pt":
        return "🇵🇹";
      case "en":
        return "🇺🇸";
      default:
        return "🌐";
    }
  };

  const getLengthLabel = (star: 1 | 3 | 5) => {
    const bucket = getStarBucket(star);
    const lenIdx = settings.starSettings[bucket]?.length ?? 1;
    return LENGTH_LABELS[lenIdx] ?? LENGTH_LABELS[1];
  };

  const toneEmoji = TONE_EMOJIS[settings.tone] ?? "😊";

  /** --- Contenido de muestra de reseña según estrellas --- */
  const sampleReviewByStar: Record<1 | 3 | 5, { title: string; text: string }> =
    {
      1: {
        title: "Experiencia negativa",
        text:
          "La atención fue lenta y el pedido llegó incompleto. No repetiré si no mejoran.",
      },
      3: {
        title: "Experiencia correcta",
        text:
          "Estuvo bien en general, aunque la espera fue algo larga. Podría mejorar.",
      },
      5: {
        title: "Experiencia excelente",
        text:
          "Todo perfecto: atención rápida y producto de gran calidad. ¡Muy recomendable!",
      },
    };

  /** --- Generación de respuesta simulada (preview) --- */
  function buildPreviewContent(star: 1 | 3 | 5) {
    const bucket = getStarBucket(star);
    const starConfig = settings.starSettings[bucket];
    const ctaConfig = settings.ctaByRating[bucket];
    let response = "";

    if (star <= 2) {
      response =
        settings.emojiIntensity >= 1
          ? `¡Hola! ${toneEmoji} Lamentamos mucho tu experiencia. Nos tomamos muy en serio todos los comentarios y revisaremos lo ocurrido para corregirlo de inmediato.`
          : `Hola. Lamentamos mucho tu experiencia. Nos tomamos muy en serio todos los comentarios y revisaremos lo ocurrido para corregirlo de inmediato.`;
    } else if (star === 3) {
      response =
        settings.emojiIntensity >= 1
          ? `¡Hola! ${toneEmoji} Gracias por tu reseña. Nos alegra lo positivo y tomamos nota de los puntos a mejorar para ofrecerte una próxima visita más ágil.`
          : `Hola. Gracias por tu reseña. Nos alegra lo positivo y tomamos nota de los puntos a mejorar para ofrecerte una próxima visita más ágil.`;
    } else {
      response =
        settings.emojiIntensity >= 2
          ? `¡Hola! ${toneEmoji} ¡Muchísimas gracias por tu fantástica reseña! 🎉 Nos motiva saber que disfrutaste tanto de tu experiencia.`
          : settings.emojiIntensity >= 1
          ? `¡Hola! ${toneEmoji} Muchísimas gracias por tu fantástica reseña. Nos motiva saber que disfrutaste de tu experiencia.`
          : `Hola. Muchísimas gracias por tu fantástica reseña. Nos motiva saber que disfrutaste de tu experiencia.`;
    }

    // Ajustes de longitud (simulados)
    if (starConfig?.length === 0) {
      response = response.substring(0, 120) + "…";
    } else if (starConfig?.length === 2) {
      response +=
        " Queremos asegurarnos de que cada cliente tenga la mejor experiencia posible. Si tienes alguna sugerencia adicional, estaremos encantados de escucharte.";
    }

    // Firma estándar
    if (settings.standardSignature?.trim()) {
      response += `\n\n${settings.standardSignature}`;
    }

    // CTA por bucket
    const ctaEnabled = Boolean(starConfig?.enableCTA) && shouldShowCTA(star);
    if (ctaEnabled && ctaConfig?.text?.trim()) {
      response += `\n\n${ctaConfig.text}`;
      if (ctaConfig.contact?.trim()) {
        response += `\n${ctaConfig.contact}`;
      }
    }

    // Límite duro por maxCharacters
    const max = settings.maxCharacters ?? 500;
    if (response.length > max) {
      response = response.slice(0, Math.max(0, max - 1)) + "…";
    }
    return response;
  }

  /** --- Prompt DEV (para depuración) --- */
  function buildDevPrompt(star: 1 | 3 | 5) {
    const bucket = getStarBucket(star);
    const cfg = settings.starSettings[bucket];
    const ctaCfg = settings.ctaByRating[bucket];
    const length = getLengthLabel(star);
    const tone = TONE_LABELS[settings.tone] ?? "Neutral";

    return [
      `# Prompt (DEV)`,
      `Idioma: ${settings.autoDetectLanguage ? "AUTO 🌐" : settings.language.toUpperCase()}`,
      `Tono: ${tone} (${toneEmoji})`,
      `Emojis: intensidad ${settings.emojiIntensity}`,
      `Longitud objetivo: ${length} (máx ${settings.maxCharacters} chars)`,
      `Firma estándar: ${settings.standardSignature ? "Sí" : "No"}`,
      `CTA: ${cfg?.enableCTA ? settings.showCTAWhen : "Desactivado"}${
        cfg?.enableCTA && ctaCfg?.text?.trim() ? ` → "${ctaCfg.text}" (${ctaCfg.channel})` : ""
      }`,
      `Modelo: ${settings.model} • T=${settings.creativity} • Variantes=${settings.variantsToGenerate}`,
      `Bucket: ${bucket}`,
      `Reglas: responde en ${settings.autoDetectLanguage ? "AUTO" : settings.language.toUpperCase()}, sin datos falsos; agradecer o disculpar según estrellas; firma si procede; CTA según regla.`,
    ].join("\n");
  }

  /** --- Único bloque (según selectedStar) --- */
  const block = useMemo(() => {
    const star = selectedStar;
    const bucket = getStarBucket(star);
    const starConfig = settings.starSettings[bucket];
    const sample = sampleReviewByStar[star];
    const response = buildPreviewContent(star);
    const devPrompt = buildDevPrompt(star);
    const showCTA = Boolean(starConfig?.enableCTA) && shouldShowCTA(star);

    return {
      star,
      sample,
      response,
      devPrompt,
      showCTA,
      bucket,
      lengthLabel: getLengthLabel(star),
    };
  }, [selectedStar, settings]);

  return (
    <Card className="border-none shadow-none bg-white sticky top-2">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              Preview de respuesta
            </CardTitle>
            <CardDescription>
              Así se verá la respuesta con tu configuración para la selección actual
            </CardDescription>
          </div>

          {/* Selector compacto, alineado a la derecha */}
          <div className="pt-1">
            <SegmentedControl
              className="min-w-[180px] justify-end text-sm"
              options={[
                { value: "1", label: "1", icon: "⭐" },
                { value: "3", label: "3", icon: "⭐" },
                { value: "5", label: "5", icon: "⭐" },
              ]}
              value={String(selectedStar)}
              onChange={(v) => onStarChange(parseInt(v, 10) as 1 | 3 | 5)}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-8">
        {/* Badges de configuración */}
        {showConfigBadges && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Configuración aplicada
            </h4>

            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="text-xs">
                {getLanguageFlag()} {settings.autoDetectLanguage ? "AUTO" : settings.language.toUpperCase()}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {settings.publishMode === "draft" ? "📄 Borrador" : "🚀 Publicación automática"}
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
                CTA: {settings.showCTAWhen === "never" ? "Desactivado" : settings.showCTAWhen}
              </Badge>
              {settings.standardSignature?.trim() && (
                <Badge variant="outline" className="text-xs">
                  Firma: activa
                </Badge>
              )}
            </div>

            <div className="text-xs text-muted-foreground">
              Longitud: {block.lengthLabel} • Máx: {settings.maxCharacters} chars •
              &nbsp;Tono: {TONE_LABELS[settings.tone] ?? "Neutral"}
            </div>
          </div>
        )}

        {/* Bloque de preview */}
        <div className="rounded-xl border overflow-hidden">
          <div className="bg-muted/30 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={
                      i < (block.star === 1 ? 1 : block.star === 3 ? 3 : 5)
                        ? "h-4 w-4 fill-yellow-400 text-yellow-400"
                        : "h-4 w-4 text-muted-foreground"
                    }
                  />
                ))}
              </div>
              <Badge variant="outline" className="text-xs">
                Ejemplo {block.star}★
              </Badge>
              <Badge variant="secondary" className="text-xs">
                Longitud: {block.lengthLabel}
              </Badge>
            </div>
            <div className="text-xs px-2 py-1 rounded-md border bg-primary/10 border-primary/30 text-primary">
              {block.star} ⭐
            </div>
          </div>

          <div className="px-4 pt-4">
            <p className="text-sm font-medium">{sampleReviewByStar[block.star].title}</p>
            <p className="text-sm text-muted-foreground mt-1">“{sampleReviewByStar[block.star].text}”</p>
            <p className="text-xs text-muted-foreground mt-2">— Cliente Ejemplo</p>
          </div>

          <div className="m-4 mt-3 rounded-lg border bg-gradient-to-br from-primary/5 to-primary/10 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Bot className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">Respuesta generada</span>
              {block.showCTA && (
                <Badge variant="secondary" className="text-xs">
                  CTA
                </Badge>
              )}
              <Badge variant="outline" className="text-[10px]">
                Bucket: {block.bucket}
              </Badge>
            </div>

            <div className="whitespace-pre-wrap text-sm leading-relaxed">
              {block.response}
            </div>

            {/* Prompt DEV */}
            <div className="mt-4 rounded-md border bg-amber-50/60 p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-900">
                  Prompt (solo DEV)
                </span>
                <Badge variant="outline" className="text-[10px]">
                  {settings.model} • T={settings.creativity} • Var={settings.variantsToGenerate}
                </Badge>
              </div>
              <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap text-[11px] leading-snug text-amber-900">
                {block.devPrompt}
              </pre>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
