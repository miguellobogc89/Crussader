// hooks/useAdminUsers.ts
"use client";

import { useQuery, type QueryClient } from "@tanstack/react-query";

export type AdminUser = {
  id: string; name: string | null; email: string | null; image: string | null;
  role: string | null; isActive: boolean | null; isSuspended: boolean | null;
  lastLoginAt: string | null; lastSeenAt: string | null;
  loginCount: number; failedLoginCount: number; createdAt: string;
};

export const USER_PAGE_SIZES = [10, 20, 50] as const;

type UsersResponse = {
  ok: boolean;
  total: number;
  users: AdminUser[];
  page: number;
  pages: number;
  pageSize: number; // ← del API
};

async function fetchUsers(uq: string, upage: number, pageSize: number): Promise<UsersResponse> {
  const params = new URLSearchParams();
  if (uq) params.set("uq", uq);
  params.set("upage", String(upage || 1));
  params.set("take", String(pageSize));
  const r = await fetch(`/api/admin/users?${params.toString()}`, { cache: "no-store" });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

export function useAdminUsers(uq: string, upage: number, pageSize: number = 10) {
  const q = uq ?? "";
  const p = Math.max(1, Number.isFinite(upage) ? upage : 1);
  const size = USER_PAGE_SIZES.includes(pageSize as any) ? pageSize : 10;
  return useQuery<UsersResponse>({
    queryKey: ["admin", "users", q, p, size],
    queryFn: () => fetchUsers(q, p, size),
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  });
}

export async function prefetchAdminUsers(client: QueryClient, uq: string, upage: number, pageSize = 10) {
  const q = uq ?? "";
  const p = Math.max(1, Number.isFinite(upage) ? upage : 1);
  const size = USER_PAGE_SIZES.includes(pageSize as any) ? pageSize : 10;
  await client.prefetchQuery({
    queryKey: ["admin", "users", q, p, size],
    queryFn: () => fetchUsers(q, p, size),
  });
}
