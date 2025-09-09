// app/dashboard/settings/responses/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/app/components/ui/button";
import { ResponseSettingsForm } from "@/app/components/reviews/ResponseSettingsForm";
import { ResponsePreviewPanel } from "@/app/components/reviews/ResponsePreviewPanel";
import type { ResponseSettings } from "@/app/schemas/response-settings";
import { useBootstrapData } from "@/app/providers/bootstrap-store";
import { LoadingOverlay } from "@/app/components/ui/loading-overlay";
// ⬇️ NUEVO: toast shadcn
import { toast } from "@/hooks/use-toast";

// Resolver tolerante del companyId desde tu bootstrap-store
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

export default function ResponseSettingsPage() {
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

  // Carga inicial
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
        // Re-fetch para asegurarnos de tener lo persistido + feedback
        const res2 = await fetch(`/api/companies/${companyId}/response-settings`, { cache: "no-store" });
        const fresh = await res2.json();

        setSettings(fresh?.settings ?? settings);
        setMeta(fresh?.meta ?? data.meta ?? null);
        setIsModified(false);

        // ✅ Toast éxito
        toast({
          title: "Cambios guardados",
          description: "Tus ajustes se han actualizado correctamente.",
        });
      } else {
        console.error("Save error:", data?.error);
        // ❌ Toast error
        toast({
          variant: "error",
          title: "No se pudo guardar",
          description: data?.error ?? "Revisa tu conexión e inténtalo de nuevo.",
        });
      }
    } catch (e) {
      console.error(e);
      // ❌ Toast error inesperado
      toast({
        variant: "error",
        title: "No se pudo guardar",
        description: "Se produjo un error inesperado.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRestore = () => {
    setSettings(defaultSettings);
    setIsModified(true);
    // ℹ️ Toast informativo
    toast({
      title: "Valores restaurados",
      description: "Se cargaron los valores por defecto. Recuerda guardar los cambios.",
    });
  };

  if (!companyId) {
    return <div className="p-6 text-sm text-muted-foreground">No hay compañía activa.</div>;
  }
  if (loading) {
    return <div className="p-6">Cargando…</div>;
  }

  const who =
    meta?.updatedBy?.name ??
    meta?.updatedBy?.email ??
    meta?.updatedBy?.id ??
    null;

  return (
    <>
      {/* overlay de guardado */}
      <LoadingOverlay show={isSaving} text="Guardando ajustes…" />

      <div className="min-h-full bg-gradient-subtle">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <ResponseSettingsForm settings={settings} onUpdate={updateSettings} />
            </div>

            <div className="lg:sticky lg:top-8">
              <ResponsePreviewPanel
                settings={settings}
                selectedStar={previewStar}
                onStarChange={setPreviewStar}
              />
            </div>
          </div>

          {/* Footer fijo de acciones */}
          <div className="sticky bottom-0 mt-12 bg-background/90 backdrop-blur-sm border-t">
            <div className="px-6 py-4 flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                {meta?.updatedAt
                  ? `Última modificación: ${fmt(meta.updatedAt)}${who ? ` · por ${who}` : ""}`
                  : "Aún no guardado"}
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleRestore}
                  disabled={!isModified}
                  className="disabled:opacity-100 disabled:bg-transparent"
                >
                  Restaurar valores
                </Button>

                <Button
                  onClick={handleSave}
                  disabled={!isModified || isSaving}
                  variant={isModified && !isSaving ? "default" : "outline"}
                  className={
                    isModified && !isSaving
                      ? "text-white bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 " +
                        "hover:from-indigo-500 hover:via-violet-500 hover:to-fuchsia-500 " +
                        "focus-visible:ring-2 focus-visible:ring-violet-400 shadow-sm"
                      : "border-primary/30 text-primary disabled:opacity-100 disabled:bg-transparent"
                  }
                >
                  {isSaving ? "Guardando…" : "Guardar cambios"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
