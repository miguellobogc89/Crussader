
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

const LENGTH_LABELS = ["Breve", "Media", "Detallada"] as const;
const TONE_LABELS = [
  "Sereno",
  "Neutral",
  "Profesional",
  "Cercano",
  "Amable",
  "Entusiasta",
] as const;
const TONE_EMOJIS = ["😌", "😐", "🧐", "😊", "🙂", "🤩"] as const;

export function ResponsePreviewPanel({
  settings,
  selectedStar,
  onStarChange,
  showConfigBadges = true,
}: ResponsePreviewPanelProps) {
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

  const sampleReviewByStar: Record<1 | 3 | 5, { title: string; text: string }> = {
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

  function buildPreviewContent(star: 1 | 3 | 5) {
    const bucket = getStarBucket(star);
    const starConfig = settings.starSettings[bucket];
    const ctaConfig = settings.ctaByRating?.[bucket] ?? {
      channel: "web",
      text: "",
      contact: "",
    };
    let response = "";

    const greeting = settings.treatment === "usted" ? "Hola. " : "¡Hola! ";
    const signoff = settings.standardSignature?.trim()
      ? `

${settings.standardSignature}`
      : "";

    const emoji = settings.emojiIntensity > 0 ? toneEmoji : "";

    if (star <= 2) {
      response = `${greeting}${emoji} Sentimos mucho su experiencia. Revisaremos lo ocurrido para solucionarlo.`;
    } else if (star === 3) {
      response = `${greeting}${emoji} Gracias por su opinión. Nos ayuda a mejorar para futuras ocasiones.`;
    } else {
      response = `${greeting}${emoji} ¡Muchas gracias por su reseña positiva! Nos alegra que disfrutara la experiencia.`;
    }

    if (starConfig?.length === 0) {
      response = response.substring(0, 120) + "…";
    } else if (starConfig?.length === 2) {
      response +=
        " Siempre estamos buscando formas de mejorar. Agradecemos cualquier sugerencia adicional.";
    }

    response += signoff;

    const ctaEnabled = Boolean(starConfig?.enableCTA) && shouldShowCTA(star);
    if (ctaEnabled && ctaConfig?.text?.trim()) {
      response += `

${ctaConfig.text}`;
      if (ctaConfig.contact?.trim()) {
        response += `
${ctaConfig.contact}`;
      }
    }

    const max = settings.maxCharacters ?? 500;
    if (response.length > max) {
      response = response.slice(0, Math.max(0, max - 1)) + "…";
    }
    return response;
  }

  const block = useMemo(() => {
    const star = selectedStar;
    const bucket = getStarBucket(star);
    const starConfig = settings.starSettings[bucket];
    const sample = sampleReviewByStar[star];
    const response = buildPreviewContent(star);
    const showCTA = Boolean(starConfig?.enableCTA) && shouldShowCTA(star);

    return {
      star,
      sample,
      response,
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
            <p className="text-sm font-medium">{block.sample.title}</p>
            <p className="text-sm text-muted-foreground mt-1">“{block.sample.text}”</p>
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
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
