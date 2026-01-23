// lib/reviews/useReviewsSummaryData.ts
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  fetchReviewsByLocation,
  type ReviewForCard,
} from "./reviewsClient";

export function useReviewsSummaryData() {
  const [locationId, setLocationId] = useState<string | null>(null);
  const [reviews, setReviews] = useState<ReviewForCard[]>([]);
  const [loading, setLoading] = useState(false);

  const abortRef = useRef<AbortController | null>(null);

  const load = useCallback(
    async (locId: string) => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;

      setLoading(true);
      try {
        const next = await fetchReviewsByLocation(locId, ctrl.signal);
        setReviews(next);
      } catch {
        if (!ctrl.signal.aborted) setReviews([]);
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (!locationId) return;
    load(locationId);

    return () => {
      abortRef.current?.abort();
    };
  }, [locationId, load]);

  const reload = useCallback(() => {
    if (locationId) {
      load(locationId);
    }
  }, [locationId, load]);

  return {
    reviews,
    loading,
    locationId,
    setLocationId,
    reload,
  };
}
