"use client";

import { useEffect, useState } from "react";

export type CompanyKpis = {
  companyId: string | null;
  snapshotDate: string | null;
  totals: {
    totalReviews: number;
    newReviews7d: number;
    newReviews30d: number;
    unansweredCount: number;
    responses7d: number;
  };
  rates: {
    answeredRate: number;
    avgAll: number | null;
    avg30d: number | null;
    prev30dAvg: number | null;
    responseAvgSec: number | null;
  };
  locations: number;
};

export function useCompanyKpis() {
  const [data, setData] = useState<CompanyKpis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch("/api/kpis/company-today", { cache: "no-store" });
        const json = await res.json();
        if (!cancelled) {
          if (json?.ok) setData(json.data as CompanyKpis);
          else setError(json?.error ?? "kpis_error");
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "kpis_fetch_failed");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  return { data, loading, error };
}
