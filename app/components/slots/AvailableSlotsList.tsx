// app/components/slots/AvailableSlotsList.tsx

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Clock3, RefreshCw, TrendingUp, ChevronRight } from "lucide-react";
import StandardCard from "@/app/components/crussader/UX/standardCard";
import { useSlots } from "@/hooks/slots/useSlots";
import type { SlotItem, SelectedServiceItem } from "./slots.types";
import { SlotsListCardItem } from "./SlotsCardItem/SlotsListCardItem";
import { getPendingPublishCount } from "./helpers/AvailableSlotsListHelpers";
import {
  formatEuro,
  getSlotPriceRange,
} from "./helpers/slotsWeeklyCalendarItemHelpers";

type AvailableSlotsListProps = {
  locationId?: string | null;
  refreshKey?: number;
  onSlotClick?: (
    day: string,
    slot: SlotItem,
    services: SelectedServiceItem[],
  ) => void;
};

function getLocalDayKey(value: string): string {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getGroupLabel(groupKey: string): string {
  if (groupKey === "recovered") {
    return "Recuperados";
  }

  if (groupKey === "expired") {
    return "Vencido";
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
const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>(
  {}
);

const scrollRef = useRef<HTMLDivElement | null>(null);
const [showTopFade, setShowTopFade] = useState(false);
const [showBottomFade, setShowBottomFade] = useState(false);


  const combinedRefreshKey = (refreshKey ?? 0) + manualRefreshKey;

  const { slots, loading } = useSlots(locationId, combinedRefreshKey);

  const pendingPublishCount = useMemo(() => {
    return getPendingPublishCount(slots);
  }, [slots]);

  const recoveredAmount = useMemo(() => {
    return slots.reduce((total, slot) => {
      const isRecovered =
        Boolean(slot.recoveredAt) || slot.status === "recovered";

      if (!isRecovered) {
        return total;
      }

      const priceRange = getSlotPriceRange(slot);

      if (!priceRange) {
        return total;
      }

      return total + priceRange.max;
    }, 0);
  }, [slots]);

const pendingAmount = useMemo(() => {
  const now = Date.now();

  return slots.reduce((total, slot) => {
    const slotStartMs = new Date(slot.startsAt).getTime();
    const isRecovered =
      Boolean(slot.recoveredAt) || slot.status === "recovered";
    const isExpiredByStatus =
      slot.status === "expired" || slot.status === "cancelled";
    const isPast = slotStartMs < now && !isRecovered;

    if (isRecovered || isExpiredByStatus || isPast) {
      return total;
    }

    const priceRange = getSlotPriceRange(slot);

    if (!priceRange) {
      return total;
    }

    return total + priceRange.max;
  }, 0);
}, [slots]);

  const groupedSlots = useMemo(() => {
    const dayGroups: Record<string, typeof slots> = {};
    const recoveredSlots: typeof slots = [];
    const expiredSlots: typeof slots = [];
    const now = Date.now();

    for (const slot of slots) {
      const slotStartMs = new Date(slot.startsAt).getTime();
      const isRecovered =
        Boolean(slot.recoveredAt) || slot.status === "recovered";
      const isExpiredByStatus =
        slot.status === "expired" || slot.status === "cancelled";
      const isPast = slotStartMs < now && !isRecovered;

      if (isRecovered) {
        recoveredSlots.push(slot);
        continue;
      }

      if (isExpiredByStatus || isPast) {
        expiredSlots.push(slot);
        continue;
      }

      const dayKey = getLocalDayKey(slot.startsAt);

      if (!dayGroups[dayKey]) {
        dayGroups[dayKey] = [];
      }

      dayGroups[dayKey].push(slot);
    }

    const orderedDayGroups = Object.entries(dayGroups)
      .map(([dayKey, groupSlots]) => {
        const sorted = [...groupSlots].sort((a, b) => {
          return (
            new Date(a.startsAt).getTime() -
            new Date(b.startsAt).getTime()
          );
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
          return (
            new Date(a.startsAt).getTime() -
            new Date(b.startsAt).getTime()
          );
        }),
      ]);
    }

    if (expiredSlots.length > 0) {
      trailingGroups.push([
        "expired",
        [...expiredSlots].sort((a, b) => {
          return (
            new Date(a.startsAt).getTime() -
            new Date(b.startsAt).getTime()
          );
        }),
      ]);
    }

    return [...orderedDayGroups, ...trailingGroups];
  }, [slots]);

  useEffect(() => {
    setCollapsedGroups((current) => {
      const next = { ...current };

      for (const [groupKey] of groupedSlots) {
        if (next[groupKey] === undefined) {
          next[groupKey] = false;
        }
      }

      return next;
    });
  }, [groupedSlots]);

  useEffect(() => {
  const element = scrollRef.current;

  if (!element) {
    return;
  }

  const updateFades = () => {
    const { scrollTop, clientHeight, scrollHeight } = element;
    setShowTopFade(scrollTop > 4);
    setShowBottomFade(scrollTop + clientHeight < scrollHeight - 4);
  };

  updateFades();
  element.addEventListener("scroll", updateFades);

  return () => {
    element.removeEventListener("scroll", updateFades);
  };
}, [groupedSlots, loading, slots.length]);

  function handleRefresh() {
    setManualRefreshKey((value) => value + 1);
  }

  function toggleGroup(groupKey: string) {
  setCollapsedGroups((current) => ({
    ...current,
    [groupKey]: !current[groupKey],
  }));
}



  return (
    <StandardCard className="overflow-hidden rounded-2xl border border-border/60 bg-white p-0 shadow-sm">
      <div className="flex h-full min-h-0 flex-col overflow-hidden p-6">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[15px] font-semibold text-[#111827]">
              Huecos creados
            </h2>
            <p className="mt-1 text-[13px] text-[#64748B]">
              Gestiona los huecos y servicios ofertados.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-1.5 rounded-xl border border-[#10b965] px-3 py-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-[#10B981]" />
              <span className="text-sm font-bold tabular-nums text-[#10B981]">
                {formatEuro(recoveredAmount)}
              </span>
              <span className="text-sm text-[#10B981]">recup.</span>
            </div>

            <div className="inline-flex items-center gap-1.5 rounded-xl border border-[#FCD9BD] bg-[#FFFBF5] px-3 py-1.5">
              <Clock3 className="h-3.5 w-3.5 text-[#D97706]" />
              <span className="text-sm font-bold tabular-nums text-[#D97706]">
                {pendingPublishCount}
              </span>
              <span className="text-sm text-[#F59E0B]">pend.</span>
            </div>

            <div className="inline-flex items-center gap-1.5 rounded-xl border border-[#DBEAFE] bg-[#EFF6FF] px-3 py-1.5">
              <span className="text-sm font-bold tabular-nums text-[#2563EB]">
                {formatEuro(pendingAmount)}
              </span>
              <span className="text-sm text-[#2563EB]">pend.</span>
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
            </button>
          </div>
        </div>

<div className="relative h-[540px] overflow-hidden">
  <div
    ref={scrollRef}
    className="h-full space-y-6 overflow-y-auto pr-1"
  >
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
        const label = getGroupLabel(groupKey);
        const isToday = label === "Hoy";
        const isExpired = groupKey === "expired";
        const isRecovered = groupKey === "recovered";
        const isCollapsed = collapsedGroups[groupKey] === true;

        return (
          <div key={groupKey} className="space-y-3">
            <button
              type="button"
              onClick={() => toggleGroup(groupKey)}
              className="flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left transition hover:bg-[#F8FAFC]"
            >
              <ChevronRight
                className={[
                  "h-4 w-4 shrink-0 transition-transform duration-200",
                  isCollapsed
                    ? "rotate-0 text-[#94A3B8]"
                    : "rotate-90 text-[#64748B]",
                ].join(" ")}
              />

              <div
                className={[
                  "text-sm font-semibold",
                  isToday
                    ? "text-[#2563EB]"
                    : isExpired
                    ? "text-gray-400"
                    : isRecovered
                    ? "text-[#10B981]"
                    : "text-gray-700",
                ].join(" ")}
              >
                {label}
              </div>

              <div className="inline-flex min-w-[24px] items-center justify-center rounded-full bg-[#F8FAFC] px-2 py-0.5 text-[11px] font-semibold text-[#64748B]">
                {groupItems.length}
              </div>

              <div className="h-px flex-1 bg-border/60" />
            </button>

            {!isCollapsed && (
              <div className="space-y-3 px-6">
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
            )}
          </div>
        );
      })}
  </div>

  {showTopFade ? (
    <div className="pointer-events-none absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-white to-transparent" />
  ) : null}

  {showBottomFade ? (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white to-transparent" />
  ) : null}
</div>
      </div>
    </StandardCard>
  );
}