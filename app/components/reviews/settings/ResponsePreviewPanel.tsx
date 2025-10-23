// app/components/reviews/settings/ResponsePreviewPanel.tsx
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Star, MessageCircle, Bot, Sparkles, Loader2 } from "lucide-react";
import type { ResponseSettings } from "@/app/schemas/response-settings";
import { SegmentedControl } from "@/app/components/ui/segmented-control";
import { usePreviewResponse } from "@/hooks/usePreviewResponse";
import { useEffect, useState } from "react";

interface ResponsePreviewPanelProps {
  settings: ResponseSettings;
  selectedStar: 1 | 3 | 5;
  onStarChange: (star: 1 | 3 | 5) => void;
}

export function ResponsePreviewPanel({
  settings,
  selectedStar,
  onStarChange,
}: ResponsePreviewPanelProps) {
  const [manualTrigger, setManualTrigger] = useState(false);

  // Texto de ejemplo según estrellas
  const sampleReviewByStar: Record<1 | 3 | 5, string> = {
    1: "La atención fue lenta y el pedido llegó incompleto. No repetiré si no mejoran.",
    3: "Estuvo bien en general, aunque la espera fue algo larga. Podría mejorar.",
    5: "Todo perfecto: atención rápida y producto de gran calidad. ¡Muy recomendable!",
  };

  const { loading, data, error, fetchResponse } = usePreviewResponse({
    review: { content: sampleReviewByStar[selectedStar] },
    settings,
  });

  // Si se cambia la configuración o las estrellas, recarga automáticamente
  useEffect(() => {
    if (manualTrigger) fetchResponse();
  }, [selectedStar, settings, manualTrigger]);

  const shouldShowCTA = () => {
    switch (settings.showCTAWhen) {
      case "always":
        return true;
      case "below3":
        return selectedStar < 3;
      case "above4":
        return selectedStar >= 4;
      case "never":
      default:
        return false;
    }
  };

  const getLanguageFlag = () => {
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

  return (
    <Card className="border-none shadow-none bg-white sticky top-2">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-primary" />
          Preview de respuesta
        </CardTitle>
        <CardDescription>
          Así es cómo se verán las respuestas con tu configuración
        </CardDescription>

        <div className="pt-3">
          <SegmentedControl
            options={[
              { value: "1", label: "1★", icon: "⭐" },
              { value: "3", label: "3★", icon: "⭐" },
              { value: "5", label: "5★", icon: "⭐" },
            ]}
            value={selectedStar.toString()}
            onChange={(value) => onStarChange(parseInt(value) as 1 | 3 | 5)}
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Reseña simulada */}
        <div className="bg-muted/30 rounded-lg p-4 border-l-4 border-primary/30">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i < selectedStar
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-muted-foreground"
                  }`}
                />
              ))}
            </div>
            <Badge variant="outline" className="text-xs">
              Ejemplo
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            “{sampleReviewByStar[selectedStar]}”
          </p>
          <p className="text-xs text-muted-foreground mt-2">— Cliente Ejemplo</p>
        </div>

        {/* Respuesta generada */}
        <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg p-4 border">
          <div className="flex items-center gap-2 mb-3">
            <Bot className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">
              Respuesta generada
            </span>
            {shouldShowCTA() && (
              <Badge variant="secondary" className="text-xs">
                CTA
              </Badge>
            )}
          </div>

          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              Generando respuesta…
            </div>
          ) : error ? (
            <div className="text-sm text-red-500">
              ⚠️ Error al generar respuesta: {error}
            </div>
          ) : (
            <div className="whitespace-pre-wrap text-sm leading-relaxed">
              {data?.result || "(Haz clic en 'Generar ejemplo')"}
            </div>
          )}

          {/* Prompt dev (colapsable) */}
          {!loading && data?.applied && (
            <details className="mt-4 text-xs text-muted-foreground">
              <summary className="cursor-pointer text-primary font-medium">
                Ver ajustes aplicados
              </summary>
              <pre className="mt-2 bg-muted p-2 rounded max-h-64 overflow-auto whitespace-pre-wrap">
                {JSON.stringify(data.applied, null, 2)}
              </pre>
            </details>
          )}
        </div>

        {/* Configuración aplicada */}
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
              {settings.model}
            </Badge>
            <Badge variant="outline" className="text-xs">
              T: {settings.creativity}
            </Badge>
            <Badge variant="outline" className="text-xs">
              Variantes: {settings.variantsToGenerate}
            </Badge>
          </div>
        </div>

        {/* Botones */}
        <div className="flex gap-2 pt-4">
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={() => {
              setManualTrigger(true);
              fetchResponse();
            }}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" /> Generando...
              </>
            ) : (
              "Generar ejemplo"
            )}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="flex-1"
            onClick={() => window.open("/api/responses/preview", "_blank")}
          >
            Probar endpoint
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
