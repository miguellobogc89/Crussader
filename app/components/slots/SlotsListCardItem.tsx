// app/components/slots/SlotsListCardItem.tsx
"use client";

import { Clock3 } from "lucide-react";
import type { SlotDTO } from "@/hooks/slots/useSlots";
import type { SlotItem, SelectedServiceItem } from "./slots.types";
import { formatTimeRange, getStatusLabel } from "./helpers/slotsCalendarHelpers";
import {
  formatEuro,
  getSlotPriceRange,
  getStatusStyles,
  isRecoveredSlot,
  resolveVisibleServices,
  toLegacySlot,
  toSelectedServices,
} from "./helpers/slotsWeeklyCalendarItemHelpers";

type SlotsListCardItemProps = {
  slot: SlotDTO;
  onClick?: (
    day: string,
    slot: SlotItem,
    services: SelectedServiceItem[],
  ) => void;
};

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

  return (
    <button
      type="button"
      onClick={() => {
        onClick?.(dayLabel, legacySlot, selectedServices);
      }}
      className="w-full rounded-lg border border-[#e5e7eb] bg-white px-5 py-4 text-left transition-all duration-150 hover:border-[#e0dbff] hover:bg-[#faf9ff]"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f4f2fa]">
            <Clock3 className="h-4 w-4 text-[#8c889e]" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="text-[15px] font-semibold text-[#171717]">
                {formatTimeRange(slot.startsAt, slot.endsAt)}
              </div>

              {priceRange && (
                <div className="inline-flex items-center rounded-[10px] border border-[#DBEAFE] bg-[#F8FBFF] px-2.5 py-1 text-xs font-semibold text-[#0B6CF4]">
                  {formatEuro(priceRange.min)}
                  {!recovered && priceRange.min !== priceRange.max && (
                    <> - {formatEuro(priceRange.max)}</>
                  )}
                </div>
              )}
            </div>

            <div className="mt-2 flex flex-wrap gap-2">
              {visibleServices.map((service) => {
                return (
                  <span
                    key={service.id}
                    className="inline-flex items-center gap-2 rounded-full border border-[#BFDBFE] bg-[#EFF6FF] px-3 py-1.5 text-xs font-medium text-[#1E3A8A]"
                  >
                    <span className="truncate">{service.name}</span>
                    <span className="font-semibold text-brand-primary">
                      {formatEuro(service.price)}
                    </span>
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        <div>
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyles(
              statusLabel,
            )}`}
          >
            {statusLabel}
          </span>
        </div>
      </div>
    </button>
  );
}