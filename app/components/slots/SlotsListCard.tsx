// app/components/slots/SlotsListCard.tsx

"use client";

import { useMemo, useState } from "react";
import { BellDot, Loader2, RefreshCw } from "lucide-react";
import StandardCard from "@/app/components/crussader/UX/standardCard";
import { useSlots } from "@/hooks/slots/useSlots";
import type { SlotItem, SelectedServiceItem } from "./slots.types";
import { SlotsWeeklyCalendarItem } from "./SlotsWeeklyCalendarItem";
import type { SlotDTO } from "@/hooks/slots/useSlots";
import { getPendingPublishCount } from "./helpers/slotsCalendarHelpers";

type SlotsWeeklyCalendarCardProps = {
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
  if (groupKey === "pending") return "Pendientes de publicar";
  if (groupKey === "sent") return "Enviados";
  if (groupKey === "recovered") return "Recuperados";
  if (groupKey === "lost") return "Perdidos";
  return "Otros";
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
}: SlotsWeeklyCalendarCardProps) {
  const [manualRefreshKey, setManualRefreshKey] = useState(0);
  const combinedRefreshKey = (refreshKey ?? 0) + manualRefreshKey;

  const { slots, loading } = useSlots(locationId, combinedRefreshKey);

  const pendingPublishCount = useMemo(() => {
    return getPendingPublishCount(slots);
  }, [slots]);

  const groupedSlots = useMemo(() => {
    const groups: Record<string, typeof slots> = {};

    for (const slot of slots) {
      const groupKey = getSlotGroupKey(slot);

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }

      groups[groupKey].push(slot);
    }

    return Object.entries(groups)
      .map(([groupKey, groupSlots]) => {
        const sorted = [...groupSlots].sort((a, b) => {
          return new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime();
        });

        return [groupKey, sorted] as const;
      })
      .sort((a, b) => {
        return getGroupOrder(a[0]) - getGroupOrder(b[0]);
      });
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
                      <SlotsWeeklyCalendarItem
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