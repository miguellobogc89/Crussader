// app/dashboard/reviews/settings/page.tsx
"use client";

import { useLayoutEffect, useRef, useState } from "react";
import VerticalMenu, { type VerticalMenuItem } from "@/app/components/reviews/settings/VerticalMenu";
import {
  Eye,
  SlidersHorizontal,
  MessageSquare,
  Megaphone,
  ShieldCheck,
  Cpu,
  Languages,
  Sparkles,
  Globe,
  UserCheck,
} from "lucide-react";
import { ResponsePreviewPanel } from "@/app/components/reviews/settings/ResponsePreviewPanel";
import type { ResponseSettings } from "@/app/types/response-settings";

// Secciones
import {
  BrandIdentitySection,
  LanguageSection,
  StarRulesSection,
  ChannelsCtaSection,
  PoliciesSection,
  PublishingSection,
  ModelAiSection,
} from "@/app/components/reviews/settings/sections";

/* ===== defaults acordes a ResponseSettings ===== */
const defaultSettings: ResponseSettings = {
  businessName: "Heladería Brumazul",
  sector: "Restauración - Heladería",
  treatment: "tu",
  tone: 3,
  emojiIntensity: 1,
  standardSignature: "— Equipo Heladería Brumazul",
  language: "es",
  autoDetectLanguage: true,
  starSettings: {
    "1-2": { objective: "apology", length: 1, enableCTA: true },
    "3": { objective: "neutral", length: 1, enableCTA: false },
    "4-5": { objective: "thanks", length: 1, enableCTA: true },
  },
  preferredChannel: "whatsapp",
  ctaText: "¡Nos vemos pronto!",
  showCTAWhen: "below3",
  addUTM: false,
  bannedPhrases: [],
  noPublicCompensation: true,
  avoidPersonalData: true,
  publishMode: "draft",
  autoPublishThreshold: "4stars",
  variantsToGenerate: 2,
  selectionMode: "auto",
  model: "gpt-4o",
  creativity: 0.6,
  maxCharacters: 300,
};

export default function ReviewsSettingsPage() {
  const [settings, setSettings] = useState<ResponseSettings>(defaultSettings);
  const [selectedStar, setSelectedStar] = useState<1 | 3 | 5>(5);
  const [active, setActive] = useState<string>("preview");

  const onUpdate = (updates: Partial<ResponseSettings>) =>
    setSettings((prev) => ({ ...prev, ...updates }));

  const rootRef = useRef<HTMLDivElement>(null);
  const [availH, setAvailH] = useState<number>(0);

  // Altura exacta bajo el header/tabmenu
  useLayoutEffect(() => {
    function recalc() {
      const top = rootRef.current?.getBoundingClientRect().top ?? 0;
      setAvailH(Math.max(0, window.innerHeight - top));
    }
    recalc();
    window.addEventListener("resize", recalc);
    window.addEventListener("orientationchange", recalc);
    return () => {
      window.removeEventListener("resize", recalc);
      window.removeEventListener("orientationchange", recalc);
    };
  }, []);

  const MENU_ITEMS: VerticalMenuItem[] = [
    { label: "Preview", value: "preview", icon: Eye },
    { label: "General", value: "general", icon: SlidersHorizontal },
    { label: "Idioma", value: "language", icon: Languages },
    { label: "Reglas por estrellas", value: "stars", icon: Sparkles },
    { label: "Canales / CTA", value: "channels", icon: Globe },
    { label: "Políticas", value: "policies", icon: ShieldCheck },
    { label: "Publicación", value: "publishing", icon: UserCheck },
    { label: "Modelo (IA)", value: "model", icon: Cpu },
  ];

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div
      ref={rootRef}
      style={{ height: availH ? `${availH - 16}px` : undefined }}
      className="overflow-hidden bg-white border rounded-xl"
    >
      {/* Layout: menú | separador | contenido */}
      <div className="h-full w-full grid grid-cols-[220px_1px_1fr]">
        {/* Menú */}
        <div className="h-full overflow-hidden">
          <VerticalMenu
            items={MENU_ITEMS}
            value={active}
            onSelect={(val) => {
              setActive(val);
              scrollTo(val);
            }}
            className="h-full px-0"
          />
        </div>

        {/* Separador vertical */}
        <div className="h-full w-px bg-slate-200" />

        {/* Contenido con scroll interno y scroll suave */}
        <div
          className="h-full overflow-y-auto"
          style={{ scrollBehavior: "smooth" }}
        >
          {/* Preview (sin sombras; pegado arriba) */}
          <section id="preview" className="px-6 py-4 scroll-mt-4">
            <ResponsePreviewPanel
              settings={settings}
              selectedStar={selectedStar}
              onStarChange={setSelectedStar}
            />
          </section>

          {/* Secciones mapeadas a cada opción del menú */}
          <div id="general" className="px-6 py-4 scroll-mt-4">
            <BrandIdentitySection settings={settings} onUpdate={onUpdate} />
          </div>

          <div id="language" className="px-6 py-4 scroll-mt-4">
            <LanguageSection settings={settings} onUpdate={onUpdate} />
          </div>

          <div id="stars" className="px-6 py-4 scroll-mt-4">
            <StarRulesSection settings={settings} onUpdate={onUpdate} />
          </div>

          <div id="channels" className="px-6 py-4 scroll-mt-4">
            <ChannelsCtaSection settings={settings} onUpdate={onUpdate} />
          </div>

          <div id="policies" className="px-6 py-4 scroll-mt-4">
            <PoliciesSection settings={settings} onUpdate={onUpdate} />
          </div>

          <div id="publishing" className="px-6 py-4 scroll-mt-4">
            <PublishingSection settings={settings} onUpdate={onUpdate} />
          </div>

          <div id="model" className="px-6 py-4 scroll-mt-4">
            <ModelAiSection settings={settings} onUpdate={onUpdate} />
          </div>
        </div>
      </div>
    </div>
  );
}
