// app/components/reviews/summary/AutoPublishSettingsPanel.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { ShieldCheck, Clock, MessageCircleMore, Loader2 } from "lucide-react";
import Image from "next/image";

import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { useBootstrapData } from "@/app/providers/bootstrap-store";

type AutoPublishMode = "positives" | "mixed" | "manual";

type AutoPublishConfigWire = {
  mode: AutoPublishMode;
  whatsappNotifyEnabled?: boolean;
};

function getModeLabel(mode: AutoPublishMode) {
  if (mode === "positives") return "Solo reseñas positivas";
  if (mode === "mixed") return "Automático equilibrado";
  return "Revisión manual";
}

export default function AutoPublishSettingsPanel() {
  const boot = useBootstrapData();
  const companyId = boot?.activeCompany?.id ?? null;

  const [mode, setMode] = useState<AutoPublishMode>("manual");
  const [savedMode, setSavedMode] = useState<AutoPublishMode>("manual");

  const [initialLoading, setInitialLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const modeLabel = useMemo(() => getModeLabel(mode), [mode]);

  const hasChanges = mode !== savedMode;
  const canSave = !!companyId && !initialLoading && !saving && hasChanges;

  useEffect(() => {
    if (!companyId) return;

    let cancelled = false;

    (async () => {
      setInitialLoading(true);
      try {
        const res = await fetch(
          `/api/reviews/response/auto-publish/${companyId}`,
          { cache: "no-store" }
        );

        if (!res.ok) return;

        const json = await res.json();
        const cfg: AutoPublishConfigWire | undefined =
          json?.settings?.config?.autoPublish;

        if (cancelled) return;

        if (cfg && cfg.mode) {
          setMode(cfg.mode);
          setSavedMode(cfg.mode);
        } else {
          setMode("manual");
          setSavedMode("manual");
        }
      } catch {
        if (!cancelled) {
          setMode("manual");
          setSavedMode("manual");
        }
      } finally {
        if (!cancelled) setInitialLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [companyId]);

  async function handleSave() {
    if (!canSave) return;
    if (!companyId) return;

    setSaving(true);
    try {
      const res = await fetch(
        `/api/reviews/response/auto-publish/${companyId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode }),
        }
      );

      if (res.ok) {
        setSavedMode(mode);
      }
    } catch {
      // silencioso: permitimos reintento
    } finally {
      setSaving(false);
    }
  }

  const optionDisabled = saving || initialLoading;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-slate-900">
            Estrategia de publicación
          </div>
          <div className="mt-1 text-xs text-slate-600">
            Elige cómo quieres que Crussader publique las respuestas en Google.
          </div>

          <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-medium text-slate-700">
            <span className="text-slate-500">Actual:</span>
            <span className="text-slate-900">{modeLabel}</span>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          disabled={!canSave}
          onClick={handleSave}
          className={[
            "h-8 px-3 py-0 text-[11px] font-medium rounded-full border transition-colors disabled:opacity-60 disabled:cursor-not-allowed",
            canSave
              ? "border-0 bg-gradient-to-r from-sky-500 to-violet-500 text-white shadow-sm hover:from-sky-500/90 hover:to-violet-500/90"
              : "border-slate-300 bg-white text-slate-500",
          ].join(" ")}
        >
          {saving ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : hasChanges ? (
            "Guardar"
          ) : (
            "Sin cambios"
          )}
        </Button>
      </div>

      {/* Opciones */}
      <div className="grid gap-3 grid-cols-1 lg:grid-cols-3">
        <button
          type="button"
          onClick={() => setMode("positives")}
          disabled={optionDisabled}
          className={[
            "flex items-center gap-3 rounded-xl border bg-white p-3 text-left transition sm:gap-4 sm:p-4",
            mode === "positives"
              ? "border-violet-300 bg-violet-50/80 shadow-[0_0_0_1px_rgba(139,92,246,0.20)]"
              : "border-slate-200 hover:border-violet-200 hover:bg-violet-50/40",
            optionDisabled ? "cursor-not-allowed opacity-80" : "",
          ].join(" ")}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50">
            <ShieldCheck className="h-5 w-5 text-emerald-500" />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-slate-900">
              Solo reseñas positivas
            </span>
            <span className="text-xs text-slate-500">
              Publicamos automáticamente 4★ y 5★. El resto queda pendiente.
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setMode("mixed")}
          disabled={optionDisabled}
          className={[
            "flex items-center gap-3 rounded-xl border bg-white p-3 text-left transition sm:gap-4 sm:p-4",
            mode === "mixed"
              ? "border-violet-300 bg-violet-50/80 shadow-[0_0_0_1px_rgba(139,92,246,0.20)]"
              : "border-slate-200 hover:border-violet-200 hover:bg-violet-50/40",
            optionDisabled ? "cursor-not-allowed opacity-80" : "",
          ].join(" ")}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-50">
            <Clock className="h-5 w-5 text-amber-500" />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-slate-900">
              Automático equilibrado
            </span>
            <span className="text-xs text-slate-500">
              Publicamos 3–5★. Las críticas fuertes (1–2★) siempre se revisan.
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setMode("manual")}
          disabled={optionDisabled}
          className={[
            "flex items-center gap-3 rounded-xl border bg-white p-3 text-left transition sm:gap-4 sm:p-4",
            mode === "manual"
              ? "border-violet-300 bg-violet-50/80 shadow-[0_0_0_1px_rgba(139,92,246,0.20)]"
              : "border-slate-200 hover:border-violet-200 hover:bg-violet-50/40",
            optionDisabled ? "cursor-not-allowed opacity-80" : "",
          ].join(" ")}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-50">
            <MessageCircleMore className="h-5 w-5 text-sky-500" />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-slate-900">
              Revisión manual
            </span>
            <span className="text-xs text-slate-500">
              Nada se publica solo. Todas las respuestas quedan como pendientes.
            </span>
          </div>
        </button>
      </div>

      {/* WhatsApp mock */}
      <div className="flex flex-col gap-3 rounded-lg border border-dashed border-slate-200 bg-slate-50/70 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm">
            <Image
              src="/platform-icons/whatsapp.png"
              alt="WhatsApp"
              width={30}
              height={30}
            />
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-medium text-slate-800">
                Notificar por WhatsApp
              </span>
              <Badge
                variant="outline"
                className="border-slate-300 bg-slate-100 text-[10px] text-slate-600"
              >
                Próximamente
              </Badge>
            </div>
            <span className="text-xs text-slate-500">
              Recibirás un aviso cuando publiquemos una respuesta.
            </span>
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            disabled
            className="border-slate-300 bg-white text-xs text-slate-500"
          >
            Configurar WhatsApp
          </Button>
        </div>
      </div>
    </div>
  );
}
