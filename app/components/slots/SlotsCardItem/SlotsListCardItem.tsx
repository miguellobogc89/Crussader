// app/components/slots/SlotsCardItem/SlotsListCardItem.tsx
"use client";

import type { SlotDTO } from "@/hooks/slots/useSlots";
import type { SelectedServiceItem } from "../slots.types";
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
  getEffectiveSlotStatus,
  getSlotPriceRange,
  resolveVisibleServices,
  toSelectedServices,
} from "../helpers/slotsWeeklyCalendarItemHelpers";

type SlotsListCardItemProps = {
  slot: SlotDTO;
  onClick?: (
    day: string,
    slot: SlotDTO,
    services: SelectedServiceItem[],
  ) => void;
};

function getLeftBorderClass(slot: SlotDTO): string {
  const effectiveStatus = getEffectiveSlotStatus(slot);

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
  const effectiveStatus = getEffectiveSlotStatus(slot);

  if (effectiveStatus === "pending_publish" || effectiveStatus === "sent") {
    return [
      "w-full rounded-xl border px-3 py-3 text-left transition-all duration-300 ease-out xl:px-3.5 xl:py-3.5 xl2:px-5 xl2:py-4",
      "border-[#BFDBFE] bg-white",
      "hover:border-[#93C5FD] hover:bg-[#F8FBFF]",
      "cursor-pointer",
      getLeftBorderClass(slot),
    ].join(" ");
  }

  if (effectiveStatus === "recovered") {
    return [
      "w-full rounded-xl border px-3 py-3 text-left transition-all duration-300 ease-out xl:px-3.5 xl:py-3.5 xl2:px-5 xl2:py-4",
      "border-[#D1FAE5] bg-white",
      "hover:border-[#A7F3D0] hover:bg-[#FAFFFC]",
      "cursor-pointer",
      getLeftBorderClass(slot),
    ].join(" ");
  }

  if (effectiveStatus === "expired") {
    return [
      "w-full rounded-xl border px-3 py-3 text-left transition-all duration-300 ease-out xl:px-3.5 xl:py-3.5 xl2:px-5 xl2:py-4",
      "border-[#E5E7EB] bg-[#FCFCFD]",
      "hover:border-[#D1D5DB] hover:bg-[#FAFAFA]",
      "cursor-pointer",
      getLeftBorderClass(slot),
    ].join(" ");
  }

  return [
    "w-full rounded-xl border border-[#E5E7EB] bg-white px-3 py-3 text-left transition-all duration-300 ease-out xl:px-3.5 xl:py-3.5 xl2:px-5 xl2:py-4",
    "hover:border-[#E5E7EB] hover:bg-white",
    "cursor-pointer",
    getLeftBorderClass(slot),
  ].join(" ");
}

export function SlotsListCardItem({
  slot,
  onClick,
}: SlotsListCardItemProps) {
  const priceRange = getSlotPriceRange(slot);
  const selectedServices = toSelectedServices(slot);
  const visibleServices = resolveVisibleServices(slot);
  const dayLabel = slot.startsAt;

  const effectiveStatus = getEffectiveSlotStatus(slot);
  const isPending = effectiveStatus === "pending_publish";
  const isSent = effectiveStatus === "sent";
  const isRecovered = effectiveStatus === "recovered";
  const isExpired = effectiveStatus === "expired";

  return (
    <button
      type="button"
      onClick={() => {
        onClick?.(dayLabel, slot, selectedServices);
      }}
      className={getCardClass(slot)}
    >
      <div className="flex items-start justify-between gap-3 xl:gap-4 xl2:gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-center gap-1.5 xl:gap-2">
            <div className="text-[13px] font-semibold tabular-nums text-[#171717] xl:text-sm xl2:text-[15px]">
              {formatTimeRange(slot.startsAt, slot.endsAt)}
            </div>

            {slot.employeeName ? <EmployeePill name={slot.employeeName} /> : null}

            {!isExpired ? <RemainingTimePill startsAt={slot.startsAt} /> : null}
          </div>

          <div className="mt-1.5 flex flex-wrap gap-1.5 xl:mt-2 xl:gap-2 xl2:mt-2 xl2:gap-2">
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

        <div className="flex shrink-0 flex-col items-end gap-2 xl:gap-2.5 xl2:gap-3">
          {priceRange ? (
            <PricePill
              min={formatEuro(priceRange.min)}
              max={
                !isRecovered && priceRange.min !== priceRange.max
                  ? formatEuro(priceRange.max)
                  : undefined
              }
              tone={isPending || isSent ? "blue" : "success"}
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