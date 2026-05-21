// hooks/slots/useSlotsActivity.ts
"use client";

import { useEffect, useState } from "react";
import type { ActivityItem } from "@/app/components/slots/helpers/slotsActivityFeedHelpers";

export function useSlotsActivity(locationId?: string | null) {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  useEffect(() => {
    if (!locationId) {
      setItems([]);
      setLoading(false);
      setError(null);
      setHasLoadedOnce(false);
      return;
    }

    let isMounted = true;

    const fetchActivity = async (showLoader: boolean) => {
      if (showLoader) {
        setLoading(true);
      }

      setError(null);

      try {
        const res = await fetch(
          `/api/slots/activity?locationId=${encodeURIComponent(locationId)}`,
          { cache: "no-store" }
        );

        const data = await res.json();

        if (!isMounted) {
          return;
        }

        if (data?.ok && Array.isArray(data.items)) {
          setItems(data.items);
          setHasLoadedOnce(true);
          return;
        }

        setError("Error cargando actividad");
      } catch {
        if (!isMounted) {
          return;
        }

        setError("Error de red");
      } finally {
        if (!isMounted) {
          return;
        }

        setLoading(false);
      }
    };

    void fetchActivity(!hasLoadedOnce);

    const interval = setInterval(() => {
      void fetchActivity(false);
    }, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [locationId, hasLoadedOnce]);

  return {
    items,
    loading,
    error,
  };
}