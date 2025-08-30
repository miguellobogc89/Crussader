// app/hooks/useCompanyLocations.ts
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { onLocationsRefresh } from "./locationEvents";

export type LocationRow = {
  id: string;
  title: string;
  address?: string | null;
  city?: string | null;
  postalCode?: string | null;
  country?: string | null;
  website?: string | null;
  phone?: string | null;
  googlePlaceId?: string | null;
  reviewsCount: number;
  reviewsAvg: number | null;
  createdAt?: string | null;
};

export function useCompanyLocations(companyId: string | null | undefined) {
  const [loading, setLoading] = useState(false);
  const [error, setErr] = useState<string | null>(null);
  const [rows, setRows] = useState<LocationRow[]>([]);

  const fetcher = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/companies/${companyId}/locations`, { cache: "no-store" });
      const data = await res.json();
      const raw: any[] = Array.isArray(data) ? data : (data.locations ?? []);
      const mapped: LocationRow[] = raw.map((l) => ({
        id: String(l.id),
        title: String(l.title ?? l.name ?? "Sin nombre"),
        address: l.address ?? null,
        city: l.city ?? l.address?.city ?? null,
        postalCode: l.postalCode ?? null,
        country: l.country ?? l.address?.country ?? null,
        website: l.website ?? null,
        phone: l.phone ?? null,
        googlePlaceId: l.googlePlaceId ?? null,
        reviewsCount: Number(l.reviewsCount ?? 0),
        reviewsAvg: l.reviewsAvg != null ? Number(l.reviewsAvg) : null,
        createdAt: l.createdAt ? String(l.createdAt) : null,
      }));
      setRows(mapped);
    } catch (e: any) {
      setErr(e?.message || "fetch_error");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  // carga inicial
  useEffect(() => { fetcher(); }, [fetcher]);

  // suscripción a “refresca ubicaciones de esta empresa”
    useEffect(() => {
    return onLocationsRefresh((id) => {
        if (String(id) === String(companyId)) {
        fetcher();            // ← refetch inmediato
        }
    });
    }, [companyId, fetcher]);


  const api = useMemo(() => ({
    locations: rows,
    loading,
    error,
    refetch: fetcher,
  }), [rows, loading, error, fetcher]);

  return api;
}
