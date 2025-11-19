// app/components/steps/LinkEstablishmentStep.tsx
"use client";

import * as React from "react";
import type { OnboardingStepProps } from "@/app/components/onboarding/steps";
import { Loader2, MapPin, Star } from "lucide-react";
import { cn } from "@/lib/utils";

type GbpLocationStatus = "available" | "active" | "pending_upgrade" | "blocked";

type GbpLocation = {
  id: string;
  externalLocationName?: string;
  title: string;
  address: string;
  rating?: number;
  totalReviewCount?: number;
  status: GbpLocationStatus;
};

export function LinkEstablishmentStep({ state }: OnboardingStepProps) {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [locations, setLocations] = React.useState<GbpLocation[]>([]);
  const [maxConnectable, setMaxConnectable] = React.useState(1);
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [companyId, setCompanyId] = React.useState<string | null>(null);

  // Cargar selección previa desde el flowState (si existe)
  React.useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyState = state as any;
    if (Array.isArray(anyState.selectedGoogleLocationIds)) {
      setSelectedIds(anyState.selectedGoogleLocationIds);
    }
    // solo lectura inicial
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      let resolvedCompanyId: string | null = null;

      // 1) Resolver companyId desde /api/mybusiness/company
      try {
        const res = await fetch("/api/mybusiness/company", {
          credentials: "include",
        });

        if (!res.ok) {
          console.error(
            "[LinkEstablishmentStep] /api/mybusiness/company status",
            res.status,
          );
        } else {
          const data = await res.json().catch(() => null);
          const idFromApi = data?.company?.id as string | undefined;
          if (idFromApi) {
            resolvedCompanyId = idFromApi.trim();
          }
        }
      } catch (err) {
        console.error("[LinkEstablishmentStep] error fetching company", err);
      }

      console.log(
        "[LinkEstablishmentStep] resolved companyId:",
        resolvedCompanyId,
      );

      if (!resolvedCompanyId) {
        if (!cancelled) {
          setError(
            "No se ha encontrado ninguna empresa asociada a tu usuario.",
          );
          setLoading(false);
        }
        return;
      }

      if (!cancelled) {
        setCompanyId(resolvedCompanyId);
      }

      try {
        // 2) Sincronizar cuenta GBP (por si acaso)
        try {
          await fetch(
            "/api/integrations/google/business-profile/sync/accounts",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ companyId: resolvedCompanyId }),
            },
          );
        } catch (err) {
          console.error("[Onboarding][GBP] sync/accounts error", err);
        }

        // 3) Leer locations ya sincronizadas desde la BD
        const locRes = await fetch(
          "/api/integrations/google/business-profile/locations",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ companyId: resolvedCompanyId }),
          },
        );

        if (!locRes.ok) {
          const text = await locRes.text().catch(() => "");
          throw new Error(`HTTP ${locRes.status} - ${text}`);
        }

        const data = await locRes.json().catch(() => null);

        const rawLocations: any[] = Array.isArray(data?.locations)
          ? data.locations
          : [];

        const mapped: GbpLocation[] = rawLocations
          .map((l: any) => {
            const status: GbpLocationStatus =
              (l.status as GbpLocationStatus) ?? "available";

            let ratingNum: number | undefined;
            if (typeof l.rating === "number") {
              ratingNum = l.rating;
            } else if (typeof l.rating === "string") {
              const parsed = Number.parseFloat(l.rating);
              if (Number.isFinite(parsed)) ratingNum = parsed;
            }

            let totalReviews = 0;
            if (typeof l.totalReviewCount === "number") {
              totalReviews = l.totalReviewCount;
            } else if (typeof l.total_review_count === "number") {
              totalReviews = l.total_review_count;
            }

            const idRaw =
              l.id ??
              l.google_location_id ??
              l.externalLocationName ??
              l.external_location_name ??
              null;

            const id =
              typeof idRaw === "string"
                ? idRaw
                : idRaw !== null
                ? String(idRaw)
                : "";

            if (!id) return null;

            return {
              id,
              externalLocationName:
                l.externalLocationName ?? l.external_location_name ?? "",
              title: l.title ?? "Sin nombre",
              address: l.address ?? "",
              rating: ratingNum,
              totalReviewCount: totalReviews,
              status,
            } as GbpLocation;
          })
          .filter((loc): loc is GbpLocation => loc !== null);

        console.log("[LinkEstablishmentStep] locations from API:", mapped);

        if (!cancelled) {
          setLocations(mapped);
          const mc =
            typeof data?.maxConnectable === "number" &&
            data.maxConnectable > 0
              ? data.maxConnectable
              : 1;
          setMaxConnectable(mc);
        }

        // 4) Sincronizar reviews en segundo plano (no afecta a la UI)
        fetch(
          "/api/integrations/google/business-profile/sync/reviews",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ companyId: resolvedCompanyId }),
          },
        ).catch((err) => {
          console.error("[Onboarding][GBP] sync/reviews error", err);
        });
      } catch (err) {
        console.error("[Onboarding][GBP] error cargando locations", err);
        if (!cancelled) {
          setError(
            "No se han podido cargar las ubicaciones desde Google Business. Revisa que la conexión esté completa.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function activateSelection(nextSelected: string[]) {
    if (!companyId || nextSelected.length === 0) return;

    try {
      await fetch(
        "/api/integrations/google/business-profile/locations/activate",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            companyId,
            selectedIds: nextSelected, // IDs de google_gbp_location.id
          }),
        },
      );
    } catch (err) {
      console.error("[LinkEstablishmentStep] error activating location", err);
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      let next: string[];

      const isSelected = prev.includes(id);

      // Solo una selección posible:
      if (isSelected) {
        next = [];
      } else {
        next = [id];
      }

      // Actualizar flowState para que el botón "Siguiente" sepa si hay selección
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const anyState = state as any;
      anyState.selectedGoogleLocationIds = next;

      // Activar en backend
      void activateSelection(next);

      return next;
    });
  }

  return (
    <div className="space-y-4 text-slate-700">
      <p className="text-sm leading-relaxed">
        Tu cuenta ya está conectada a{" "}
        <span className="font-semibold">Google Business Profile</span>.
      </p>
      <p className="text-sm leading-relaxed">
        Selecciona la ficha de Google que corresponde a este establecimiento.
        Crussader usará esta vinculación para leer reseñas y estadísticas de esa
        ubicación.
      </p>

      {loading && (
        <div className="flex items-center gap-2 text-xs text-slate-600 rounded-lg bg-slate-50 px-3 py-2">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Cargando establecimientos desde Google Business…
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
                      onChange={() => {
                        if (!disabled) toggleSelect(loc.id);
                      }}
                    />

                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900">
                          {loc.title || "Sin nombre"}
                        </span>
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
  );
}
