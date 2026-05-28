"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSlots } from "@/hooks/slots/useSlots";
import type { SlotDTO } from "@/hooks/slots/useSlots";
import type { SelectedServiceItem } from "../slots.types";
import { getPendingPublishCount } from "../helpers/AvailableSlotsListHelpers";
import {
  getEffectiveSlotStatus,
  getSlotPriceRange,
} from "../helpers/slotsWeeklyCalendarItemHelpers";
import { AvailableSlotsListHeader } from "./AvailableSlotsListHeader";
import { AvailableSlotsListGroup } from "./AvailableSlotsListGroup";
import { SlotSkeleton } from "../SlotSkeleton";

type AvailableSlotsListProps = {
  locationId?: string | null;
  refreshKey?: number;
  onSlotClick?: (
    day: string,
    slot: SlotDTO,
    services: SelectedServiceItem[],
  ) => void;
  onHeaderChange?: (header: React.ReactNode) => void;
};

type SlotGroup = readonly [string, SlotDTO[]];

function getLocalDayKey(value: string): string {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function SlotsListCard({
  locationId,
  refreshKey,
  onSlotClick,
  onHeaderChange,
}: AvailableSlotsListProps) {
  const [manualRefreshKey, setManualRefreshKey] = useState(0);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [displaySlots, setDisplaySlots] = useState<SlotDTO[]>([]);
  const [exitingSlotIds, setExitingSlotIds] = useState<Record<string, boolean>>({});
  const [enteringSlotIds, setEnteringSlotIds] = useState<Record<string, boolean>>({});

  const knownSlotIdsRef = useRef<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const [showTopFade, setShowTopFade] = useState(false);
  const [showBottomFade, setShowBottomFade] = useState(false);

  const combinedRefreshKey = (refreshKey ?? 0) + manualRefreshKey;
  const { slots, loading } = useSlots(locationId, combinedRefreshKey);

  useEffect(() => {
    if (!locationId) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setManualRefreshKey((value) => value + 1);
    }, 10000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [locationId]);

  useEffect(() => {
    const nextIds = new Set(slots.map((slot) => slot.id));
    const currentIds = new Set(displaySlots.map((slot) => slot.id));

    const removedIds = [...currentIds].filter((id) => !nextIds.has(id));
    const addedIds = slots
      .filter((slot) => !knownSlotIdsRef.current.has(slot.id))
      .map((slot) => slot.id);

    if (removedIds.length === 0 && addedIds.length === 0) {
      setDisplaySlots(slots);
      knownSlotIdsRef.current = nextIds;
      return;
    }

    if (removedIds.length > 0) {
      setExitingSlotIds((current) => {
        const next = { ...current };

        for (const id of removedIds) {
          next[id] = true;
        }

        return next;
      });
    }

    if (addedIds.length > 0) {
      setEnteringSlotIds((current) => {
        const next = { ...current };

        for (const id of addedIds) {
          next[id] = true;
        }

        return next;
      });

      window.setTimeout(() => {
        setEnteringSlotIds((current) => {
          const next = { ...current };

          for (const id of addedIds) {
            delete next[id];
          }

          return next;
        });
      }, 260);
    }

    setDisplaySlots((current) => {
      const currentById = new Map(current.map((slot) => [slot.id, slot]));
      const merged = [...slots];

      for (const removedId of removedIds) {
        const removedSlot = currentById.get(removedId);

        if (removedSlot) {
          merged.push(removedSlot);
        }
      }

      return merged;
    });

    window.setTimeout(() => {
      setDisplaySlots(slots);

      setExitingSlotIds((current) => {
        const next = { ...current };

        for (const id of removedIds) {
          delete next[id];
        }

        return next;
      });
    }, 260);

    knownSlotIdsRef.current = nextIds;
  }, [slots, displaySlots]);

  const pendingPublishCount = useMemo(() => {
    return getPendingPublishCount(slots);
  }, [slots]);

  const pendingAmount = useMemo(() => {
    const now = Date.now();

    return slots.reduce((total, slot) => {
      const slotStartMs = new Date(slot.startsAt).getTime();
      const isRecovered = slot.status === "recovered";
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

  const groupedSlots = useMemo<SlotGroup[]>(() => {
    const dayGroups: Record<string, SlotDTO[]> = {};
    const recoveredSlots: SlotDTO[] = [];
    const expiredSlots: SlotDTO[] = [];

    for (const slot of displaySlots) {
      const effectiveStatus = getEffectiveSlotStatus(slot);

      if (effectiveStatus === "recovered") {
        recoveredSlots.push(slot);
        continue;
      }

      if (effectiveStatus === "expired") {
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

    const trailingGroups: SlotGroup[] = [];

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
  }, [displaySlots]);

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
  }, [groupedSlots, loading, displaySlots.length]);

  function toggleGroup(groupKey: string) {
    setCollapsedGroups((current) => ({
      ...current,
      [groupKey]: !current[groupKey],
    }));
  }

  const cardHeader = useMemo(() => {
    return (
      <AvailableSlotsListHeader
        pendingPublishCount={pendingPublishCount}
        pendingAmount={pendingAmount}
      />
    );
  }, [pendingPublishCount, pendingAmount]);

  useEffect(() => {
    if (!onHeaderChange) {
      return;
    }

    onHeaderChange(cardHeader);
  }, [onHeaderChange, cardHeader]);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <div
          ref={scrollRef}
          className="h-full space-y-4 overflow-y-auto px-3 py-3 pr-2 xl:space-y-5 xl:px-4 xl:py-4"
        >
          {loading && displaySlots.length === 0 ? (
            <div className="space-y-2.5 xl:space-y-3">
              <SlotSkeleton />
              <SlotSkeleton />
              <SlotSkeleton />
              <SlotSkeleton />
            </div>
          ) : null}

          {!loading && slots.length === 0 && displaySlots.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 px-3 py-6 text-center text-xs text-muted-foreground xl:px-4 xl:py-8 xl:text-sm">
              No hay huecos para esta ubicación.
            </div>
          ) : null}

          {groupedSlots.map(([groupKey, groupItems]) => {
            return (
              <AvailableSlotsListGroup
                key={groupKey}
                groupKey={groupKey}
                groupItems={groupItems}
                isCollapsed={collapsedGroups[groupKey] === true}
                exitingSlotIds={exitingSlotIds}
                enteringSlotIds={enteringSlotIds}
                onToggleGroup={toggleGroup}
                onSlotClick={onSlotClick}
              />
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