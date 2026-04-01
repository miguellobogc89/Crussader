// hooks/slots/useSlots.ts
"use client";

import { useEffect, useState } from "react";
import { useBootstrapData } from "@/app/providers/bootstrap-store";

export type SlotServiceDTO = {
  id: string;
  name: string;
  price: number;
  durationMin: number;
  position: number;
};

export type SlotDTO = {
  id: string;
  employeeId: string | null;
  employeeName: string | null;
  startsAt: string;
  endsAt: string;
  status: string;
  manualPublishRequired: boolean;
  publishedAt: string | null;
  recoveredAt: string | null;
  serviceName: string | null;
  notes: string | null;
  targetCustomerCount: number;
  sentCustomerCount: number;
  repliedCustomerCount: number;
  bookedCustomerCount: number;
  servicesCount: number;
  services: SlotServiceDTO[];

  recoveredServiceId: string | null;
  recoveredServiceName: string | null;
  recoveredSoldAmount: number | null;
  recoveredServiceDurationMin: number | null;
};

type SlotsCacheEntry = {
  slots: SlotDTO[];
  cachedAt: number;
};

const CACHE_TTL_MS = 60_000;
const slotsCache = new Map<string, SlotsCacheEntry>();

function getCacheKey(companyId: string, locationId?: string | null): string {
  return `${companyId}::${locationId ?? "all"}`;
}

function getCachedSlots(cacheKey: string): SlotDTO[] | null {
  const entry = slotsCache.get(cacheKey);

  if (!entry) {
    return null;
  }

  const isExpired = Date.now() - entry.cachedAt > CACHE_TTL_MS;

  if (isExpired) {
    slotsCache.delete(cacheKey);
    return null;
  }

  return entry.slots;
}

function setCachedSlots(cacheKey: string, slots: SlotDTO[]): void {
  slotsCache.set(cacheKey, {
    slots,
    cachedAt: Date.now(),
  });
}

export function useSlots(locationId?: string | null, refreshKey?: number) {
  const boot = useBootstrapData();

  const [slots, setSlots] = useState<SlotDTO[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const rawCompanyId = boot?.activeCompanyResolved?.id;

    if (typeof rawCompanyId !== "string" || rawCompanyId.length === 0) {
      return;
    }

    const companyId: string = rawCompanyId;
    const cacheKey = getCacheKey(companyId, locationId);
    const cachedSlots = getCachedSlots(cacheKey);

    if (cachedSlots) {
      setSlots(cachedSlots);
      setLoading(false);
    } else {
      setLoading(true);
    }

    const controller = new AbortController();

    async function fetchSlots() {
      try {
        const params = new URLSearchParams();
        params.set("companyId", companyId);

        if (typeof locationId === "string" && locationId.length > 0) {
          params.set("locationId", locationId);
        }

        const res = await fetch(`/api/slots/list?${params.toString()}`, {
          signal: controller.signal,
          cache: "no-store",
        });

        const json = await res.json();

        if (json.ok && Array.isArray(json.slots)) {
          console.log("slots_list_response", json.slots);
          setSlots(json.slots);
          setCachedSlots(cacheKey, json.slots);
        }
      } catch (e) {
        if ((e as Error).name !== "AbortError") {
          console.error("slots_fetch_error", e);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchSlots();

    return () => controller.abort();
  }, [boot?.activeCompanyResolved?.id, locationId, refreshKey]);

  return { slots, loading };
}