// lib/buffer/prefetchCompany.ts
"use client";

import type { QueryClient } from "@tanstack/react-query";

// Prefetchers existentes (ya creados en pasos previos)
import { prefetchCompanySummary } from "@/hooks/useCompanySummary";
import { prefetchCompanyLocations } from "@/hooks/useCompanyLocations";

/**
 * Añade aquí (import + llamada) cualquier otro prefetch que quieras incluir
 * en el “pack” inicial (por ejemplo, responses-settings, últimos reviews, etc.)
 */
// import { prefetchCompanyResponseSettings } from "@/hooks/useCompanyResponseSettings";
// import { prefetchCompanyRecentReviews } from "@/hooks/useCompanyRecentReviews";

/**
 * Lanza en paralelo todas las queries críticas para calentar el buffer.
 * - Se debe invocar justo tras el login (lo haremos en el siguiente paso).
 * - Si alguna falla, dejamos que React Query gestione el error en la vista correspondiente.
 */
export async function prefetchAllForCompany(client: QueryClient, companyId: string) {
  await Promise.allSettled([
    prefetchCompanySummary(client, companyId),
    prefetchCompanyLocations(client, companyId),
    // prefetchCompanyResponseSettings(client, companyId),
    // prefetchCompanyRecentReviews(client, companyId),
  ]);
}
