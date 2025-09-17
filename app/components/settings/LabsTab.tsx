// app/components/settings/LabsTab.tsx
"use client";

import { useState } from "react";
import { Beaker, Sparkles, Brain, Zap, MessageSquare, Send } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Switch } from "@/app/components/ui/switch";
import { Textarea } from "@/app/components/ui/textarea";
import { Label } from "@/app/components/ui/label";
import { Badge } from "@/app/components/ui/badge";

export default function LabsTab() {
  const [features, setFeatures] = useState({
    aiAnalytics: false,
    smartSuggestions: true,
    batchResponses: false,
    sentimentAnalysis: false,
  });
  const [feedback, setFeedback] = useState("");

  const experimentalFeatures = [
    {
      id: "aiAnalytics",
      name: "Análisis IA avanzado",
      description:
        "Obtén insights automáticos sobre las tendencias en tus reseñas y patrones de comportamiento de los clientes.",
      icon: Brain,
      status: "alpha",
      risk: "medium",
    },
    {
      id: "smartSuggestions",
      name: "Sugerencias inteligentes",
      description:
        "La IA aprende de tus respuestas anteriores y sugiere automáticamente mejoras para futuras respuestas.",
      icon: Sparkles,
      status: "beta",
      risk: "low",
    },
    {
      id: "batchResponses",
      name: "Respuestas en lote",
      description:
        "Genera y publica múltiples respuestas a la vez con un solo clic. Ideal para establecimientos con gran volumen.",
      icon: Zap,
      status: "experimental",
      risk: "high",
    },
    {
      id: "sentimentAnalysis",
      name: "Análisis de sentimientos",
      description:
        "Detecta automáticamente el tono emocional de las reseñas y clasifícalas según urgencia y tipo de problema.",
      icon: MessageSquare,
      status: "coming-soon",
      risk: "low",
    },
  ] as const;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "alpha":
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">Alpha</Badge>;
      case "beta":
        return <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">Beta</Badge>;
      case "experimental":
        return <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">Experimental</Badge>;
      case "coming-soon":
        return <Badge variant="secondary">Próximamente</Badge>;
      default:
        return null;
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "high":
        return "border-red-200 dark:border-red-800";
      case "medium":
        return "border-orange-200 dark:border-orange-800";
      case "low":
        return "border-green-200 dark:border-green-800";
      default:
        return "border-border";
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-3">
        <Beaker className="h-6 w-6 text-primary" />
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Labs</h2>
          <p className="text-muted-foreground text-sm">
            Experimenta con las últimas funcionalidades de IA antes de que sean oficiales.
          </p>
        </div>
        <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">Beta</Badge>
      </div>

      {/* Aviso importante */}
      <Card className="rounded-2xl shadow-sm border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20">
        <CardContent className="p-6">
          <div className="flex items-start space-x-3">
            <Beaker className="h-5 w-5 text-amber-600 mt-0.5" />
            <div className="space-y-2">
              <h3 className="font-semibold text-amber-800 dark:text-amber-200">⚠️ Funcionalidades experimentales</h3>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Estas funciones están en desarrollo activo y pueden tener errores o comportamientos inesperados. Úsalas
                bajo tu propia responsabilidad y no olvides reportar cualquier problema que encuentres.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Features experimentales */}
      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Funcionalidades experimentales</CardTitle>
          <CardDescription>Activa las funciones que quieres probar. Puedes desactivarlas en cualquier momento.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {experimentalFeatures.map((feature) => {
            const Icon = feature.icon;
            const isEnabled = features[feature.id as keyof typeof features];
            const isAvailable = feature.status !== "coming-soon";

            return (
              <div
                key={feature.id}
                className={`p-4 rounded-xl border transition-colors ${getRiskColor(feature.risk)} ${
                  isAvailable ? "hover:bg-muted/50" : "opacity-60"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <Icon className="h-5 w-5 text-primary mt-1" />
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center space-x-2">
                        <Label className="font-medium cursor-pointer">{feature.name}</Label>
                        {getStatusBadge(feature.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                  <Switch
                    checked={isEnabled}
                    onCheckedChange={(checked) => setFeatures((prev) => ({ ...prev, [feature.id]: checked }))}
                    disabled={!isAvailable}
                  />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Feedback */}
      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center space-x-2">
            <Send className="h-5 w-5" />
            <span>Enviar feedback</span>
          </CardTitle>
          <CardDescription>
            Comparte tu experiencia con las funciones experimentales. Tu feedback es muy valioso para mejorar el
            producto.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="feedback">¿Qué tal tu experiencia con las funciones experimentales?</Label>
            <Textarea
              id="feedback"
              placeholder="Cuéntanos qué funciona bien, qué no, y qué te gustaría ver mejorado..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="rounded-xl min-h-[120px] resize-none"
              maxLength={500}
            />
            <div className="flex justify-between items-center">
              <p className="text-xs text-muted-foreground">{feedback.length}/500 caracteres</p>
              <Button className="rounded-xl" disabled={!feedback.trim()}>
                <Send className="h-4 w-4 mr-2" />
                Enviar feedback
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Próximas funciones */}
      <Card className="rounded-2xl shadow-sm bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="text-lg">🚀 Próximamente en Labs</CardTitle>
          <CardDescription>Funciones que estamos desarrollando y llegarán pronto</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-white/60 dark:bg-gray-900/60">
              <div className="h-2 w-2 rounded-full bg-blue-600" />
              <span className="text-sm font-medium">Respuestas por voz (Speech-to-Text)</span>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-white/60 dark:bg-gray-900/60">
              <div className="h-2 w-2 rounded-full bg-purple-600" />
              <span className="text-sm font-medium">Integración con redes sociales</span>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-white/60 dark:bg-gray-900/60">
              <div className="h-2 w-2 rounded-full bg-green-600" />
              <span className="text-sm font-medium">Dashboard de analytics avanzado</span>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-white/60 dark:bg-gray-900/60">
              <div className="h-2 w-2 rounded-full bg-orange-600" />
              <span className="text-sm font-medium">API pública para desarrolladores</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
