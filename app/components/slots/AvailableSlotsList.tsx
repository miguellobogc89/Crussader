// app/components/slots/AvailableSlotsList.tsx

"use client";

import { useMemo, useState } from "react";
import { BellDot, Loader2, RefreshCw } from "lucide-react";
import StandardCard from "@/app/components/crussader/UX/standardCard";
import { useSlots } from "@/hooks/slots/useSlots";
import type { SlotItem, SelectedServiceItem } from "./slots.types";
import { SlotsListCardItem } from "./SlotsListCardItem";
import type { SlotDTO } from "@/hooks/slots/useSlots";
import { getPendingPublishCount } from "./helpers/AvailableSlotsListHelpers";

type AvailableSlotsListProps = {
  locationId?: string | null;
  refreshKey?: number;
  onSlotClick?: (
    day: string,
    slot: SlotItem,
    services: SelectedServiceItem[],
  ) => void;
};

function getSlotGroupKey(slot: SlotDTO): string {
  if (slot.recoveredAt) return "recovered";
  if (slot.status === "pending_publish") return "pending";
  if (slot.status === "sent") return "sent";
  if (slot.status === "expired" || slot.status === "cancelled")
    return "lost";
  return "sent";
}

function getGroupLabel(groupKey: string): string {
  if (groupKey === "recovered") {
    return "Recuperados";
  }

  if (groupKey === "lost") {
    return "Perdidos";
  }

  const groupDate = new Date(`${groupKey}T00:00:00`);
  const today = new Date();
  const tomorrow = new Date();

  today.setHours(0, 0, 0, 0);
  tomorrow.setHours(0, 0, 0, 0);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (groupDate.getTime() === today.getTime()) {
    return "Hoy";
  }

  if (groupDate.getTime() === tomorrow.getTime()) {
    return "Mañana";
  }

  return new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
  }).format(groupDate);
}

function getGroupOrder(groupKey: string): number {
  if (groupKey === "pending") return 0;
  if (groupKey === "sent") return 1;
  if (groupKey === "recovered") return 2;
  if (groupKey === "lost") return 3;
  return 99;
}

function SlotSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-[#ece9f3] bg-white p-4">
      <div className="mb-3 h-4 w-1/3 rounded bg-[#e5e7eb]" />
      <div className="mb-2 h-3 w-2/3 rounded bg-[#e5e7eb]" />
      <div className="h-3 w-1/2 rounded bg-[#e5e7eb]" />
    </div>
  );
}

export function SlotsListCard({
  locationId,
  refreshKey,
  onSlotClick,
}: AvailableSlotsListProps) {
  const [manualRefreshKey, setManualRefreshKey] = useState(0);
  const combinedRefreshKey = (refreshKey ?? 0) + manualRefreshKey;

  const { slots, loading } = useSlots(locationId, combinedRefreshKey);

  const pendingPublishCount = useMemo(() => {
    return getPendingPublishCount(slots);
  }, [slots]);

const groupedSlots = useMemo(() => {
  const dayGroups: Record<string, typeof slots> = {};
  const recoveredSlots: typeof slots = [];
  const lostSlots: typeof slots = [];

  for (const slot of slots) {
    const isLost = slot.status === "expired" || slot.status === "cancelled";
    const isRecovered = Boolean(slot.recoveredAt) || slot.status === "recovered";

    if (isRecovered) {
      recoveredSlots.push(slot);
      continue;
    }

    if (isLost) {
      lostSlots.push(slot);
      continue;
    }

    const dayKey = new Date(slot.startsAt).toISOString().slice(0, 10);

    if (!dayGroups[dayKey]) {
      dayGroups[dayKey] = [];
    }

    dayGroups[dayKey].push(slot);
  }

  const orderedDayGroups = Object.entries(dayGroups)
    .map(([dayKey, groupSlots]) => {
      const sorted = [...groupSlots].sort((a, b) => {
        return new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime();
      });

      return [dayKey, sorted] as const;
    })
    .sort((a, b) => {
      return new Date(a[0]).getTime() - new Date(b[0]).getTime();
    });

  const trailingGroups: Array<readonly [string, typeof slots]> = [];

  if (recoveredSlots.length > 0) {
    trailingGroups.push([
      "recovered",
      [...recoveredSlots].sort((a, b) => {
        return new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime();
      }),
    ]);
  }

  if (lostSlots.length > 0) {
    trailingGroups.push([
      "lost",
      [...lostSlots].sort((a, b) => {
        return new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime();
      }),
    ]);
  }

  return [...orderedDayGroups, ...trailingGroups];
}, [slots]);

  function handleRefresh() {
    setManualRefreshKey((value) => value + 1);
  }

  return (
    <StandardCard className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex items-center gap-2 rounded-md bg-[#f9fafb] px-3 py-1.5">
          <BellDot className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-600">
            {pendingPublishCount} pendientes
          </span>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-[#f9fafb] disabled:opacity-60"
        >
          <RefreshCw
            className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
          />
          Actualizar
        </button>
      </div>

      <div className="max-h-[560px] space-y-6 overflow-y-auto pr-1">
        {loading && (
          <div className="space-y-3">
            <SlotSkeleton />
            <SlotSkeleton />
            <SlotSkeleton />
            <SlotSkeleton />
          </div>
        )}

        {!loading && slots.length === 0 && (
          <div className="rounded-2xl border border-[#ece9f3] bg-white px-4 py-8 text-sm text-[#7b7890]">
            No hay huecos para esta ubicación.
          </div>
        )}

        {!loading &&
          groupedSlots.map(([groupKey, groupItems]) => {
            return (
              <div key={groupKey} className="space-y-3">
                <div className="px-1 text-sm font-semibold text-gray-700">
                  {getGroupLabel(groupKey)}
                </div>

                <div className="space-y-3">
                  {groupItems.map((slot) => {
                    return (
                      <SlotsListCardItem
                        key={slot.id}
                        slot={slot}
                        onClick={onSlotClick}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
      </div>
    </StandardCard>
  );
}