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
  totalUsers: number;          // 👈 NUEVO
};

const qk = {
  companySummary: (companyId: string) => ["company", companyId, "summary"] as const,
};

async function fetchCompanySummary(companyId: string): Promise<Metrics> {
  const res = await fetch(`/api/companies/${companyId}/summary`, {
    method: "GET",
    headers: { Accept: "application/json" },
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

export function useCompanySummary(companyId: string | null) {
  const id = companyId ?? "pending";

  return useQuery<Metrics, Error>({
    queryKey: qk.companySummary(id),
    queryFn: () => fetchCompanySummary(id),
    enabled: Boolean(companyId),
  });
}

export async function prefetchCompanySummary(client: QueryClient, companyId: string) {
  await client.prefetchQuery({
    queryKey: qk.companySummary(companyId),
    queryFn: () => fetchCompanySummary(companyId),
  });
}
