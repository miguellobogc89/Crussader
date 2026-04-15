// app/components/slots/AvailableSlotsList.tsx

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Clock3, RefreshCw, TrendingUp, ChevronRight } from "lucide-react";
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
  onHeaderChange?: (header: React.ReactNode) => void;
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
    <div className="animate-pulse rounded-xl border border-border/60 bg-white p-3 xl:p-3.5">
      <div className="mb-2.5 h-3.5 w-1/3 rounded bg-[#e5e7eb]" />
      <div className="mb-2 h-3 w-2/3 rounded bg-[#e5e7eb]" />
      <div className="h-3 w-1/2 rounded bg-[#e5e7eb]" />
    </div>
  );
}

export function SlotsListCard({
  locationId,
  refreshKey,
  onSlotClick,
  onHeaderChange,
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

    if (expiredSlots.length > 0) {
      trailingGroups.push([
        "expired",
        [...expiredSlots].sort((a, b) => {
          return new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime();
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

  const cardHeader = (
  <div className="flex w-full items-start justify-between gap-3 xl2:gap-4">
    <div className="min-w-0 flex-1">
      <h2 className="truncate text-[13px] font-semibold text-foreground xl:text-sm xl2:text-[15px]">
        Huecos creados
      </h2>
      <p className="mt-1 text-[11px] text-muted-foreground xl:text-xs xl2:text-[13px]">
        Gestiona los huecos liberados.
      </p>
    </div>

    <div className="flex shrink-0 items-center gap-1.5 xl:gap-2">
      <div className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 xl:px-2.5 xl:py-1 xl:text-xs">
        <TrendingUp className="h-3 w-3 xl:h-3.5 xl:w-3.5" />
        <span className="font-semibold tabular-nums">
          {formatEuro(recoveredAmount)}
        </span>
      </div>

      <div className="inline-flex items-center gap-1 rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 text-[11px] font-medium text-orange-700 xl:px-2.5 xl:py-1 xl:text-xs">
        <Clock3 className="h-3 w-3 xl:h-3.5 xl:w-3.5" />
        <span className="font-semibold tabular-nums">
          {pendingPublishCount}
        </span>
      </div>

      <div className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700 xl:px-2.5 xl:py-1 xl:text-xs">
        <span className="font-semibold tabular-nums">
          {formatEuro(pendingAmount)}
        </span>
      </div>

      <button
        type="button"
        onClick={handleRefresh}
        disabled={loading}
        className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-white text-slate-600 transition hover:bg-slate-50 disabled:opacity-60 xl:h-8 xl:w-8"
      >
        <RefreshCw
          className={`h-3.5 w-3.5 xl:h-4 xl:w-4 ${loading ? "animate-spin" : ""}`}
        />
      </button>
    </div>
  </div>
);

useEffect(() => {
  if (!onHeaderChange) {
    return;
  }

  onHeaderChange(cardHeader);
}, [
  onHeaderChange,
  recoveredAmount,
  pendingPublishCount,
  pendingAmount,
  loading,
]);

  return (
      <div className="flex h-full min-h-0 flex-col overflow-hidden">
        <div className="relative min-h-0 flex-1 overflow-hidden">
          <div
            ref={scrollRef}
            className="h-full space-y-4 overflow-y-auto px-3 py-3 pr-2 xl:px-4 xl:py-4 xl:space-y-5"
          >
            {loading && (
              <div className="space-y-2.5 xl:space-y-3">
                <SlotSkeleton />
                <SlotSkeleton />
                <SlotSkeleton />
                <SlotSkeleton />
              </div>
            )}

            {!loading && slots.length === 0 && (
              <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 px-3 py-6 text-center text-xs text-muted-foreground xl:px-4 xl:py-8 xl:text-sm">
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
                  <div key={groupKey} className="space-y-2.5 xl:space-y-3">
                    <button
                      type="button"
                      onClick={() => toggleGroup(groupKey)}
                      className="flex w-full items-center gap-2 rounded-lg px-1.5 py-1 text-left transition hover:bg-slate-50"
                    >
                      <ChevronRight
                        className={[
                          "h-3.5 w-3.5 shrink-0 transition-transform duration-200 xl:h-4 xl:w-4",
                          isCollapsed
                            ? "rotate-0 text-slate-400"
                            : "rotate-90 text-slate-500",
                        ].join(" ")}
                      />

                      <div
                        className={[
                          "text-[12px] font-semibold xl:text-[13px]",
                          isToday
                            ? "text-blue-600"
                            : isExpired
                            ? "text-slate-400"
                            : isRecovered
                            ? "text-emerald-600"
                            : "text-slate-700",
                        ].join(" ")}
                      >
                        {label}
                      </div>

                      <div className="inline-flex min-w-[22px] items-center justify-center rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 xl:min-w-[24px] xl:text-[11px]">
                        {groupItems.length}
                      </div>

                      <div className="h-px flex-1 bg-border/60" />
                    </button>

                    {!isCollapsed && (
                      <div className="space-y-2.5 pl-5 xl:space-y-3 xl:pl-6">
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
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white to-transparent" />
          ) : null}
        </div>
      </div>
  );
}