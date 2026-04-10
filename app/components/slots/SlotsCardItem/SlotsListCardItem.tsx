// app/components/slots/SlotsCardItem/SlotsListCardItem.tsx
"use client";

import type { SlotDTO } from "@/hooks/slots/useSlots";
import type { SlotItem, SelectedServiceItem } from "../slots.types";
import { formatTimeRange } from "../helpers/AvailableSlotsListHelpers";
import {
  ServicePill,
  EmployeePill,
  PricePill,
  RemainingTimePill,
  PendingBadge,
  SentBadge,
  StatusDotLabel,
} from "@/app/components/slots/SlotsCardItem/SlotCardSubcomponents";
import {
  formatEuro,
  getSlotPriceRange,
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

function isExpiredSlot(slot: SlotDTO): boolean {
  const recovered = isRecoveredSlot(slot);

  if (recovered) {
    return false;
  }

  if (slot.status === "expired" || slot.status === "cancelled") {
    return true;
  }

  const startMs = new Date(slot.startsAt).getTime();

  if (Number.isNaN(startMs)) {
    return false;
  }

  return startMs <= Date.now();
}

function getEffectiveStatus(slot: SlotDTO): string {
  if (isRecoveredSlot(slot)) {
    return "recovered";
  }

  if (isExpiredSlot(slot)) {
    return "expired";
  }

  return slot.status;
}

function getLeftBorderClass(slot: SlotDTO): string {
  const effectiveStatus = getEffectiveStatus(slot);

  if (effectiveStatus === "pending_publish" || effectiveStatus === "sent") {
    return "border-l-[3px] border-l-[#60A5FA]";
  }

  if (effectiveStatus === "recovered") {
    return "border-l-[3px] border-l-emerald-500";
  }

  if (effectiveStatus === "expired") {
    return "border-l-[3px] border-l-slate-300";
  }

  return "border-l-[3px] border-l-slate-200";
}

function getCardClass(slot: SlotDTO): string {
  const effectiveStatus = getEffectiveStatus(slot);

  if (effectiveStatus === "pending_publish" || effectiveStatus === "sent") {
    return [
      "w-full rounded-xl border px-5 py-4 text-left transition-all duration-150",
      "border-[#BFDBFE] bg-white",
      "hover:border-[#93C5FD] hover:bg-[#F8FBFF]",
      getLeftBorderClass(slot),
    ].join(" ");
  }

  if (effectiveStatus === "recovered") {
    return [
      "w-full rounded-xl border px-5 py-4 text-left transition-all duration-150",
      "border-[#D1FAE5] bg-white",
      "hover:border-[#A7F3D0] hover:bg-[#FAFFFC]",
      getLeftBorderClass(slot),
    ].join(" ");
  }

  if (effectiveStatus === "expired") {
    return [
      "w-full rounded-xl border px-5 py-4 text-left transition-all duration-150",
      "border-[#E5E7EB] bg-[#FCFCFD]",
      "hover:border-[#D1D5DB] hover:bg-[#FAFAFA]",
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
  const legacySlot = toLegacySlot(slot);
  const priceRange = getSlotPriceRange(slot);
  const selectedServices = toSelectedServices(slot);
  const visibleServices = resolveVisibleServices(slot);
  const dayLabel = slot.startsAt;

  const effectiveStatus = getEffectiveStatus(slot);
  const isPending = effectiveStatus === "pending_publish";
  const isSent = effectiveStatus === "sent";
  const isRecovered = effectiveStatus === "recovered";
  const isExpired = effectiveStatus === "expired";

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
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <div className="text-[15px] font-semibold tabular-nums text-[#171717]">
              {formatTimeRange(slot.startsAt, slot.endsAt)}
            </div>

            {slot.employeeName ? <EmployeePill name={slot.employeeName} /> : null}

            {!isExpired ? <RemainingTimePill startsAt={slot.startsAt} /> : null}
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

        <div className="flex shrink-0 flex-col items-end gap-3">
          {priceRange ? (
            <PricePill
              min={formatEuro(priceRange.min)}
              max={
                !isRecovered && priceRange.min !== priceRange.max
                  ? formatEuro(priceRange.max)
                  : undefined
              }
            />
          ) : null}

          {isPending ? <PendingBadge /> : null}
          {isSent ? <SentBadge /> : null}
          {isRecovered ? <StatusDotLabel label="Recuperado" tone="success" /> : null}
          {isExpired ? <StatusDotLabel label="Vencido" tone="muted" /> : null}
        </div>
      </div>
    </button>
  );
}