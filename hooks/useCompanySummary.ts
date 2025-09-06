"use client";

import { useEffect, useState } from "react";

type Metrics = {
  totalEstablishments: number;
  totalReviews: number;
  averageRating: number;
  last30Reviews: number;
  prev30Reviews: number;
  monthlyGrowthPct: number;
};

export function useCompanySummary(companyId: string | null) {
  const [data, setData] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState<boolean>(!!companyId);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!companyId) return;
    let abort = false;
    setLoading(true);
    fetch(`/api/companies/${companyId}/summary`)
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const j = await r.json();
        if (abort) return;
        setData(j?.metrics ?? null);
        setError(null);
      })
      .catch((e) => !abort && setError(String(e?.message || e)))
      .finally(() => !abort && setLoading(false));
    return () => {
      abort = true;
    };
  }, [companyId]);

  return { data, loading, error };
}
