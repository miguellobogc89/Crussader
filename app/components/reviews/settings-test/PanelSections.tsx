"use client";

import SectionLayout from "./SectionLayout";

import type { ResponseSettings } from "@/app/schemas/response-settings";

// Cuerpos de sección (solo controles)
import ResponsePreview from "@/app/components/reviews/settings/sections/ResponsePreview"; // ⚠️ usa tu ruta real
import { BrandIdentitySection } from "@/app/components/reviews/settings/sections/BrandIdentitySection";
import { PublishingSection } from "@/app/components/reviews/settings/sections/PublishingSection";
import { StarRulesSection } from "@/app/components/reviews/settings/sections/StarRulesSection";
import { ChannelsCtaSection } from "@/app/components/reviews/settings/sections/ChannelsCtaSection";
import { PoliciesSection } from "@/app/components/reviews/settings/sections/PoliciesSection";
import { LanguageSection } from "@/app/components/reviews/settings/sections/LanguageSection";
import { ModelAiSection } from "@/app/components/reviews/settings/sections/ModelAiSection";

// Iconos para headers
import {
  MessageCircle,
  Languages,
  Sparkles,
  Globe,
  ShieldCheck,
  UserCheck,
  Cpu,
} from "lucide-react";

export default function PanelSections({
  settings,
  onUpdate,
}: {
  settings: ResponseSettings;
  onUpdate: (u: Partial<ResponseSettings>) => void;
}) {
  return (
    <>
      {/* 0) Vista previa */}
      <SectionLayout
        id="preview"
        title="Vista previa de respuesta"
        subtitle="Así se verá la respuesta generada con tu configuración actual."
        icon={MessageCircle}
      >
        <ResponsePreview settings={settings} />
      </SectionLayout>

      {/* 1) Identidad y voz */}
      <SectionLayout
        id="general"
        title="Identidad y voz de marca"
        subtitle="Define el tratamiento, firma y estilo base (tono y emojis) de tus respuestas."
        icon={MessageCircle}
      >
        <BrandIdentitySection settings={settings} onUpdate={onUpdate} />
      </SectionLayout>

      {/* 2) Publicación */}
      <SectionLayout
        id="publishing"
        title="Publicación"
        subtitle="Activa la autopublicación por umbral de estrellas y configura notificaciones."
        icon={UserCheck}
      >
        <PublishingSection settings={settings} onUpdate={onUpdate} />
      </SectionLayout>


      {/* 3) Reglas por estrellas */}
      <SectionLayout
        id="stars"
        title="Reglas por estrellas"
        subtitle="Objetivo y longitud por rango de valoración; ajusta el CTA por caso."
        icon={Sparkles}
      >
        <StarRulesSection settings={settings} onUpdate={onUpdate} />
      </SectionLayout>


      {/* 4) Canales / CTA */}
      <SectionLayout
        id="channels"
        title="Canales / CTA"
        subtitle="Canal y texto de llamada a la acción para cada rango de estrellas."
        icon={Globe}
        pending
        muted
      >
        <ChannelsCtaSection settings={settings} onUpdate={onUpdate} />
      </SectionLayout>

      {/* 5) Políticas */}
      <SectionLayout
        id="policies"
        title="Políticas y guardarraíles"
        subtitle="Frases prohibidas y restricciones para cumplir con normativa y buenas prácticas."
        icon={ShieldCheck}
        pending
        muted
      >
        <PoliciesSection settings={settings} onUpdate={onUpdate} />
      </SectionLayout>

      {/* 6) Idioma */}
      <SectionLayout
        id="language"
        title="Idioma"
        subtitle="Idioma por defecto y autodetección para responder según la reseña."
        icon={Languages}
        pending
        muted
      >
        <LanguageSection settings={settings} onUpdate={onUpdate} />
      </SectionLayout>


      {/* 7) Modelo (IA) */}
      <SectionLayout
        id="model"
        title="Modelo y creatividad (IA)"
        subtitle="Selecciona el modelo y ajusta la creatividad para las respuestas generadas."
        icon={Cpu}
        pending
        muted
      >
        <ModelAiSection settings={settings} onUpdate={onUpdate} />
      </SectionLayout>
    </>
  );
}
