"use client";

import { useMemo, useState } from "react";
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
import { Sparkles, Trash2, MessageCircle, Phone, Mail, Globe } from "lucide-react";
import type { ResponseSettings } from "@/app/schemas/response-settings";

/* ---------- Constantes ---------- */
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

const DEFAULT_CTA = { channel: "web", contact: "", text: "" };

/* ---------- Componente ---------- */
export function ChannelsCtaSection({
  settings,
  onUpdate,
}: {
  settings: ResponseSettings;
  onUpdate: (updates: Partial<ResponseSettings>) => void;
}) {
  const [activeTab, setActiveTab] = useState<"1-2" | "3" | "4-5">("1-2");

  const ctaByRating = settings.ctaByRating ?? {
    "1-2": DEFAULT_CTA,
    "3": DEFAULT_CTA,
    "4-5": DEFAULT_CTA,
  };

  const currentCTA = ctaByRating[activeTab] ?? DEFAULT_CTA;
  const preferred = currentCTA.channel as keyof typeof channelIcons;
  const ChannelIcon = channelIcons[preferred];
  const suggestion = useMemo(() => ctaSuggestions[preferred], [preferred]);

  const updateCTA = (patch: Partial<typeof DEFAULT_CTA>) => {
    onUpdate({
      ctaByRating: {
        ...ctaByRating,
        [activeTab]: { ...currentCTA, ...patch },
      },
    } as any);
  };

  return (
    <>
      {/* Tabs de estrellas */}
      <div className="flex gap-3 justify-center mb-6">
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

      {/* Canal + Contacto alineados */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-6 space-y-2">
          <Label htmlFor="channel">Canal preferido</Label>
          <Select
            value={currentCTA.channel}
            onValueChange={(v) => updateCTA({ channel: v as keyof typeof channelIcons })}
          >
            <SelectTrigger id="channel" className="w-full">
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

        <div className="md:col-span-6 space-y-2">
          <Label htmlFor="contact">Contacto</Label>
          <Input
            id="contact"
            placeholder={channelPlaceholders[preferred]}
            value={currentCTA.contact}
            onChange={(e) => updateCTA({ contact: e.target.value })}
          />
        </div>
      </div>

      {/* Texto CTA */}
      <div className="space-y-2 mt-5">
        <Label htmlFor="ctaText">Texto de CTA</Label>
        <Textarea
          id="ctaText"
          rows={3}
          value={currentCTA.text}
          onChange={(e) => updateCTA({ text: e.target.value })}
          placeholder={suggestion}
        />
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => updateCTA({ text: suggestion })}
          >
            <Sparkles className="h-3 w-3 mr-1" />
            Usar sugerencia
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => updateCTA({ text: "" })}
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Limpiar
          </Button>
        </div>
      </div>

      {/* Vista previa */}
      {currentCTA.text?.trim() && (
        <div className="space-y-2 mt-5">
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
    </>
  );
}
