// app/components/mybusiness/locations/GoogleLocationLinkModal.tsx
"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/app/components/ui/button";
import { Loader2, MapPin, X } from "lucide-react";
import { cn } from "@/lib/utils";

type GoogleLocationRow = {
  id: string;                // UUID de google_gbp_location
  google_location_title?: string | null;
  title?: string | null;
  address?: string | null;
  google_location_id?: string | null; // "locations/123..."
};

type Props = {
  open: boolean;
  onClose: () => void;

  /** Empresa Crussader (para filtrar google_gbp_location) */
  companyId?: string | null;

  /** Id de la location interna que estamos emparejando (solo para mostrar contexto) */
  appLocationName?: string | null;

  /** Callback cuando el usuario confirma la selección */
  onSelect?: (googleLocationId: string, googleLocationDbId: string) => void;
};

export function GoogleLocationLinkModal({
  open,
  onClose,
  companyId,
  appLocationName,
  onSelect,
}: Props) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [rows, setRows] = React.useState<GoogleLocationRow[]>([]);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  // Cargar google_gbp_location de la BD cuando se abre el modal
  React.useEffect(() => {
    if (!open) return;
    if (!companyId) {
      setError("No hay empresa activa para cargar ubicaciones de Google.");
      setRows([]);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      setRows([]);
      setSelectedId(null);

      try {
        // Endpoint que leerá google_gbp_location filtrando por company_id
        const qs = new URLSearchParams({ companyId });
        const res = await fetch(
          `/api/mybusiness/google-locations?${qs.toString()}`,
          {
            method: "GET",
            credentials: "include",
          },
        );

        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(
            text || `No se han podido cargar las ubicaciones de Google.`,
          );
        }

        const data = await res.json();
        const items: GoogleLocationRow[] = Array.isArray(data.locations)
          ? data.locations
          : [];

        if (!cancelled) {
          setRows(items);
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message || "Error al cargar ubicaciones de Google.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, companyId]);

  const handleConfirm = React.useCallback(() => {
    if (!selectedId || !onSelect) {
      onClose();
      return;
    }
    const row = rows.find((r) => r.id === selectedId);
    if (!row) {
      onClose();
      return;
    }
    const apiId =
      row.google_location_id && row.google_location_id.trim().length > 0
        ? row.google_location_id
        : row.id;

    onSelect(apiId, row.id);
  }, [selectedId, rows, onSelect, onClose]);

  const remainingLabel = appLocationName
    ? `Selecciona el establecimiento de Google que corresponde a “${appLocationName}”.`
    : "Selecciona el establecimiento de Google que quieres vincular.";

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
            <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl border border-slate-100/80 overflow-hidden">
              {/* Header */}
              <div className="relative px-5 pt-4 pb-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-slate-50">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <h2 className="text-base font-semibold text-slate-900">
                      Vincular con Google Business
                    </h2>
                    <p className="text-xs text-slate-600 max-w-xl">
                      {remainingLabel}
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
              </div>

              {/* Body */}
              <div className="px-5 py-4 space-y-3">
                {loading && (
                  <div className="flex items-center gap-2 text-xs text-slate-600 rounded-lg bg-slate-50 px-3 py-2">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Cargando establecimientos guardados desde Google…
                  </div>
                )}

                {error && !loading && (
                  <div className="text-xs text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                    {error}
                  </div>
                )}

                {!loading && !error && (
                  <>
                    <div className="max-h-64 overflow-y-auto rounded-xl border border-slate-100 bg-slate-50/40">
                      {rows.length === 0 ? (
                        <div className="px-4 py-8 text-center text-xs text-slate-500">
                          No hay ubicaciones de Google guardadas todavía para esta
                          empresa.
                        </div>
                      ) : (
                        rows.map((loc) => {
                          const title =
                            loc.google_location_title ||
                            loc.title ||
                            "Sin nombre";
                          const address = loc.address || "—";
                          const isSelected = selectedId === loc.id;

                          return (
                            <label
                              key={loc.id}
                              className={cn(
                                "group flex items-start gap-3 px-4 py-2.5 border-b last:border-b-0 border-slate-100 cursor-pointer transition-colors",
                                isSelected &&
                                  "bg-white shadow-[0_0_0_1px_rgba(15,23,42,0.06)]",
                                !isSelected &&
                                  "hover:bg-white/80 hover:shadow-[0_0_0_1px_rgba(15,23,42,0.03)]",
                              )}
                            >
                              <input
                                type="radio"
                                className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                                checked={isSelected}
                                onChange={() => setSelectedId(loc.id)}
                              />

                              <div className="flex flex-col gap-0.5">
                                <span className="text-sm font-semibold text-slate-900">
                                  {title}
                                </span>
                                <div className="flex items-center gap-1 text-[10px] text-slate-600">
                                  <MapPin className="h-3 w-3" />
                                  <span className="truncate max-w-xs">
                                    {address}
                                  </span>
                                </div>
                              </div>
                            </label>
                          );
                        })
                      )}
                    </div>

                    <p className="text-[10px] text-slate-500">
                      Esta vinculación se usará para leer y responder reseñas en
                      Crussader.
                    </p>
                  </>
                )}
              </div>

              {/* Footer */}
              <div className="px-5 pb-4 pt-2 flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/60">
                <div className="text-[10px] text-slate-500">
                  Podrás cambiar esta vinculación más adelante desde la ficha de
                  ubicación.
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
                    disabled={!selectedId || loading}
                    onClick={handleConfirm}
                  >
                    Vincular establecimiento
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
