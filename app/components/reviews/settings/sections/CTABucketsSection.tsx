// app/components/reviews/settings/sections/CTABucketsSection.tsx
"use client";

import { useMemo, useState } from "react";
import {
  Card, CardHeader, CardTitle, CardDescription,
  CardContent,
} from "@/app/components/ui/card";
import {
  Tabs, TabsList, TabsTrigger,
} from "@/app/components/ui/tabs";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/app/components/ui/select";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import { Button } from "@/app/components/ui/button";
import { MessageCircle, Phone, Mail, Globe, Sparkles, Trash2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ResponseSettings, CTAConfig } from "@/app/schemas/response-settings";


type Bucket = "1-2" | "3" | "4-5";

const defaultCTA: CTAConfig = {
  text: "",
  channel: "web",
  contact: "",
};

const channelLabels: Record<CTAConfig["channel"], string> = {
  whatsapp: "WhatsApp",
  phone: "Teléfono",
  email: "Email",
  web: "Sitio web",
};

const channelIcons: Record<CTAConfig["channel"], LucideIcon> = {
  whatsapp: MessageCircle,
  phone: Phone,
  email: Mail,
  web: Globe,
};

const channelPlaceholders: Record<CTAConfig["channel"], string> = {
  whatsapp: "+34 612 345 678",
  phone: "+34 912 345 678",
  email: "contacto@tuempresa.com",
  web: "https://tuempresa.com",
};

const ctaSuggestions: Record<CTAConfig["channel"], string> = {
  whatsapp: "¡Contáctanos por WhatsApp para resolver cualquier duda!",
  phone: "Llámanos y estaremos encantados de atenderte",
  email: "Escríbenos y te responderemos lo antes posible",
  web: "Visita nuestra web para conocer más",
};

const showWhenLabels: Record<ResponseSettings["showCTAWhen"], string> = {
  always: "Siempre",
  below3: "Reseñas negativas (1–2★)",
  above4: "Reseñas positivas (4–5★)",
  never: "Nunca",
};

export function CTABucketsSection({
  settings,
  onUpdate,
}: {
  settings: ResponseSettings;
  onUpdate: (updates: Partial<ResponseSettings>) => void;
}) {
  const [activeTab, setActiveTab] = useState<Bucket>("1-2");

  const ctaByRating = settings.ctaByRating ?? {
    "1-2": defaultCTA,
    "3": defaultCTA,
    "4-5": defaultCTA,
  };

  const currentCTA = ctaByRating[activeTab] ?? defaultCTA;
  const preferred = currentCTA.channel as keyof typeof channelIcons;
  const ChannelIcon = channelIcons[preferred];
  const suggestion = useMemo(() => ctaSuggestions[preferred], [preferred]);

  const updateBucket = (data: Partial<CTAConfig>) => {
    onUpdate({
      ctaByRating: {
        ...ctaByRating,
        [activeTab]: { ...currentCTA, ...data },
      },
    });
  };

  const handleUseSuggestion = () => updateBucket({ text: suggestion });
  const handleClear = () => updateBucket({ text: "" });

  return (
    <section>
      <Card className="border-none shadow-elegant bg-white/60 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            CTA por estrellas
          </CardTitle>
          <CardDescription>
            Configura un canal y mensaje diferente según la puntuación de la reseña.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Bucket)}>
            <TabsList className="grid grid-cols-3 w-full max-w-md mb-4">
              <TabsTrigger value="1-2">1–2★</TabsTrigger>
              <TabsTrigger value="3">3★</TabsTrigger>
              <TabsTrigger value="4-5">4–5★</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Estado global: cuándo mostrar CTA */}
          <div className="space-y-2">
            <Label htmlFor="showWhen">¿Cuándo mostrar la CTA?</Label>
            <Select
              value={settings.showCTAWhen}
              onValueChange={(value) =>
                onUpdate({ showCTAWhen: value as ResponseSettings["showCTAWhen"] })
              }
            >
              <SelectTrigger id="showWhen" className="w-full max-w-xs">
                <SelectValue placeholder="Selecciona cuándo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="always">Siempre</SelectItem>
                <SelectItem value="below3">Solo en reseñas negativas (1–2★)</SelectItem>
                <SelectItem value="above4">Solo en reseñas positivas (4–5★)</SelectItem>
                <SelectItem value="never">Nunca</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Canal + contacto */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Canal preferido</Label>
              <Select
                value={currentCTA.channel}
                onValueChange={(value) => updateBucket({ channel: value as CTAConfig["channel"] })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona canal" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(channelIcons).map(([key, Icon]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {channelLabels[key as CTAConfig["channel"]]}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Contacto</Label>
              <Input
                value={currentCTA.contact}
                placeholder={channelPlaceholders[preferred]}
                type={preferred === "email" ? "email" : preferred === "web" ? "url" : "text"}
                onChange={(e) => updateBucket({ contact: e.target.value })}
              />
            </div>
          </div>

          {/* Texto CTA */}
          <div className="flex flex-col gap-2">
            <Label>Texto de la CTA</Label>
            <Textarea
              value={currentCTA.text}
              onChange={(e) => updateBucket({ text: e.target.value })}
              placeholder={suggestion}
              maxLength={150}
              rows={3}
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{currentCTA.text.length}/150 caracteres</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleUseSuggestion} className="gap-1">
                  <Sparkles className="h-3 w-3" />
                  Sugerencia
                </Button>
                <Button variant="ghost" size="sm" onClick={handleClear} className="gap-1">
                  <Trash2 className="h-3 w-3" />
                  Limpiar
                </Button>
              </div>
            </div>
          </div>

          {/* Vista previa */}
          {currentCTA.text && settings.showCTAWhen !== "never" && (
            <div className="space-y-2">
              <Label>Vista previa</Label>
              <div className="p-4 rounded-lg bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/10">
                <div className="mb-2 flex items-center gap-2 text-primary text-xs font-medium">
                  <ChannelIcon className="h-4 w-4" />
                  Se mostrará: {showWhenLabels[settings.showCTAWhen]}
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-full bg-primary/10">
                    <ChannelIcon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground mb-1">
                      {currentCTA.text}
                    </p>
                    {currentCTA.contact && (
                      <p className="text-xs text-muted-foreground">{currentCTA.contact}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
