// hooks/useCompanySummary.ts
"use client";

import { useQuery, QueryClient } from "@tanstack/react-query";

export type Metrics = {
  totalEstablishments: number;
  totalReviews: number;
  averageRating: number;
  last30Reviews: number;
  prev30Reviews: number;
  monthlyGrowthPct: number;
};

const qk = {
  companySummary: (companyId: string) => ["company", companyId, "summary"] as const,
};

async function fetchCompanySummary(companyId: string): Promise<Metrics> {
  const res = await fetch(`/api/companies/${companyId}/summary`, {
    method: "GET",
    headers: { "Accept": "application/json" },
    // Importantísimo: evita caché del navegador, dejamos que React Query gestione el cache
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`GET /api/companies/${companyId}/summary → HTTP ${res.status}`);
  }

  const json = await res.json();
  const metrics: Metrics | null = json?.metrics ?? null;

  if (!metrics) {
    throw new Error("Respuesta sin 'metrics'");
  }

  return metrics;
}

/**
 * Hook de lectura con cache/buffer gestionado por React Query.
 * - No dispara hasta tener companyId (enabled).
 * - Usa las políticas por defecto definidas en QueryProvider (staleTime, gcTime…).
 */
export function useCompanySummary(companyId: string | null) {
  // Clave siempre definida; no dispara mientras enabled=false
  const id = companyId ?? "pending";

  return useQuery<Metrics, Error>({
    queryKey: qk.companySummary(id),
    queryFn: () => fetchCompanySummary(id),
    enabled: Boolean(companyId), // solo fetch si hay companyId real
  });
}


/**
 * Utilidad para precargar en el buffer (prefetch) tras login.
 * La usaremos en el paso de “precarga en paralelo”.
 */
export async function prefetchCompanySummary(client: QueryClient, companyId: string) {
  await client.prefetchQuery({
    queryKey: qk.companySummary(companyId),
    queryFn: () => fetchCompanySummary(companyId),
  });
}
