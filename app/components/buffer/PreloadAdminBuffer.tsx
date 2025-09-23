// app/components/buffer/PreloadAdminBuffer.tsx
"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { prefetchAdminLocations } from "@/hooks/useAdminLocations";
import { prefetchAdminCompanies } from "@/hooks/useAdminCompanies";
import { prefetchAdminUsers } from "@/hooks/useAdminUsers";

type Props = {
  // filtros/paginación actuales (del querystring)
  lq?: string; lpage?: number;
  cq?: string; cpage?: number;
  uq?: string; upage?: number;
};

/** Precarga en paralelo los 3 tabs del /admin */
export default function PreloadAdminBuffer({
  lq = "", lpage = 1,
  cq = "", cpage = 1,
  uq = "", upage = 1,
}: Props) {
  const client = useQueryClient();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await Promise.allSettled([
          prefetchAdminLocations(client, lq ?? "", Number(lpage) || 1, 10),
          prefetchAdminCompanies(client, cq ?? "", Number(cpage) || 1, 10),
          prefetchAdminUsers(client, uq ?? "", Number(upage) || 1, 10),
        ]);
      } catch { /* noop */ }
    })();
    return () => { cancelled = true; };
  }, [client, lq, lpage, cq, cpage, uq, upage]);

  return null;
}
