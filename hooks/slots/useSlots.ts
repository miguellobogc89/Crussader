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
    const controller = new AbortController();

    async function fetchSlots() {
      try {
        setLoading(true);

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

        if (json.ok) {
          setSlots(json.slots);
        }
      } catch (e) {
        if ((e as Error).name !== "AbortError") {
          console.error("slots_fetch_error", e);
        }
      } finally {
        setLoading(false);
      }
    }

    fetchSlots();

    return () => controller.abort();
  }, [boot?.activeCompanyResolved?.id, locationId, refreshKey]);

  return { slots, loading };
}