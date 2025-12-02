// hooks/useCompanyLocations.ts
"use client";

import { useQuery, QueryClient } from "@tanstack/react-query";

export type LocationRow = {
  id: string;
  title: string;
  address?: string | null;
  city?: string | null;
  postalCode?: string | null;
  featuredImageUrl: string | null;
  reviewsAvg?: number | null;
  reviewsCount: number;
  googlePlaceId?: string | null;
  externalConnectionId?: string | null;
  ExternalConnection?: { id: string; accountEmail: string | null } | null;
};

const qk = {
  companyLocations: (companyId: string) =>
    ["company", companyId, "locations"] as const,
};

async function fetchCompanyLocations(companyId: string): Promise<LocationRow[]> {
  const res = await fetch(`/api/companies/${companyId}/locations`, {
    method: "GET",
    headers: { Accept: "application/json" },
    // Dejamos la coherencia de cache a React Query; evitamos cache del navegador
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(
      `GET /api/companies/${companyId}/locations → HTTP ${res.status}`
    );
  }

  const json = await res.json();
  // Tu API devuelve { ok, locations } — respetamos eso
  const rows: LocationRow[] = json?.locations ?? [];
  return rows;
}

/**
 * Hook de lectura con cache gestionado por React Query.
 * Acepta companyId nullable; la queryKey siempre es estable y se bloquea con enabled.
 */
export function useCompanyLocations(companyId: string | null) {
  const id = companyId ?? "pending";

  return useQuery<LocationRow[], Error>({
    queryKey: qk.companyLocations(id),
    queryFn: () => fetchCompanyLocations(id),
    enabled: Boolean(companyId),
  });
}

/**
 * Utilidad de prefetch para el “buffer” tras login.
 */
export async function prefetchCompanyLocations(
  client: QueryClient,
  companyId: string
) {
  await client.prefetchQuery({
    queryKey: qk.companyLocations(companyId),
    queryFn: () => fetchCompanyLocations(companyId),
  });
}
