// app/components/company/CompanyEstablishments.tsx
"use client";

import * as React from "react";
import Image from "next/image";
import { EstablishmentCard } from "@/app/components/company/EstablishmentCard";
import type { LocationRow } from "@/hooks/useCompanyLocations";
import { getBusinessIcon } from "@/lib/businessTypeIcons";

type Props = {
  companyId: string | null;
};

export function CompanyEstablishments({ companyId }: Props) {
  const [locs, setLocs] = React.useState<LocationRow[]>([]);
  const [locsLoading, setLocsLoading] = React.useState(false);
  const [locsError, setLocsError] = React.useState<string | null>(null);

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

  function handleConnect(locationId: string) {
    const returnTo = encodeURIComponent("/dashboard/company");
    window.location.href = `/api/connect/google-business/start?locationId=${encodeURIComponent(
      locationId,
    )}&returnTo=${returnTo}`;
  }

  async function handleSync(locationId: string) {
    try {
      const res = await fetch(`/api/locations/${locationId}/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: "manual" }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        alert(j?.error || `Sync falló (${res.status})`);
        return;
      }
      await loadLocations();
    } catch (e: any) {
      alert(e?.message || String(e));
    }
  }

  if (!hasCompany || !companyId) {
    return null;
  }

  return (
    <section className="space-y-3 rounded border bg-white p-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-center">
        <div className="flex items-center gap-2">
          <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100">
            <Image
              src="/icon/location.png"
              alt="Ubicaciones"
              width={28}
              height={28}
            />
          </span>
          <span className="text-base font-semibold text-slate-900 md:text-lg">
            Ubicaciones vinculadas a tu empresa
          </span>
        </div>
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
              onSync={() => handleSync(loc.id)}
              onConnect={() => handleConnect(loc.id)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
