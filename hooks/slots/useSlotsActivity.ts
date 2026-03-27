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
      return;
    }

    let isMounted = true;

const fetchActivity = () => {
  if (!hasLoadedOnce) {
    setLoading(true);
  }

  setError(null);

  fetch(`/api/slots/activity?locationId=${locationId}`)
    .then((res) => res.json())
    .then((data) => {
      if (!isMounted) return;

      if (data.ok) {
        setItems(data.items);
        setHasLoadedOnce(true);
      } else {
        setError("Error cargando actividad");
      }
    })
    .catch(() => {
      if (!isMounted) return;
      setError("Error de red");
    })
    .finally(() => {
      if (!isMounted) return;
      setLoading(false);
    });
};

    fetchActivity();

    const interval = setInterval(fetchActivity, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [locationId]);

  return {
    items,
  loading,
  error,
  };
}