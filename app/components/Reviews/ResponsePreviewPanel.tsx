// app/component/ResponseReviewPanel
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Star, MessageCircle, Bot, Sparkles } from "lucide-react";
import type { ResponseSettings } from "@/app/types/response-settings";
import { SegmentedControl } from "@/app/components/ui/segmented-control";

interface ResponsePreviewPanelProps {
  settings: ResponseSettings;
  selectedStar: 1 | 3 | 5;
  onStarChange: (star: 1 | 3 | 5) => void;
}

export function ResponsePreviewPanel({ settings, selectedStar, onStarChange }: ResponsePreviewPanelProps) {
  const getPreviewContent = () => {
    const starConfig = selectedStar <= 2
      ? settings.starSettings["1-2"]
      : selectedStar === 3
        ? settings.starSettings["3"]
        : settings.starSettings["4-5"];

    const toneEmojis = ["😌", "😐", "🧐", "😊", "🙂", "🤩"];
    const toneEmoji = toneEmojis[settings.tone] || "😊";

    let response = "";
    if (selectedStar <= 2) {
      response = settings.emojiIntensity >= 1
        ? `¡Hola! ${toneEmoji} Lamentamos mucho tu experiencia. Nos tomamos muy en serio todos los comentarios...`
        : `Hola. Lamentamos mucho tu experiencia. Nos tomamos muy en serio todos los comentarios...`;
    } else if (selectedStar === 3) {
      response = settings.emojiIntensity >= 1
        ? `¡Hola! ${toneEmoji} Gracias por tu reseña. Valoramos tu feedback y siempre buscamos mejorar...`
        : `Hola. Gracias por tu reseña. Valoramos tu feedback y siempre buscamos mejorar...`;
    } else {
      response = settings.emojiIntensity >= 2
        ? `¡Hola! ${toneEmoji} ¡Muchísimas gracias por tu fantástica reseña! 🎉 Nos alegra saber que...`
        : settings.emojiIntensity >= 1
          ? `¡Hola! ${toneEmoji} Muchísimas gracias por tu fantástica reseña. Nos alegra saber que...`
          : `Hola. Muchísimas gracias por tu fantástica reseña. Nos alegra saber que...`;
    }

    if (starConfig.length === 0) {
      response = response.substring(0, 120) + "...";
    } else if (starConfig.length === 2) {
      response += " Queremos asegurarnos de que cada cliente tenga la mejor experiencia posible. Si tienes alguna sugerencia adicional, no dudes en contactarnos.";
    }

    response += `\n\n${settings.standardSignature}`;

    if (starConfig.enableCTA && shouldShowCTA()) {
      response += `\n\n${settings.ctaText}`;
    }

    return response;
  };

  const shouldShowCTA = () => {
    switch (settings.showCTAWhen) {
      case "always": return true;
      case "below3": return selectedStar < 3;
      case "above4": return selectedStar >= 4;
      case "never": return false;
      default: return false;
    }
  };

  const getLanguageFlag = () => {
    switch (settings.language) {
      case "es": return "🇪🇸";
      case "pt": return "🇵🇹";
      case "en": return "🇺🇸";
      default: return "🌐";
    }
  };

  return (
    <Card className="border-none shadow-elegant bg-white/60 backdrop-blur-sm sticky top-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-primary" />
          Preview de respuesta
        </CardTitle>
        <CardDescription>Ve cómo se verán las respuestas con tu configuración</CardDescription>

        <div className="pt-4">
          <SegmentedControl
            options={[
              { value: "1", label: "1★", icon: "⭐" },
              { value: "3", label: "3★", icon: "⭐" },
              { value: "5", label: "5★", icon: "⭐" }
            ]}
            value={selectedStar.toString()}
            onChange={(value) => onStarChange(parseInt(value) as 1 | 3 | 5)}
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="bg-muted/30 rounded-lg p-4 border-l-4 border-primary/30">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${i < selectedStar ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`}
                />
              ))}
            </div>
            <Badge variant="outline" className="text-xs">Ejemplo</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {selectedStar <= 2
              ? "Experiencia regular, el servicio podría mejorar..."
              : selectedStar === 3
                ? "Estuvo bien, aunque hay cosas que podrían mejorar..."
                : "¡Excelente experiencia! Todo perfecto, muy recomendable..."}
          </p>
          <p className="text-xs text-muted-foreground mt-2">— Cliente Ejemplo</p>
        </div>

        <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg p-4 border">
          <div className="flex items-center gap-2 mb-3">
            <Bot className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Respuesta generada</span>
            {shouldShowCTA() && <Badge variant="secondary" className="text-xs">CTA</Badge>}
          </div>

          <div className="whitespace-pre-wrap text-sm leading-relaxed">
            {getPreviewContent()}
          </div>
        </div>

        <div className="space-y-3 pt-4 border-t">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Configuración aplicada
          </h4>

          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="text-xs">
              {getLanguageFlag()} {settings.language.toUpperCase()}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {settings.publishMode === "draft" ? "📄 Borrador" : "🚀 Auto"}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {settings.variantsToGenerate} variante{settings.variantsToGenerate !== 1 ? "s" : ""}
            </Badge>
            <Badge variant="outline" className="text-xs">{settings.model}</Badge>
            <Badge variant="outline" className="text-xs">T: {settings.creativity}</Badge>
          </div>

          <div className="text-xs text-muted-foreground">
            <div>
              Longitud: {["Breve", "Media", "Detallada"][
                selectedStar <= 2
                  ? settings.starSettings["1-2"].length
                  : selectedStar === 3
                    ? settings.starSettings["3"].length
                    : settings.starSettings["4-5"].length
              ]} • Máx: {settings.maxCharacters} chars
            </div>
            <div>Tono: {["Sereno", "Neutral", "Profesional", "Cercano", "Amable", "Entusiasta"][settings.tone]}</div>
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          <Button size="sm" variant="outline" className="flex-1">Probar prompt</Button>
          <Button size="sm" variant="outline" className="flex-1">Generar ejemplo</Button>
        </div>
      </CardContent>
    </Card>
  );
}
