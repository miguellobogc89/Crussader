"use client";

import { useEffect, useState } from "react";
import {
  Sparkles,
  ShieldCheck,
  Clock,
  MessageCircleMore,
  ChevronUp,
  ChevronDown,
  Loader2,
} from "lucide-react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { useBootstrapData } from "@/app/providers/bootstrap-store";

type AutoPublishMode = "positives" | "mixed" | "manual";

type AutoPublishConfigWire = {
  mode: AutoPublishMode;
  whatsappNotifyEnabled?: boolean;
};

export default function AutoPublishSettingsPanel() {
  const boot = useBootstrapData();
  const companyId = boot?.activeCompany?.id ?? null;

  const [mode, setMode] = useState<AutoPublishMode>("positives");
  const [savedMode, setSavedMode] = useState<AutoPublishMode>("positives");
  const [collapsed, setCollapsed] = useState(false);

  const [initialLoading, setInitialLoading] = useState<boolean>(!!companyId);
  const [saving, setSaving] = useState(false);

  // De momento WhatsApp siempre desactivado (solo mock visual)
  const whatsappEnabled = false;

  const modeLabel =
    mode === "positives"
      ? "Solo reseñas positivas"
      : mode === "mixed"
      ? "Automático equilibrado"
      : "Revisión manual";

  const hasChanges = mode !== savedMode;

  // Cargar configuración inicial desde BD
  useEffect(() => {
    if (!companyId) {
      setInitialLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        setInitialLoading(true);
        const res = await fetch(
          `/api/reviews/response/auto-publish/${companyId}`,
          { cache: "no-store" }
        );

        if (!res.ok) {
          return;
        }

        const json = await res.json();
        const cfg: AutoPublishConfigWire | undefined =
          json?.settings?.config?.autoPublish;

        if (!cancelled && cfg?.mode) {
          setMode(cfg.mode);
          setSavedMode(cfg.mode);
        }
      } catch {
        // silencioso, usamos defaults
      } finally {
        if (!cancelled) {
          setInitialLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [companyId]);

  async function handleSave() {
    if (!companyId || !hasChanges || saving) return;

    try {
      setSaving(true);
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
      // si falla, dejamos el modo en pantalla y que el user reintente
    } finally {
      setSaving(false);
    }
  }

  return (
    <motion.div
      layout
      transition={{ type: "spring", stiffness: 260, damping: 26 }}
    >
      <Card className="border-sky-200/80 bg-sky-50 backdrop-blur-sm shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div
              className={
                collapsed
                  ? "flex h-5 flex-1 items-center justify-between gap-3"
                  : "flex flex-1 flex-col gap-1"
              }
            >
              <div className="flex items-center gap-2">
                <CardTitle className="text-base sm:text-lg font-semibold text-slate-900">
                  Autopublicación en Google
                </CardTitle>
                <Badge
                  variant="outline"
                  className="border-violet-200 bg-violet-50 text-[11px] font-medium text-violet-700"
                >
                  Beta
                </Badge>
              </div>

              {collapsed ? (
                <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-600">
                  <div className="inline-flex items-center gap-1.5">
                    {mode === "positives" && (
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                    )}
                    {mode === "mixed" && (
                      <Clock className="h-3.5 w-3.5 text-amber-500" />
                    )}
                    {mode === "manual" && (
                      <MessageCircleMore className="h-3.5 w-3.5 text-sky-500" />
                    )}
                    <span className="font-medium text-slate-800">
                      {modeLabel}
                    </span>
                  </div>

                  <span className="h-1 w-1 rounded-full bg-slate-300" />

                  <div className="inline-flex items-center gap-1.5">
                    <div
                      className={[
                        "flex h-6 w-6 items-center justify-center rounded-full border",
                        whatsappEnabled
                          ? "border-emerald-300 bg-emerald-50"
                          : "border-slate-200 bg-slate-50 opacity-70",
                      ].join(" ")}
                    >
                      <Image
                        src="/platform-icons/whatsapp.png"
                        alt="WhatsApp"
                        width={14}
                        height={14}
                      />
                    </div>
                    <span className="text-[11px] text-slate-600">
                      WhatsApp {whatsappEnabled ? "activo" : "desactivado"}
                    </span>
                  </div>
                </div>
              ) : (
                <>
                  <CardDescription className="mt-1 text-xs sm:text-sm text-slate-500 max-w-xl">
                    Elige qué reseñas se publican automáticamente. Todas las
                    respuestas se generan con IA.
                  </CardDescription>

                  {/* Píldora IA + botón guardar/sin cambios */}
                  <div className="mt-2 border inline-flex items-center justify-between gap-2 rounded-full bg-slate-50 px-3 py-1 text-[11px] text-slate-500">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-3.5 w-3.5 text-violet-500" />
                      <span>
                        IA activa para todas las reseñas
                        {initialLoading ? " (cargando…)" : ""}
                      </span>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      disabled={
                        !companyId || initialLoading || saving || !hasChanges
                      }
                      onClick={handleSave}
                      className="h-6 px-2 py-0 text-[11px] border-slate-300 bg-white"
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
                </>
              )}
            </div>

            <button
              type="button"
              onClick={() => setCollapsed((v) => !v)}
              className="m-auto inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700 transition"
            >
              {collapsed ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronUp className="h-3.5 w-3.5" />
              )}
              <span className="sr-only">
                {collapsed ? "Expandir panel" : "Contraer panel"}
              </span>
            </button>
          </div>
        </CardHeader>

        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.div
              key="content"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <CardContent className="space-y-4 sm:space-y-5 pt-0 pb-4">
                {/* Opciones de estrategia */}
                <div className="grid gap-3 sm:grid-cols-3">
                  {/* Solo positivas */}
                  <button
                    type="button"
                    onClick={() => setMode("positives")}
                    disabled={saving || initialLoading}
                    className={[
                      "flex bg-white items-center gap-3 sm:gap-4 rounded-xl border p-3 sm:p-4 text-left transition",
                      mode === "positives"
                        ? "border-violet-300 bg-violet-50/80 shadow-[0_0_0_1px_rgba(139,92,246,0.20)]"
                        : "border-slate-200 hover:border-violet-200 hover:bg-violet-50/40",
                      saving || initialLoading ? "opacity-80 cursor-not-allowed" : "",
                    ].join(" ")}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50">
                      <ShieldCheck className="h-6 w-12 text-emerald-500" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium text-slate-900">
                        Solo reseñas positivas
                      </span>
                      <span className="text-xs text-slate-500">
                        Publicamos automáticamente 4★ y 5★. El resto queda
                        pendiente.
                      </span>
                    </div>
                  </button>

                  {/* Mezcla automática */}
                  <button
                    type="button"
                    onClick={() => setMode("mixed")}
                    disabled={saving || initialLoading}
                    className={[
                      "flex bg-white items-center gap-3 sm:gap-4 rounded-xl border p-3 sm:p-4 text-left transition",
                      mode === "mixed"
                        ? "border-violet-300 bg-violet-50/80 shadow-[0_0_0_1px_rgba(139,92,246,0.20)]"
                        : "border-slate-200 hover:border-violet-200 hover:bg-violet-50/40",
                      saving || initialLoading ? "opacity-80 cursor-not-allowed" : "",
                    ].join(" ")}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-50">
                      <Clock className="h-6 w-12 text-amber-500" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium text-slate-900">
                        Automático equilibrado
                      </span>
                      <span className="text-xs text-slate-500">
                        Publicamos 3–5★. Las críticas fuertes (1–2★) siempre se
                        revisan.
                      </span>
                    </div>
                  </button>

                  {/* Revisión manual */}
                  <button
                    type="button"
                    onClick={() => setMode("manual")}
                    disabled={saving || initialLoading}
                    className={[
                      "flex bg-white items-center gap-3 sm:gap-4 rounded-xl border p-3 sm:p-4 text-left transition",
                      mode === "manual"
                        ? "border-violet-300 bg-violet-50/80 shadow-[0_0_0_1px_rgba(139,92,246,0.20)]"
                        : "border-slate-200 hover:border-violet-200 hover:bg-violet-50/40",
                      saving || initialLoading ? "opacity-80 cursor-not-allowed" : "",
                    ].join(" ")}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-50">
                      <MessageCircleMore className="h-6 w-12 text-sky-500" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium text-slate-900">
                        Revisión manual
                      </span>
                      <span className="text-xs text-slate-500">
                        Nada se publica solo. Todas las respuestas quedan como
                        pendientes.
                      </span>
                    </div>
                  </button>
                </div>

                {/* WhatsApp (mock, icono izquierda y botón derecha) */}
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
                      className="text-xs text-slate-500 border-slate-300 bg-white"
                    >
                      Configurar WhatsApp
                    </Button>
                  </div>
                </div>
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}
