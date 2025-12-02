// app/components/company/CompanyEstablishments.tsx
"use client";

import * as React from "react";
import Image from "next/image";
import { EstablishmentCard } from "@/app/components/company/EstablishmentCard";
import type { LocationRow } from "@/hooks/useCompanyLocations";
import { getBusinessIcon } from "@/lib/businessTypeIcons";
import { Button } from "@/app/components/ui/button";
import { RotateCcw } from "lucide-react";
import LinkGbpLocationModal from "@/app/components/mybusiness/locations/LinkGbpLocationModal";

type Props = {
  companyId: string | null;
};

export function CompanyEstablishments({ companyId }: Props) {
  const [locs, setLocs] = React.useState<LocationRow[]>([]);
  const [locsLoading, setLocsLoading] = React.useState(false);
  const [locsError, setLocsError] = React.useState<string | null>(null);
  const [bulkSyncing, setBulkSyncing] = React.useState(false);

  // 🔹 estado para el modal de vinculación
  const [linkModalOpen, setLinkModalOpen] = React.useState(false);
  const [linkLocationId, setLinkLocationId] = React.useState<string | null>(null);

  const hasCompany = !!companyId;

  const loadLocations = React.useCallback(async () => {
    if (!companyId) return;
    setLocsLoading(true);
    setLocsError(null);
    try {
      const r = await fetch(`/api/companies/${companyId}/locations`, {
        cache: "no-store",
      });
      const j = await r.json();
      if (!r.ok) {
        throw new Error(j?.error || `HTTP ${r.status}`);
      }

      const rawLocs: LocationRow[] = Array.isArray(j?.locations)
        ? j.locations
        : [];

      const withTypeAndIcon = rawLocs.map((loc: any) => {
        const typeName: string | null =
          loc.type?.name ??
          loc.Type?.name ??
          null;

        const typeIcon = getBusinessIcon(typeName ?? "");

        return {
          ...loc,
          __businessTypeName: typeName,
          __businessTypeIcon: typeIcon,
        };
      });

      setLocs(withTypeAndIcon as LocationRow[]);
    } catch (e: any) {
      setLocsError(e?.message || String(e));
    } finally {
      setLocsLoading(false);
    }
  }, [companyId]);

  React.useEffect(() => {
    if (hasCompany && companyId) {
      void loadLocations();
    }
  }, [hasCompany, companyId, loadLocations]);

  // 🔹 helper: saber si una location está vinculada
  function isLocationLinked(loc: any): boolean {
    return Boolean(
      loc.googleLocationId ||
        loc.googlePlaceId ||
        loc.externalConnectionId ||
        loc.ExternalConnection?.id,
    );
  }

  // 🔹 abrir modal de vinculación para una location
  function openLinkModal(locationId: string) {
    setLinkLocationId(locationId);
    setLinkModalOpen(true);
  }

  // 🔹 handler de desconexión (unlink-google)
  async function handleDisconnect(locationId: string) {
    if (!locationId) return;

    try {
      const res = await fetch(
        `/api/mybusiness/locations/${encodeURIComponent(
          locationId,
        )}/unlink-google`,
        {
          method: "POST",
        },
      );

      const j = await res.json().catch(() => null);

      if (!res.ok || !j?.ok) {
        console.error(
          "[CompanyEstablishments] Error al desvincular ubicación:",
          j?.error || `HTTP ${res.status}`,
        );
        return;
      }

      await loadLocations();
    } catch (e: any) {
      console.error(
        "[CompanyEstablishments] Error de red al desvincular ubicación:",
        e?.message || String(e),
      );
    }
  }

  async function handleBulkSync() {
    if (bulkSyncing || locsLoading) return;

    const linkedLocs = locs.filter((loc) => isLocationLinked(loc as any));
    if (linkedLocs.length === 0) {
      return;
    }

    setBulkSyncing(true);
    try {
      for (const loc of linkedLocs) {
        const id = (loc as any).id as string | undefined;
        if (!id) continue;

        const res = await fetch(
          `/api/mybusiness/locations/${id}/refresh-reviews`,
          { method: "POST" },
        );

        const j = await res.json().catch(() => ({}));

        if (!res.ok || !j?.ok) {
          console.error(
            `Error al refrescar reviews de la ubicación ${id}:`,
            j?.error || `HTTP ${res.status}`,
          );
        }
      }

      await loadLocations();
    } catch (e: any) {
      alert(e?.message || String(e));
    } finally {
      setBulkSyncing(false);
    }
  }

  if (!hasCompany || !companyId) {
    return null;
  }

  const anyLinked = locs.some((loc) => isLocationLinked(loc as any));
  const disableBulk =
    locsLoading || bulkSyncing || !anyLinked;

  return (
    <>
      <section className="space-y-3 rounded border bg-white p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          {/* Título + icono */}
          <div className="flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 sm:h-12 sm:w-12">
              <Image
                src="/icon/location.png"
                alt="Ubicaciones"
                width={24}
                height={24}
                className="sm:h-7 sm:w-7 h-5 w-5"
              />
            </span>
            <span className="text-sm font-semibold text-slate-900 sm:text-base md:text-lg">
              Ubicaciones vinculadas a tu empresa
            </span>
          </div>

          {/* Botón global de actualizar reseñas */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleBulkSync}
            disabled={disableBulk}
            className="inline-flex items-center gap-2 text-xs md:text-sm"
          >
            <RotateCcw
              className={`h-4 w-4 ${
                bulkSyncing ? "animate-spin" : ""
              }`}
            />
            <span>
              {bulkSyncing
                ? "Actualizando reseñas..."
                : "Actualizar reseñas"}
            </span>
          </Button>
        </div>

        {locsError && (
          <div className="text-sm text-red-600">
            {locsError}
          </div>
        )}

        {locsLoading ? (
          <div className="grid gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-20 animate-pulse rounded-xl border bg-muted/40"
              />
            ))}
          </div>
        ) : locs.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No hay ubicaciones todavía. Crea tu primera ubicación desde el flujo guiado.
          </div>
        ) : (
          <div className="grid gap-4">
            {locs.map((loc: any) => (
              <EstablishmentCard
                key={loc.id}
                location={loc}
                companyId={companyId}
                typeName={loc.__businessTypeName ?? null}
                typeIcon={loc.__businessTypeIcon}
                // 🔹 Conectar → abre modal
                onConnect={() => openLinkModal(loc.id)}
                // 🔹 Desconectar → unlink-google
                onDisconnect={() => handleDisconnect(loc.id)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Modal de vinculación con Google Business */}
      <LinkGbpLocationModal
        open={linkModalOpen}
        locationId={linkLocationId ?? ""}
        onClose={() => setLinkModalOpen(false)}
        onCompanyResolved={() => {
          // opcional, ahora mismo no necesitamos nada aquí
        }}
        onLinked={async () => {
          await loadLocations();
          setLinkModalOpen(false);
        }}
      />
    </>
  );
}
