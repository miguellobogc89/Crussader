"use client";

import { useEffect, useState, useCallback } from "react";

export type BillingStatus = {
  ok: boolean;
  active: boolean;
  plan: string | null;
  subscription_id?: string;
  locations_allowed: number;
  locations_in_use: number;
};

export function useBillingStatus() {
  const [data, setData] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/billing/status", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as BillingStatus;
      setData(json);
    } catch (err: any) {
      setError(err.message ?? "Error al cargar estado de suscripción");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  return {
    data,
    loading,
    error,
    refetch: fetchStatus,
    canConnect:
      !!data?.active &&
      typeof data.locations_allowed === "number" &&
      data.locations_in_use < data.locations_allowed,
  };
}
