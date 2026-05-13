// app/components/slots/SlotRecoveryToastListener.tsx
"use client";

import { useEffect, useRef } from "react";
import type { SlotDTO } from "@/hooks/slots/useSlots";
import { useRecoveryToast } from "@/app/components/crussader/UX/RevenueRecoveryToast";
import {
  getEffectiveSlotStatus,
  getRecoveredServiceName,
} from "@/app/components/slots/helpers/slotsWeeklyCalendarItemHelpers";

type SlotRecoveryToastListenerProps = {
  locationId: string | null;
  pollMs?: number;
};

function getTimeLabel(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "--:--";
  }

  return new Intl.DateTimeFormat("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export function SlotRecoveryToastListener({
  locationId,
  pollMs = 10000,
}: SlotRecoveryToastListenerProps) {
  const { showRecoveryToast } = useRecoveryToast();
  const initializedRef = useRef(false);
  const knownRecoveredIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!locationId) {
      return;
    }

    let cancelled = false;

    async function checkRecoveredSlots() {
      try {
        const params = new URLSearchParams();
        const safeLocationId = locationId;

        if (!safeLocationId) {
        return;
        }
        params.set("locationId", safeLocationId);

        const response = await fetch(`/api/slots/list?${params.toString()}`, {
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok || !data?.ok || !Array.isArray(data.slots)) {
          return;
        }

        const recoveredSlots = data.slots.filter((slot: SlotDTO) => {
          return getEffectiveSlotStatus(slot) === "recovered";
        });

        if (!initializedRef.current) {
          knownRecoveredIdsRef.current = new Set(
            recoveredSlots.map((slot: SlotDTO) => slot.id),
          );
          initializedRef.current = true;
          return;
        }

        for (const slot of recoveredSlots as SlotDTO[]) {
          if (knownRecoveredIdsRef.current.has(slot.id)) {
            continue;
          }

          knownRecoveredIdsRef.current.add(slot.id);

          if (cancelled) {
            return;
          }

          showRecoveryToast({
            customerName: slot.recoveredCustomerName || "Un cliente",
            timeLabel: getTimeLabel(slot.startsAt),
            serviceName: getRecoveredServiceName(slot),
          });
        }
      } catch (error) {
        console.error("[SlotRecoveryToastListener]", error);
      }
    }

    void checkRecoveredSlots();

    const interval = window.setInterval(() => {
      void checkRecoveredSlots();
    }, pollMs);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [locationId, pollMs, showRecoveryToast]);

  return null;
}