"use client";

import { useQuery, type QueryClient } from "@tanstack/react-query";

export type CompanyRow = {
  id: string;
  name: string;
  createdAt: string;
  _count: {
    UserCompany: number;
    Location: number;
    Reviews: number;
  };
};

type CompaniesResponse = {
  ok: boolean;
  total: number;
  companies: CompanyRow[];
  page: number;
  pages: number;
  take?: number;
};

const qk = {
  adminCompanies: (cq: string, cpage: number, take: number) =>
    ["admin", "companies", { cq, cpage, take }] as const,
};

async function fetchCompanies(cq: string, cpage: number, take: number): Promise<CompaniesResponse> {
  const usp = new URLSearchParams({
    cq,
    cpage: String(cpage || 1),
    take: String(take || 10),
  });

  const res = await fetch(`/api/admin/companies?${usp.toString()}`, {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  if (!res.ok) throw new Error(`GET /api/admin/companies → HTTP ${res.status}`);
  const json = await res.json();
  if (!json?.ok) throw new Error(json?.error || "fetch_error");
  return json as CompaniesResponse;
}

export function useAdminCompanies(cq: string, cpage: number, take: number) {
  const q = cq ?? "";
  const p = Math.max(1, Number.isFinite(cpage) ? cpage : 1);
  const t = Math.max(1, Number.isFinite(take) ? take : 10);

  return useQuery({
    queryKey: qk.adminCompanies(q, p, t),
    queryFn: () => fetchCompanies(q, p, t),
    staleTime: 30_000,
  });
}

export async function prefetchAdminCompanies(
  client: QueryClient,
  cq: string,
  cpage: number,
  take: number
) {
  const q = cq ?? "";
  const p = Math.max(1, Number.isFinite(cpage) ? cpage : 1);
  const t = Math.max(1, Number.isFinite(take) ? take : 10);

  await client.prefetchQuery({
    queryKey: qk.adminCompanies(q, p, t),
    queryFn: () => fetchCompanies(q, p, t),
  });
}
