"use client";

import { useState } from "react";

export type LocationRow = {
  id: string;
  title: string;
  address?: string | null;
  city?: string | null;
  postalCode?: string | null;
  reviewsCount?: number | null;
  reviewsAvg?: number | null;
  googlePlaceId?: string | null;
};

export function useCompanyLocations(companyId: string) {
  const [locations, setLocations] = useState<LocationRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadLocations() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/companies/${companyId}/locations`, { cache: "no-store" });
      const data = await res.json();
      if (res.ok && data.ok) setLocations(data.locations ?? []);
      else setError(data?.error ?? "fetch_error");
    } catch {
      setError("network_error");
    } finally {
      setLoading(false);
    }
  }

  return { locations, loading, error, loadLocations, setLocations };
}
