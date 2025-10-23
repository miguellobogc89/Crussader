"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Button } from "@/app/components/ui/button";
import { Textarea } from "@/app/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { Badge } from "@/app/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/app/components/ui/tooltip";
import {
  MessageCircle,
  Phone,
  Mail,
  Globe,
  Info,
  Sparkles,
  Trash2,
} from "lucide-react";
import type { ResponseSettings } from "@/app/schemas/response-settings";

// ——— Constantes de canal
const channelIcons = {
  whatsapp: MessageCircle,
  phone: Phone,
  email: Mail,
  web: Globe,
} as const;

const channelLabels = {
  whatsapp: "WhatsApp",
  phone: "Teléfono",
  email: "Email",
  web: "Sitio web",
} as const;

const channelPlaceholders = {
  whatsapp: "+34 612 345 678",
  phone: "+34 912 345 678",
  email: "contacto@tuempresa.com",
  web: "https://tuempresa.com",
} as const;

const ctaSuggestions = {
  whatsapp: "¡Contáctanos por WhatsApp para resolver cualquier duda!",
  phone: "Llámanos y estaremos encantados de atenderte",
  email: "Escríbenos y te responderemos lo antes posible",
  web: "Visita nuestra web para conocer más",
} as const;

const showWhenLabels: Record<
  NonNullable<ResponseSettings["showCTAWhen"]>,
  string
> = {
  always: "Siempre",
  below3: "Reseñas negativas (1–2★)",
  above4: "Reseñas positivas (4–5★)",
  never: "Nunca",
};

// 💡 Valor por defecto seguro para cada bucket
const defaultCTA = {
  channel: "web",
  contact: "",
  text: "",
};

export function ChannelsCtaSection({
  settings,
  onUpdate,
}: {
  settings: ResponseSettings;
  onUpdate: (updates: Partial<ResponseSettings> & Record<string, any>) => void;
}) {
  // Control del tab activo (por bucket de estrellas)
  const [activeTab, setActiveTab] = useState<"1-2" | "3" | "4-5">("1-2");

  // ✅ Asegurar estructura CTA por bucket
  const ctaByRating = settings.ctaByRating ?? {
    "1-2": defaultCTA,
    "3": defaultCTA,
    "4-5": defaultCTA,
  };

  // Selecciona el CTA actual según el tab activo
  const currentCTA = ctaByRating[activeTab] ?? defaultCTA;

  const preferred = currentCTA.channel as keyof typeof channelIcons;
  const ChannelIcon = channelIcons[preferred];
  const suggestion = useMemo(() => ctaSuggestions[preferred], [preferred]);

  const handleCTAChange = (text: string) => {
    onUpdate({
      ctaByRating: {
        ...ctaByRating,
        [activeTab]: { ...currentCTA, text },
      },
    });
  };

  const handleContactChange = (contact: string) => {
    onUpdate({
      ctaByRating: {
        ...ctaByRating,
        [activeTab]: { ...currentCTA, contact },
      },
    });
  };

  const handleChannelChange = (value: string) => {
    const newChannel = value as keyof typeof channelIcons;
    onUpdate({
      ctaByRating: {
        ...ctaByRating,
        [activeTab]: { ...currentCTA, channel: newChannel },
      },
    });
  };

  const handleUseSuggestion = () => handleCTAChange(suggestion);
  const handleClear = () => handleCTAChange("");

  return (
    <div className="w-full max-w-3xl">
      <Card className="border-none shadow-elegant bg-white/60 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-primary" />
                CTA por estrellas
              </CardTitle>
              <CardDescription>
                Personaliza la llamada a la acción para cada rango de valoración
              </CardDescription>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Se mostrará:</span>
              <Badge variant="secondary" className="text-xs">
                {showWhenLabels[settings.showCTAWhen ?? "always"]}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Tabs de buckets */}
          <div className="flex gap-3 justify-center">
            {(["1-2", "3", "4-5"] as const).map((tab) => (
              <Button
                key={tab}
                variant={activeTab === tab ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab(tab)}
              >
                {tab}★
              </Button>
            ))}
          </div>

          {/* Canal */}
          <div className="space-y-2">
            <Label htmlFor="channel">Canal preferido</Label>
            <Select
              value={currentCTA.channel}
              onValueChange={(v) => handleChannelChange(v)}
            >
              <SelectTrigger id="channel">
                <SelectValue placeholder="Selecciona canal" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(channelLabels).map(([value, label]) => {
                  const Icon = channelIcons[value as keyof typeof channelIcons];
                  return (
                    <SelectItem key={value} value={value}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Contacto */}
          <div className="space-y-2">
            <Label htmlFor="contact">Contacto</Label>
            <Input
              id="contact"
              placeholder={channelPlaceholders[preferred]}
              value={currentCTA.contact}
              onChange={(e) => handleContactChange(e.target.value)}
            />
          </div>

          {/* Texto CTA */}
          <div className="space-y-2">
            <Label htmlFor="ctaText">Texto de CTA</Label>
            <Textarea
              id="ctaText"
              rows={3}
              value={currentCTA.text}
              onChange={(e) => handleCTAChange(e.target.value)}
              placeholder={suggestion}
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleUseSuggestion}
              >
                <Sparkles className="h-3 w-3 mr-1" />
                Usar sugerencia
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={handleClear}
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Limpiar
              </Button>
            </div>
          </div>

          {/* Vista previa */}
          {currentCTA.text?.trim() && (
            <div className="space-y-2">
              <Label>Vista previa</Label>
              <div className="p-4 border rounded-lg bg-muted/10">
                <div className="flex items-center gap-2 mb-1 text-primary">
                  <ChannelIcon className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    {channelLabels[preferred]}
                  </span>
                </div>
                <p className="text-sm">{currentCTA.text}</p>
                {currentCTA.contact && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {currentCTA.contact}
                  </p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
