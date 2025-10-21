// app/dashboard/reviews/settings/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import PageShell from "@/app/components/layouts/PageShell";
import TabMenu, { type TabItem } from "@/app/components/crussader/navigation/TabMenu";
import { LoadingOverlay } from "@/app/components/ui/loading-overlay";
import { toast } from "@/hooks/use-toast";
import { useBootstrapData } from "@/app/providers/bootstrap-store";
import type { ResponseSettings } from "@/app/schemas/response-settings";
import { SettingsEditorCard } from "@/app/components/reviews/settings/SettingsEditorCard";
import { PreviewStickyCard } from "@/app/components/reviews/settings/PreviewStickyCard";
import { Button } from "@/app/components/ui/button";
import { ChevronRight, Shield, Sparkles, SlidersHorizontal, SendHorizonal, Lock } from "lucide-react";

/* ===== Tabs superiores (header) ===== */
const TABS: TabItem[] = [
  { label: "Reseñas", href: "/dashboard/reviews" },
  { label: "Informes", href: "/dashboard/reviews/reports" },
  { label: "Sentimiento", href: "/dashboard/reviews/sentiment" },
  { label: "Configuración", href: "/dashboard/reviews/settings" },
];

/* ===== Menú lateral (anclas locales) ===== */
const SIDE_LINKS: { href: string; label: string; icon?: React.ReactNode }[] = [
  { href: "#general", label: "General", icon: <SlidersHorizontal className="h-4 w-4" /> },
  { href: "#tone", label: "Tono y estilo", icon: <Sparkles className="h-4 w-4" /> },
  { href: "#automation", label: "Automatización", icon: <SendHorizonal className="h-4 w-4" /> },
  { href: "#privacy", label: "Privacidad", icon: <Shield className="h-4 w-4" /> },
  { href: "#publishing", label: "Publicación", icon: <ChevronRight className="h-4 w-4" /> },
  { href: "#advanced", label: "Avanzado", icon: <Lock className="h-4 w-4" /> },
];

/* ===== Utilidades ===== */
function resolveCompanyId(boot: unknown): string | null {
  const b = (boot ?? {}) as Record<string, any>;
  return (
    b?.company?.id ??
    b?.activeCompany?.id ??
    b?.activeCompanyId ??
    b?.companyId ??
    (Array.isArray(b?.companies) && b.companies[0]?.id) ??
    null
  );
}
function fmt(dt: string | Date | null): string {
  if (!dt) return "";
  const d = typeof dt === "string" ? new Date(dt) : dt;
  try {
    return new Intl.DateTimeFormat("es-ES", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Europe/Madrid",
    }).format(d);
  } catch {
    return d.toLocaleString();
  }
}

/* ===== Defaults ===== */
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
  const boot = useBootstrapData();
  const companyId = resolveCompanyId(boot);

  const [settings, setSettings] = useState<ResponseSettings>(defaultSettings);
  const [isModified, setIsModified] = useState(false);
  const [previewStar, setPreviewStar] = useState<1 | 3 | 5>(5);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [meta, setMeta] = useState<{
    updatedAt?: string;
    updatedBy?: { id?: string; name?: string | null; email?: string | null } | null;
  } | null>(null);

  // área scroll central
  const scrollAreaRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!companyId) return;
    let ignore = false;
    (async () => {
      try {
        const res = await fetch(`/api/companies/${companyId}/response-settings`, { cache: "no-store" });
        const data = await res.json();
        if (ignore) return;
        setSettings(data?.settings ?? defaultSettings);
        setMeta(data?.meta ?? null);
        setIsModified(false);
      } catch {
        setSettings(defaultSettings);
        setMeta(null);
        setIsModified(false);
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [companyId]);

  const updateSettings = (updates: Partial<ResponseSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
    setIsModified(true);
  };

  const handleSave = async () => {
    if (!companyId || isSaving) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/companies/${companyId}/response-settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
        cache: "no-store",
      });
      const data = await res.json();

      if (data?.ok) {
        const res2 = await fetch(`/api/companies/${companyId}/response-settings`, { cache: "no-store" });
        const fresh = await res2.json();

        setSettings(fresh?.settings ?? settings);
        setMeta(fresh?.meta ?? data.meta ?? null);
        setIsModified(false);

        toast({ title: "Cambios guardados", description: "Tus ajustes se han actualizado correctamente." });
      } else {
        toast({
          variant: "error",
          title: "No se pudo guardar",
          description: data?.error ?? "Revisa tu conexión e inténtalo de nuevo.",
        });
      }
    } catch {
      toast({ variant: "error", title: "No se pudo guardar", description: "Se produjo un error inesperado." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRestore = () => {
    setSettings(defaultSettings);
    setIsModified(true);
    toast({
      title: "Valores restaurados",
      description: "Se cargaron los valores por defecto. Recuerda guardar los cambios.",
    });
  };

  const who = useMemo(
    () => meta?.updatedBy?.name ?? meta?.updatedBy?.email ?? meta?.updatedBy?.id ?? undefined,
    [meta]
  );

  const onSideNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const id = href.startsWith("#") ? href : `#${href}`;
    const target = document.querySelector(id) as HTMLElement | null;
    if (!target) return;
    // desplazamiento suave dentro del contenedor central
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (!companyId) return <div className="p-6 text-sm text-muted-foreground">No hay compañía activa.</div>;
  if (loading) return <div className="p-6">Cargando…</div>;

  return (
    <PageShell
      title="Configuración de respuestas"
      description="Ajusta el tono y las reglas para contestar reseñas"
      headerBand={<TabMenu items={TABS} />}
      variant="full"
    >
      <LoadingOverlay show={isSaving} text="Guardando ajustes…" />

      {/* Sin scroll global: ocultamos overflow y forzamos alto de viewport */}
      <div className="w-full bg-white h-[100svh] overflow-hidden">
        {/* 3 columnas: izq fija 260, centro 1fr con scroll, dcha fija 440 */}
        <div className="grid grid-cols-[260px_1fr_440px] gap-0 h-full">

          {/* ===== Columna izquierda fija ===== */}
          <aside className="border-r border-slate-200/70 bg-white sticky top-0 self-start h-full hidden lg:block">
            <nav className="py-4">
              <ul className="space-y-1 px-3">
                {SIDE_LINKS.map((it) => (
                  <li key={it.href}>
                    <Link
                      href={it.href}
                      onClick={(e) => onSideNavClick(e, it.href)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                    >
                      <span className="text-slate-500">{it.icon}</span>
                      <span className="font-medium">{it.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>

          {/* ===== Columna central con scroll ===== */}
          <main
            ref={scrollAreaRef}
            className="overflow-y-auto h-full px-4 sm:px-6"
          >
            {/* Secciones con offset por header (ajusta 24 si necesitas) */}
            <section id="general" className="scroll-mt-24 py-6">
              <div className="grid grid-cols-1 gap-6">
                <SettingsEditorCard settings={settings} onUpdate={updateSettings} />
              </div>
            </section>

            <section id="tone" className="scroll-mt-24 py-6">
              <div className="grid grid-cols-1 gap-6">
                {/* secciones adicionales si separas el tono */}
              </div>
            </section>

            <section id="automation" className="scroll-mt-24 py-6" />
            <section id="privacy" className="scroll-mt-24 py-6" />
            <section id="publishing" className="scroll-mt-24 py-6" />
            <section id="advanced" className="scroll-mt-24 py-6" />

            <div className="h-8" />
          </main>

          {/* ===== Columna derecha fija, más ancha (440px) ===== */}
          <aside className="border-l border-slate-200/70 bg-white sticky top-0 self-start h-full px-4 py-4">
            <div className="mx-auto w-full max-w-[400px]">
              <PreviewStickyCard
                settings={settings}
                selectedStar={previewStar}
                onStarChange={setPreviewStar}
              />
              <div className="mt-4 grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={handleRestore}
                  disabled={!isModified}
                  className="disabled:opacity-100 disabled:bg-transparent"
                >
                  Descartar
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={!isModified || isSaving}
                  className="text-white bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 hover:from-indigo-500 hover:via-violet-500 hover:to-fuchsia-500"
                >
                  {isSaving ? "Guardando…" : "Guardar"}
                </Button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </PageShell>
  );
}
