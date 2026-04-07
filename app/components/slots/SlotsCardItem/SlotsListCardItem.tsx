// app/components/slots/SlotsCardItem/SlotsListCardItem.tsx
"use client";

import { Send } from "lucide-react";
import type { SlotDTO } from "@/hooks/slots/useSlots";
import type { SlotItem, SelectedServiceItem } from "../slots.types";
import {
  formatTimeRange,
  getStatusLabel,
} from "../helpers/AvailableSlotsListHelpers";
import {
  ServicePill,
  EmployeePill,
  PricePill,
  RemainingTimePill,
  PendingBadge,
  SentBadge,
} from "@/app/components/slots/SlotsCardItem/SlotCardSubcomponents";
import {
  formatEuro,
  getSlotPriceRange,
  getStatusStyles,
  isRecoveredSlot,
  resolveVisibleServices,
  toLegacySlot,
  toSelectedServices,
} from "../helpers/slotsWeeklyCalendarItemHelpers";

type SlotsListCardItemProps = {
  slot: SlotDTO;
  onClick?: (
    day: string,
    slot: SlotItem,
    services: SelectedServiceItem[],
  ) => void;
};

function getLeftBorderClass(slot: SlotDTO): string {
if (slot.status === "pending_publish" || slot.status === "sent") {
  return "border-l-[3px] border-l-[#60A5FA]";
}

  if (slot.status === "recovered") {
    return "border-l-[3px] border-l-emerald-500";
  }

  if (slot.status === "expired" || slot.status === "cancelled") {
    return "border-l-[3px] border-l-slate-300";
  }

  return "border-l-[3px] border-l-slate-200";
}

function getCardClass(slot: SlotDTO): string {
  if (slot.status === "pending_publish" || slot.status === "sent") {
    return [
      "w-full rounded-xl border px-5 py-4 text-left transition-all duration-150",
      "border-[#BFDBFE] bg-white",
      "hover:border-[#93C5FD] hover:bg-[#F8FBFF]",
      getLeftBorderClass(slot),
    ].join(" ");
  }

  return [
    "w-full rounded-lg border border-[#E5E7EB] bg-white px-5 py-4 text-left transition-all duration-150",
    "hover:border-[#E5E7EB] hover:bg-white",
    getLeftBorderClass(slot),
  ].join(" ");
}

export function SlotsListCardItem({
  slot,
  onClick,
}: SlotsListCardItemProps) {
  const statusLabel = getStatusLabel(slot);
  const legacySlot = toLegacySlot(slot);
  const priceRange = getSlotPriceRange(slot);
  const selectedServices = toSelectedServices(slot);
  const visibleServices = resolveVisibleServices(slot);
  const dayLabel = slot.startsAt;
  const recovered = isRecoveredSlot(slot);
  const isPending = slot.status === "pending_publish";

  return (
    <button
      type="button"
      onClick={() => {
        onClick?.(dayLabel, legacySlot, selectedServices);
      }}
      className={getCardClass(slot)}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <div className="text-[15px] font-semibold text-[#171717] tabular-nums">
                  {formatTimeRange(slot.startsAt, slot.endsAt)}
                </div>

                {slot.employeeName ? <EmployeePill name={slot.employeeName} /> : null}

                {priceRange ? (
                  <>
                    <PricePill
                      min={formatEuro(priceRange.min)}
                      max={
                        !recovered && priceRange.min !== priceRange.max
                          ? formatEuro(priceRange.max)
                          : undefined
                      }
                    />
                    <RemainingTimePill startsAt={slot.startsAt} />
                  </>
                ) : (
                  <RemainingTimePill startsAt={slot.startsAt} />
                )}
              </div>
            </div>

            <div className="mt-2 flex flex-wrap gap-2">
              {visibleServices.map((service) => {
                return (
                  <ServicePill
                    key={service.id}
                    name={service.name}
                    price={formatEuro(service.price)}
                  />
                );
              })}
            </div>
          </div>
        </div>

{isPending ? (
  <div className="shrink-0">
    <PendingBadge />
  </div>
) : slot.status === "sent" ? (
  <div className="shrink-0">
    <SentBadge />
  </div>
) : (
  <div className="shrink-0">
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyles(
        statusLabel,
      )}`}
    >
      {statusLabel}
    </span>
  </div>
)}
      </div>
    </button>
  );
}