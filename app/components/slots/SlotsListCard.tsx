// app/components/slots/SlotsWeeklyCalendarCard.tsx

"use client";

import { useMemo } from "react";
import { BellDot, Loader2 } from "lucide-react";
import StandardCard from "@/app/components/crussader/UX/standardCard";
import { useSlots } from "@/hooks/slots/useSlots";
import type { SlotItem, SelectedServiceItem } from "./slots.types";
import { SlotsWeeklyCalendarItem } from "./SlotsWeeklyCalendarItem";
import type { SlotDTO } from "@/hooks/slots/useSlots";
import { getPendingPublishCount } from "./helpers/slotsCalendarHelpers";

type SlotsWeeklyCalendarCardProps = {
  locationId?: string | null;
  onSlotClick?: (
    day: string,
    slot: SlotItem,
    services: SelectedServiceItem[],
  ) => void;
};

function getSlotGroupKey(slot: SlotDTO): string {
  if (slot.recoveredAt) {
    return "recovered";
  }

  if (slot.status === "pending_publish") {
    return "pending";
  }

  if (slot.status === "sent") {
    return "sent";
  }

  if (slot.status === "expired" || slot.status === "cancelled") {
    return "lost";
  }

  return "sent";
}

function getGroupLabel(groupKey: string): string {
  if (groupKey === "pending") {
    return "Pendientes de publicar";
  }

  if (groupKey === "sent") {
    return "Enviados";
  }

  if (groupKey === "recovered") {
    return "Recuperados";
  }

  if (groupKey === "lost") {
    return "Perdidos";
  }

  return "Otros";
}

function getGroupOrder(groupKey: string): number {
  if (groupKey === "pending") {
    return 0;
  }

  if (groupKey === "sent") {
    return 1;
  }

  if (groupKey === "recovered") {
    return 2;
  }

  if (groupKey === "lost") {
    return 3;
  }

  return 99;
}

export function SlotsListCard({
  locationId,
  onSlotClick,
}: SlotsWeeklyCalendarCardProps) {
  const { slots, loading } = useSlots(locationId);

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

  return (
    <StandardCard className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex items-center gap-2 rounded-md bg-[#f9fafb] px-3 py-1.5">
          <BellDot className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-600">
            {pendingPublishCount} pendientes
          </span>
        </div>
      </div>

      <div className="max-h-[560px] space-y-6 overflow-y-auto pr-1">
        {loading && (
          <div className="flex items-center gap-2 rounded-2xl border border-[#ece9f3] bg-white px-4 py-4 text-sm text-[#7b7890]">
            <Loader2 className="h-4 w-4 animate-spin" />
            Cargando cancelaciones...
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