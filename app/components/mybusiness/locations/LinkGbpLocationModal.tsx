"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Star } from "lucide-react";
import Spinner from "@/app/components/crussader/UX/Spinner";

type Props = {
  open: boolean;
  locationId: string;
  onClose: () => void;
  onCompanyResolved?: (companyId: string) => void;
  /** Callback opcional para que el padre refresque las locations al vincular */
  onLinked?: () => void | Promise<void>;
};

type LocationApiResponse = {
  ok: boolean;
  location?: {
    id: string;
    companyId: string;
  } | null;
  error?: string;
};

type GbpAccountWire = {
  id: string;
  googleAccountId: string;
  name: string | null;
  avgRating: number | null;
  reviewCount: number | null;
};

type GbpLocationWire = {
  id: string;
  googleLocationId: string;
  title: string | null;
  address: string | null;
  status: string | null;
  linkedLocationId: string | null;
  avgRating: number | null;
  reviewCount: number | null;
};

type GbpLocationsApiResponse = {
  ok: boolean;
  account: GbpAccountWire | null;
  locations: GbpLocationWire[];
  error?: string;
};

export default function LinkGbpLocationModal({
  open,
  locationId,
  onClose,
  onCompanyResolved,
  onLinked,
}: Props) {
  // 1) Resolver companyId a partir de la Location interna
  const [loadingLocation, setLoadingLocation] = React.useState(false);
  const [locationError, setLocationError] =
    React.useState<string | null>(null);
  const [companyId, setCompanyId] = React.useState<string | null>(null);

  // 2) Traer locations GBP
  const [gbpLoading, setGbpLoading] = React.useState(false);
  const [gbpError, setGbpError] = React.useState<string | null>(null);
  const [gbpAccount, setGbpAccount] = React.useState<GbpAccountWire | null>(
    null,
  );
  const [gbpLocations, setGbpLocations] = React.useState<GbpLocationWire[]>(
    [],
  );

  // 3) Selección única (por fila clicada)
  const [selectedGbpLocationId, setSelectedGbpLocationId] =
    React.useState<string | null>(null);

  // 4) Estado de vinculación
  const [linking, setLinking] = React.useState(false);

  // Reset al abrir/cerrar
  React.useEffect(() => {
    if (!open) {
      setCompanyId(null);
      setLocationError(null);
      setGbpAccount(null);
      setGbpLocations([]);
      setGbpError(null);
      setSelectedGbpLocationId(null);
      setLoadingLocation(false);
      setGbpLoading(false);
      setLinking(false);
    } else {
      setLoadingLocation(true);
      setGbpLoading(true);
      setLocationError(null);
      setGbpError(null);
      setSelectedGbpLocationId(null);
      setLinking(false);
    }
  }, [open]);

  // Cargar companyId desde locationId
  React.useEffect(() => {
    if (!open || !locationId) return;

    let cancelled = false;

    async function loadLocation() {
      setLoadingLocation(true);
      setLocationError(null);
      setCompanyId(null);

      try {
        const res = await fetch(
          `/api/mybusiness/locations/${encodeURIComponent(locationId)}`,
          { method: "GET" },
        );

        const data = (await res.json().catch(() => null)) as
          | LocationApiResponse
          | null;

        if (!res.ok || !data) {
          if (!cancelled) {
            setLocationError(
              data?.error ||
                `Error al cargar la ubicación (status ${res.status})`,
            );
          }
          return;
        }

        if (!cancelled) {
          if (!data.ok || !data.location) {
            setLocationError(
              data.error || "No se ha encontrado la ubicación.",
            );
            return;
          }

          const cid = data.location.companyId;
          setCompanyId(cid);
          if (cid && onCompanyResolved) onCompanyResolved(cid);
        }
      } catch {
        if (!cancelled) {
          setLocationError("Error de red al cargar la ubicación.");
        }
      } finally {
        if (!cancelled) {
          setLoadingLocation(false);
        }
      }
    }

    loadLocation();

    return () => {
      cancelled = true;
    };
  }, [open, locationId, onCompanyResolved]);

  // Cargar GBP locations cuando ya tenemos companyId
  React.useEffect(() => {
    if (!open || !companyId) {
      setGbpLoading(false);
      return;
    }

    let cancelled = false;

    async function loadGbpData(cid: string) {
      setGbpLoading(true);
      setGbpError(null);
      setGbpAccount(null);
      setGbpLocations([]);
      setSelectedGbpLocationId(null);

      try {
        const params = new URLSearchParams({ companyId: cid });
        const res = await fetch(
          `/api/mybusiness/locations/gbp?${params.toString()}`,
          { method: "GET" },
        );

        const data = (await res.json().catch(() => null)) as
          | GbpLocationsApiResponse
          | null;

        if (!res.ok || !data) {
          if (!cancelled) {
            setGbpError(
              data?.error ||
                `Error al cargar las locations de Google (status ${res.status})`,
            );
          }
          return;
        }

        if (!cancelled) {
          setGbpAccount(data.account ?? null);
          setGbpLocations(Array.isArray(data.locations) ? data.locations : []);
          if (!data.ok && data.error) setGbpError(data.error);
        }
      } catch {
        if (!cancelled) {
          setGbpError(
            "Error de red al cargar las ubicaciones de Google Business.",
          );
        }
      } finally {
        if (!cancelled) {
          setGbpLoading(false);
        }
      }
    }

    loadGbpData(companyId);

    return () => {
      cancelled = true;
    };
  }, [open, companyId]);

  if (!open) return null;

  const isInitialLoading =
    loadingLocation || (companyId !== null && gbpLoading);

  const title = "Vincular ubicación con Google";

  async function handleLink() {
    if (!selectedGbpLocationId || !locationId) return;
    setLinking(true);
    setGbpError(null);

    try {
      const res = await fetch(
        `/api/mybusiness/locations/${encodeURIComponent(
          locationId,
        )}/link-google`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ gbpLocationId: selectedGbpLocationId }),
        },
      );

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        setGbpError(
          data?.error ||
            `Error al vincular la ubicación (${res.status})`,
        );
        return;
      }

      if (onLinked) {
        await onLinked();
      }

      onClose();
    } catch (err) {
      setGbpError("Error de red al vincular la ubicación.");
    } finally {
      setLinking(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-xl h-[640px] max-h-[80vh] rounded-2xl shadow-2xl bg-white overflow-hidden border border-slate-200 animate-in fade-in duration-150 flex flex-col">
        {/* HEADER */}
        <div className="bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-6 py-5 text-white">
          <h2 className="text-2xl font-semibold">{title}</h2>
        </div>

        {/* BODY */}
        <div className="flex-1 px-6 py-5 flex flex-col gap-4 text-sm text-slate-700 overflow-hidden">
          {/* Texto explicativo */}
          <div className="text-sm leading-relaxed">
            <p className="bg-gradient-to-r from-indigo-600 to-fuchsia-600 bg-clip-text text-transparent text-[13px] font-medium">
              Selecciona la ubicación oficial de Google Business Profile que
              corresponde con esta ubicación interna.
            </p>
            <p className="mt-1 bg-gradient-to-r from-indigo-600 to-fuchsia-600 bg-clip-text text-transparent text-[13px]">
              Usaremos esta vinculación para sincronizar reseñas, ratings y
              datos de visibilidad de forma automática.
            </p>
          </div>

          {isInitialLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <Spinner size={48} speed={2} color="#6366f1" centered />
            </div>
          ) : (
            <>
              {locationError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  {locationError}
                </div>
              )}

              <div className="flex-1 flex flex-col gap-3 min-h-0">
                {gbpError && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                    {gbpError}
                  </div>
                )}

                {!gbpError && !gbpAccount && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                    No se ha encontrado ninguna cuenta de Google Business
                    conectada para esta empresa.
                  </div>
                )}

                {!gbpError && gbpAccount && (
                  <>
                    {gbpLocations.length === 0 ? (
                      <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
                        No hay ubicaciones descargadas para esta cuenta. Lanza
                        una sync desde el módulo de integraciones.
                      </div>
                    ) : (
                      <div className="flex-1 overflow-y-auto rounded-lg border border-slate-200 bg-white/60">
                        {gbpLocations.map((loc) => {
                          const isLinked = Boolean(loc.linkedLocationId);
                          const isSelected =
                            selectedGbpLocationId === loc.id;

                          const hasRating =
                            typeof loc.avgRating === "number" &&
                            Number.isFinite(loc.avgRating);
                          const ratingText = hasRating
                            ? loc.avgRating!.toFixed(1)
                            : "—";
                          const reviewsCount =
                            typeof loc.reviewCount === "number"
                              ? loc.reviewCount
                              : null;

                          return (
                            <button
                              key={loc.id}
                              type="button"
                              onClick={() =>
                                setSelectedGbpLocationId(
                                  isSelected ? null : loc.id,
                                )
                              }
                              className={cn(
                                "w-full text-left px-4 py-3 text-xs flex items-center gap-3 transition-colors border-b border-slate-200",
                                "hover:bg-indigo-50/50",
                                isSelected &&
                                  "bg-indigo-50 border-l-4 border-l-indigo-500",
                              )}
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="font-semibold text-slate-900 text-base truncate">
                                    {loc.title || "(Sin título)"}
                                  </div>
                                  <span
                                    className={cn(
                                      "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border",
                                      isLinked
                                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                        : "border-slate-200 bg-slate-50 text-slate-600",
                                    )}
                                  >
                                    {isLinked ? "Ya vinculada" : "No vinculada"}
                                  </span>
                                </div>

                                {/* Reviews */}
                                <div className="mt-1 text-[13px] text-slate-700">
                                  {reviewsCount !== null &&
                                  reviewsCount > 0 ? (
                                    <div className="flex items-center gap-2">
                                      <span className="inline-flex items-center gap-1">
                                        <span className="font-semibold text-sm">
                                          {ratingText}
                                        </span>
                                        <Star className="h-4 w-4 text-amber-400 fill-current" />
                                        <span className="text-[13px]">
                                          Estrella
                                        </span>
                                      </span>
                                      <span className="text-slate-400">·</span>
                                      <span className="text-[13px]">
                                        {reviewsCount} reseñas
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-[13px] text-slate-500">
                                      Sin reseñas
                                    </span>
                                  )}
                                </div>

                                {loc.address && (
                                  <div className="mt-1 text-[12px] text-slate-500 truncate">
                                    {loc.address}
                                  </div>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </div>

        {/* FOOTER */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={linking}
            className={cn(
              "px-4 py-2 rounded-md text-sm font-medium transition",
              "border border-slate-300 text-slate-700 bg-white hover:bg-slate-50",
              linking && "opacity-60 cursor-not-allowed",
            )}
          >
            Cancelar
          </button>

          <button
            type="button"
            disabled={!selectedGbpLocationId || linking}
            onClick={handleLink}
            className={cn(
              "px-6 py-2 rounded-lg text-sm font-semibold text-white shadow-md transition",
              "bg-gradient-to-r from-indigo-600 to-fuchsia-600",
              "hover:opacity-90 hover:shadow-lg",
              (!selectedGbpLocationId || linking) &&
                "opacity-40 cursor-not-allowed hover:opacity-40 hover:shadow-none",
            )}
          >
            {linking ? "Vinculando…" : "Vincular"}
          </button>
        </div>
      </div>
    </div>
  );
}
