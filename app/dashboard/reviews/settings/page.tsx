// app/dashboard/reviews/settings/page.tsx
"use client";

import { useEffect, useState } from "react";
import { LoadingOverlay } from "@/app/components/ui/loading-overlay";
import { toast } from "@/hooks/use-toast";
import { useBootstrapData } from "@/app/providers/bootstrap-store";
import type { ResponseSettings } from "@/app/schemas/response-settings";
import { Button } from "@/app/components/ui/button";
import SettingsSidebar from "@/app/components/reviews/settings/SettingsSidebar";
import SettingsShell from "@/app/components/reviews/settings/SettingsShell";
import ResponsePreview from "@/app/components/reviews/settings/ResponsePreview";

/* ===== utils ===== */
function resolveCompanyId(boot: unknown): string | null {
  const b = (boot ?? {}) as Record<string, any>;
  return (
    b?.company?.id ??
    b?.activeCompany?.id ??
    b?.activeCompanyId ??
    b?.companyId ??
    (Array.isArray(b?.companies) && b?.companies[0]?.id) ??
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

/* ===== defaults ===== */
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

/* ===== helpers para prompt preview ===== */
function mapToneNumberToLabel(n: number | undefined): string {
  if (!Number.isFinite(n)) return "neutral";
  if (n! <= 1) return "neutral";
  if (n! === 2) return "cálido";
  if (n! === 3) return "positivo";
  if (n! === 4) return "muy positivo";
  return "entusiasta";
}
function mapMaxCharsToLength(c: number | undefined): "very_short" | "short" | "medium" | "long" {
  const v = Number(c ?? 300);
  if (v <= 180) return "very_short";
  if (v <= 300) return "short";
  if (v <= 450) return "medium";
  return "long";
}
function toEngineSettings(s: ResponseSettings) {
  return {
    language: s.language ?? "es",
    lang: s.language ?? "es",
    tone: mapToneNumberToLabel(s.tone),
    emojiLevel: Math.max(0, Math.min(3, Number(s.emojiIntensity ?? 0))),
    formality: s.treatment === "usted" ? "usted" : "tu",
    signature: s.standardSignature ?? null,
    model: s.model || process.env.AI_MODEL || "gpt-4o-mini",
    temperature: typeof s.creativity === "number" ? s.creativity : 0.3,
    forbidCompensation: s.noPublicCompensation !== false,
    stripPII: s.avoidPersonalData !== false,
    length: mapMaxCharsToLength(s.maxCharacters),
    companyName: s.businessName ?? null,
    locationName: null,
  };
}
function sampleReviewByStar(star: 1 | 3 | 5) {
  if (star === 1)
    return {
      rating: 1,
      author: "Cliente de ejemplo",
      content:
        "Muy mala experiencia: el helado llegó derretido y el personal fue poco amable. No volveré.",
    };
  if (star === 3)
    return {
      rating: 3,
      author: "Cliente de ejemplo",
      content:
        "Helado correcto y buen precio, aunque la espera fue algo larga y la mesa estaba poco limpia.",
    };
  return {
    rating: 5,
    author: "Cliente de ejemplo",
    content:
      "¡Riquísimo! Sabores muy cremosos y atención de diez. Repetiremos seguro. Gracias 😊",
  };
}

/* ===== Panel SYSTEM (alineado a la derecha) ===== */
function SystemPromptPanel({
  system,
  loading,
  error,
  onToggle,
  open,
}: {
  system: string;
  loading: boolean;
  error: string | null;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="rounded-xl border bg-gray-50 px-4 py-3 shadow-sm w-[680px] max-w-full">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-medium text-gray-700">System prompt (diagnóstico)</div>
        <button
          type="button"
          onClick={onToggle}
          className="text-xs rounded-md border px-2 py-1 text-gray-600 hover:bg-white"
        >
          {open ? "Ocultar" : "Mostrar"}
        </button>
      </div>
      {open && (
        <div className="mt-3">
          {error && (
            <div className="rounded-md border border-red-300 bg-red-50 p-3 text-xs text-red-800">
              Error: {error}
            </div>
          )}
          {!error && loading && (
            <div className="rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground">
              Generando vista previa…
            </div>
          )}
          {!error && !loading && (
            <pre className="whitespace-pre-wrap break-words rounded-md border bg-white p-3 text-xs font-mono text-gray-800">
              {system || "—"}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

/* ========== PAGE ========== */
export default function ReviewsSettingsPage() {
  const boot = useBootstrapData();
  const companyId = resolveCompanyId(boot);

  const [settings, setSettings] = useState<ResponseSettings>(defaultSettings);
  const [isModified, setIsModified] = useState(false);
  const [previewStar, setPreviewStar] = useState<1 | 3 | 5>(5);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // prompt preview
  const [sysOpen, setSysOpen] = useState(true);
  const [sysLoading, setSysLoading] = useState(false);
  const [systemText, setSystemText] = useState("");
  const [sysError, setSysError] = useState<string | null>(null);

  // load settings
  useEffect(() => {
    if (!companyId) return;
    let ignore = false;
    (async () => {
      try {
        const res = await fetch(`/api/companies/${companyId}/response-settings`, { cache: "no-store" });
        const data = await res.json();
        if (ignore) return;
        setSettings(data?.settings ?? defaultSettings);
        setIsModified(false);
      } catch {
        setSettings(defaultSettings);
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [companyId]);

  // load prompt (RUTA PLURAL)
  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        setSysLoading(true);
        setSysError(null);
        const mapped = toEngineSettings(settings);
        const example = sampleReviewByStar(previewStar);

        const res = await fetch("/api/responses/preview", {
          method: "POST",
          signal: controller.signal,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            settings: mapped,
            review: example,
          }),
        });

        const ct = (res.headers.get("content-type") || "").toLowerCase();
        const json = ct.includes("application/json")
          ? await res.json()
          : { ok: false, error: await res.text() };
        if (!json?.ok) throw new Error(json?.error || "preview_failed");
        setSystemText(String(json.system || ""));
      } catch (e: any) {
        if (e?.name !== "AbortError") setSysError(e?.message || "No se pudo generar el preview");
      } finally {
        setSysLoading(false);
      }
    })();
    return () => controller.abort();
  }, [JSON.stringify(settings), previewStar]);

  const updateSettings = (updates: Partial<ResponseSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
    setIsModified(true);
  };

  const handleSave = async () => {
    if (!companyId || isSaving) return;
    setIsSaving(true);
    try {
      await fetch(`/api/companies/${companyId}/response-settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      setIsModified(false);
      toast({ title: "Cambios guardados", description: "Tus ajustes se han actualizado correctamente." });
    } catch {
      toast({ variant: "error", title: "Error al guardar", description: "Inténtalo de nuevo." });
    } finally {
      setIsSaving(false);
    }
  };

  if (!companyId) return <div className="p-6 text-sm text-muted-foreground">No hay compañía activa.</div>;
  if (loading) return <div className="p-6">Cargando…</div>;

  return (
    <div className="space-y-6 mx-auto w-full max-w-[1400px] px-3 sm:px-6">
      {/* 1️⃣ System prompt alineado a la derecha (más ancho total del layout) */}
      <div className="flex justify-end">
        <SystemPromptPanel
          system={systemText}
          loading={sysLoading}
          error={sysError}
          onToggle={() => setSysOpen((v) => !v)}
          open={sysOpen}
        />
      </div>

      {/* 2️⃣ Preview a TODO el ancho del contenedor */}
      <ResponsePreview
        settings={settings}
        selectedStar={previewStar}
        onStarChange={setPreviewStar}
        className="w-full"
      />

      {/* 3️⃣ Bloque principal con sidebar y settings (más ancho y sin desbordes) */}
      <div className="w-full h-[80svh] overflow-hidden bg-white grid grid-cols-[15%_85%] rounded-xl border">
        {/* Sidebar fija */}
        <SettingsSidebar />

        {/* Panel derecho con top fijo (acciones) y scroll — contención horizontal */}
        <section className="flex flex-col h-full min-w-0">
          <div className="border-b border-slate-200/70 px-5 py-4 shrink-0">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                disabled={!isModified}
                onClick={() => window.location.reload()}
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

          {/* ÚNICO scroll: el shell con PREVIEW + secciones — evita sobresalir */}
          <div className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden">
            <SettingsShell
              settings={settings}
              onUpdate={updateSettings}
              selectedStar={previewStar}
              onStarChange={setPreviewStar}
              className="max-w-full"
            />
          </div>
        </section>
      </div>

      <LoadingOverlay show={isSaving} text="Guardando ajustes…" />
    </div>
  );
}
