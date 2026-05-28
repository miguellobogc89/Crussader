// app/components/slots/AvailableSlotsListGroup.tsx
"use client";

import { ChevronRight } from "lucide-react";
import type { SlotDTO } from "@/hooks/slots/useSlots";
import type { SelectedServiceItem } from "../slots.types";
import { AnimatedSlotListItem } from "./AnimatedSlotListItem";

type Props = {
  groupKey: string;
  groupItems: SlotDTO[];
  isCollapsed: boolean;
  exitingSlotIds: Record<string, boolean>;
  enteringSlotIds: Record<string, boolean>;
  onToggleGroup: (groupKey: string) => void;
  onSlotClick?: (
    day: string,
    slot: SlotDTO,
    services: SelectedServiceItem[],
  ) => void;
};

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

export function AvailableSlotsListGroup({
  groupKey,
  groupItems,
  isCollapsed,
  exitingSlotIds,
  enteringSlotIds,
  onToggleGroup,
  onSlotClick,
}: Props) {
  const label = getGroupLabel(groupKey);
  const isToday = label === "Hoy";
  const isExpired = groupKey === "expired";
  const isRecovered = groupKey === "recovered";

  return (
    <div className="space-y-2.5 xl:space-y-3">
      <button
        type="button"
        onClick={() => onToggleGroup(groupKey)}
        className="flex w-full items-center gap-2 rounded-lg px-1.5 py-1 text-left transition hover:bg-slate-50"
      >
        <ChevronRight
          className={[
            "h-3.5 w-3.5 shrink-0 transition-transform duration-200 xl:h-4 xl:w-4",
            isCollapsed ? "rotate-0 text-slate-400" : "rotate-90 text-slate-500",
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

      {!isCollapsed ? (
        <div className="space-y-2.5 pl-5 xl:space-y-3 xl:pl-6">
          {groupItems.map((slot) => {
            return (
              <AnimatedSlotListItem
                key={slot.id}
                slot={slot}
                isExiting={exitingSlotIds[slot.id] === true}
                isEntering={enteringSlotIds[slot.id] === true}
                onSlotClick={onSlotClick}
              />
            );
          })}
        </div>
      ) : null}
    </div>
  );
}