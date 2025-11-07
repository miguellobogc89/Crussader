// app/components/integrations/GbpLocationSelectionModal.tsx
"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/app/components/ui/button";
import { cn } from "@/lib/utils";
import { Loader2, MapPin, Star, X } from "lucide-react";

export type GbpLocationStatus = "available" | "active" | "pending_upgrade" | "blocked";

export type GbpLocationOption = {
  id: string;
  externalLocationName?: string;
  title: string;
  address?: string;
  rating?: number;
  totalReviewCount?: number;
  status: GbpLocationStatus;
};

type Props = {
  open: boolean;
  onClose: () => void;

  locations: GbpLocationOption[];

  /** Cuántos locales se pueden conectar con la suscripción actual */
  maxConnectable: number;

  /** IDs actualmente seleccionados */
  selectedIds: string[];

  /** Toggle de selección (ya aplicas la lógica de límite fuera) */
  onToggleSelect: (id: string) => void;

  /** Cuando el usuario confirma la selección */
  onConfirm?: () => void;

  /** Estados de carga / error (para la llamada inicial al endpoint) */
  loading?: boolean;
  error?: string | null;

  /** Texto opcional para indicar que es modo demo */
  demo?: boolean;
};

export function GbpLocationSelectionModal({
  open,
  onClose,
  locations,
  maxConnectable,
  selectedIds,
  onToggleSelect,
  onConfirm,
  loading = false,
  error,
  demo = true,
}: Props) {
  const remaining = Math.max(maxConnectable - selectedIds.length, 0);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay */}
          <motion.div
            className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal */}
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center px-3"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-100/80 overflow-hidden">
              {/* Header */}
              <div className="relative px-5 pt-4 pb-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-slate-50">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <h2 className="text-base font-semibold text-slate-900">
                      Conectar establecimientos de Google Business
                    </h2>
                    <p className="text-xs text-slate-600 max-w-xl">
                      {demo
                        ? "Simulamos la conexión con tu cuenta de Google Business para que veas cómo será la selección de locales."
                        : "Hemos detectado estos establecimientos en tu cuenta de Google Business. Elige cuáles quieres conectar con Crussader."}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-full"
                    onClick={onClose}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Summary strip */}
                <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] text-slate-600">
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-900 text-white px-2 py-0.5 font-medium">
                    {maxConnectable}{" "}
                    {maxConnectable === 1
                      ? "establecimiento incluido en tu plan"
                      : "establecimientos incluidos en tu plan"}
                  </span>
                  <span>
                    Seleccionados:{" "}
                    <span className="font-semibold text-slate-900">
                      {selectedIds.length}
                    </span>
                  </span>
                  <span>
                    Disponibles:{" "}
                    <span className="font-semibold text-emerald-600">
                      {remaining >= 0 ? remaining : 0}
                    </span>
                  </span>
                  {demo && (
                    <span className="ml-auto text-[9px] uppercase tracking-wide text-slate-500">
                      Modo demo
                    </span>
                  )}
                </div>
              </div>

              {/* Body */}
              <div className="px-5 py-4 space-y-3">
                {loading && (
                  <div className="flex items-center gap-2 text-xs text-slate-600 rounded-lg bg-slate-50 px-3 py-2">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Conectando con tu cuenta de Google Business y cargando
                    establecimientos…
                  </div>
                )}

                {error && !loading && (
                  <div className="text-xs text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                    {error}
                  </div>
                )}

                {!loading && !error && (
                  <>
                    <div className="max-h-72 overflow-y-auto rounded-xl border border-slate-100 bg-slate-50/40">
                      {locations.length === 0 ? (
                        <div className="px-4 py-8 text-center text-xs text-slate-500">
                          No se han encontrado ubicaciones para esta cuenta de Google
                          Business.
                        </div>
                      ) : (
                        locations.map((loc) => {
                          const isSelected = selectedIds.includes(loc.id);
                          const disableByLimit =
                            !isSelected && selectedIds.length >= maxConnectable;
                          const disabled =
                            loc.status === "blocked" ||
                            loc.status === "pending_upgrade" ||
                            disableByLimit;

                          const pill =
                            loc.status === "active"
                              ? { label: "Conectado", className: "bg-emerald-50 text-emerald-700" }
                              : loc.status === "pending_upgrade"
                              ? {
                                  label: "Actualizar plan",
                                  className: "bg-amber-50 text-amber-700",
                                }
                              : loc.status === "blocked"
                              ? { label: "Bloqueado", className: "bg-red-50 text-red-700" }
                              : disableByLimit
                              ? {
                                  label: "Límite alcanzado",
                                  className: "bg-slate-100 text-slate-500",
                                }
                              : null;

                          return (
                            <label
                              key={loc.id}
                              className={cn(
                                "group flex items-start gap-3 px-4 py-2.5 border-b last:border-b-0 border-slate-100 cursor-pointer transition-colors",
                                disabled && "opacity-60 cursor-not-allowed",
                                isSelected &&
                                  "bg-white shadow-[0_0_0_1px_rgba(15,23,42,0.06)]",
                                !isSelected &&
                                  !disabled &&
                                  "hover:bg-white/80 hover:shadow-[0_0_0_1px_rgba(15,23,42,0.03)]",
                              )}
                            >
                              <input
                                type="checkbox"
                                className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                                checked={isSelected}
                                disabled={disabled}
                                onChange={() => onToggleSelect(loc.id)}
                              />

                              <div className="flex flex-col gap-0.5">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-semibold text-slate-900">
                                    {loc.title || "Sin nombre"}
                                  </span>
                                  {pill && (
                                    <span
                                      className={cn(
                                        "text-[9px] px-2 py-0.5 rounded-full font-medium",
                                        pill.className,
                                      )}
                                    >
                                      {pill.label}
                                    </span>
                                  )}
                                </div>

                                {loc.address && (
                                  <div className="flex items-center gap-1 text-[10px] text-slate-600">
                                    <MapPin className="h-3 w-3" />
                                    <span className="truncate max-w-xs">
                                      {loc.address}
                                    </span>
                                  </div>
                                )}

                                <div className="flex items-center gap-2 text-[10px] text-slate-500">
                                  <div className="inline-flex items-center gap-1">
                                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                    <span>
                                      {typeof loc.rating === "number"
                                        ? loc.rating.toFixed(1)
                                        : "—"}
                                    </span>
                                  </div>
                                  <span className="text-slate-400">·</span>
                                  <span>
                                    {loc.totalReviewCount ?? 0} reseña
                                    {(loc.totalReviewCount ?? 0) !== 1 && "s"}
                                  </span>
                                </div>
                              </div>
                            </label>
                          );
                        })
                      )}
                    </div>

                    <p className="text-[10px] text-slate-500">
                      Solo conectaremos los establecimientos seleccionados. Cada
                      establecimiento activo consume 1 unidad de tu plan de ubicaciones.
                    </p>
                  </>
                )}
              </div>

              {/* Footer */}
              <div className="px-5 pb-4 pt-2 flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/60">
                <div className="text-[10px] text-slate-500">
                  Puedes modificar estas selecciones más adelante desde la sección de
                  integraciones.
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-3 text-xs"
                    onClick={onClose}
                  >
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    className="h-8 px-4 text-xs"
                    disabled={loading || selectedIds.length === 0}
                    onClick={onConfirm}
                  >
                    {demo
                      ? "Confirmar selección (demo)"
                      : "Conectar establecimientos seleccionados"}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
