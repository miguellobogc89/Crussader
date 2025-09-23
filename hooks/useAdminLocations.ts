"use client";

import { useQuery, QueryClient } from "@tanstack/react-query";

export type AdminLocation = {
  id: string;
  title: string | null;
  address: string | null;
  city: string | null;
  postalCode: string | null;
  type?: { name: string | null } | null;
  activity?: { name: string | null } | null;
  status: string | null;
  createdAt: string;
  lastSyncAt: string | null;
  googlePlaceId: string | null;
  reviewsAvg: number | null;
  reviewsCount: number | null;
  company?: { id: string; name: string | null } | null;
  ExternalConnection?: { id: string } | null;
};

export type AdminLocationsResponse = {
  ok: true;
  total: number;
  pages: number;
  page: number;
  take: number;
  locations: AdminLocation[];
};

const qk = {
  adminLocations: (lq: string, lpage: number, take: number) =>
    ["admin", "locations", { lq, lpage, take }] as const,
};

async function fetchAdminLocations(
  lq: string,
  lpage: number,
  take: number
): Promise<AdminLocationsResponse> {
  const usp = new URLSearchParams({
    lq,
    lpage: String(lpage || 1),
    take: String(take || 10),
  });

  const res = await fetch(`/api/admin/locations?${usp.toString()}`, {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  if (!res.ok) throw new Error(`GET /api/admin/locations → HTTP ${res.status}`);

  const json = await res.json();
  if (!json?.ok) throw new Error(json?.error || "fetch_error");

  return json as AdminLocationsResponse;
}

export function useAdminLocations(lq: string, lpage: number, take: number) {
  const q = lq ?? "";
  const p = Math.max(1, Number.isFinite(lpage) ? lpage : 1);
  const t = Math.max(1, Number.isFinite(take) ? take : 10);

  return useQuery({
    queryKey: qk.adminLocations(q, p, t),
    queryFn: () => fetchAdminLocations(q, p, t),
  });
}

export async function prefetchAdminLocations(
  client: QueryClient,
  lq: string,
  lpage: number,
  take: number
) {
  const q = lq ?? "";
  const p = Math.max(1, Number.isFinite(lpage) ? lpage : 1);
  const t = Math.max(1, Number.isFinite(take) ? take : 10);

  await client.prefetchQuery({
    queryKey: qk.adminLocations(q, p, t),
    queryFn: () => fetchAdminLocations(q, p, t),
  });
}
