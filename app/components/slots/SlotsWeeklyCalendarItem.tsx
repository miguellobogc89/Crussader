// app/components/slots/SlotsWeeklyCalendarItem.tsx
"use client";

import { Clock3 } from "lucide-react";
import type { SlotDTO } from "@/hooks/slots/useSlots";
import type { SlotItem, SelectedServiceItem } from "./slots.types";
import { formatTimeRange, getStatusLabel } from "./helpers/slotsCalendarHelpers";

type SlotsWeeklyCalendarItemProps = {
  slot: SlotDTO;
  onClick?: (
    day: string,
    slot: SlotItem,
    services: SelectedServiceItem[],
  ) => void;
};

type SlotServiceLike = {
  id: string;
  name: string;
  price: number;
  durationMin: number;
};

function isRecoveredSlot(slot: SlotDTO): boolean {
  return Boolean(slot.recoveredAt);
}

function getSlotMeta(slot: SlotDTO): Record<string, unknown> {
  return slot as unknown as Record<string, unknown>;
}

function formatEuro(value: number): string {
  return `${value}€`;
}

function getRecoveredServiceName(slot: SlotDTO): string | null {
  const meta = getSlotMeta(slot);

  if (typeof meta.recoveredServiceName === "string") {
    const value = meta.recoveredServiceName.trim();

    if (value.length > 0) {
      return value;
    }
  }

  if (typeof slot.serviceName === "string") {
    const value = slot.serviceName.trim();

    if (value.length > 0) {
      return value;
    }
  }

  return null;
}

function getRecoveredServiceId(slot: SlotDTO): string | null {
  const meta = getSlotMeta(slot);

  if (typeof meta.recoveredServiceId === "string") {
    const value = meta.recoveredServiceId.trim();

    if (value.length > 0) {
      return value;
    }
  }

  return null;
}

function getRecoveredSoldAmount(slot: SlotDTO): number | null {
  const meta = getSlotMeta(slot);

  if (
    typeof meta.recoveredAmount === "number" &&
    !Number.isNaN(meta.recoveredAmount)
  ) {
    return meta.recoveredAmount;
  }

  if (
    typeof meta.soldAmount === "number" &&
    !Number.isNaN(meta.soldAmount)
  ) {
    return meta.soldAmount;
  }

  if (
    typeof meta.finalPrice === "number" &&
    !Number.isNaN(meta.finalPrice)
  ) {
    return meta.finalPrice;
  }

  if (
    typeof meta.bookedPrice === "number" &&
    !Number.isNaN(meta.bookedPrice)
  ) {
    return meta.bookedPrice;
  }

  return null;
}

function resolveVisibleServices(slot: SlotDTO): SlotServiceLike[] {
  if (!isRecoveredSlot(slot)) {
    if (Array.isArray(slot.services) && slot.services.length > 0) {
      return slot.services;
    }

    return [];
  }

  const recoveredServiceId = getRecoveredServiceId(slot);

  if (
    recoveredServiceId &&
    Array.isArray(slot.services) &&
    slot.services.length > 0
  ) {
    const matchedById = slot.services.find((service) => {
      return service.id === recoveredServiceId;
    });

    if (matchedById) {
      const recoveredSoldAmount = getRecoveredSoldAmount(slot);

      return [
        {
          ...matchedById,
          price: recoveredSoldAmount ?? matchedById.price,
        },
      ];
    }
  }

  const recoveredServiceName = getRecoveredServiceName(slot);

  if (recoveredServiceName) {
    if (Array.isArray(slot.services) && slot.services.length > 0) {
      const normalizedRecoveredName = recoveredServiceName.trim().toLowerCase();

      const matchedByName = slot.services.find((service) => {
        return service.name.trim().toLowerCase() === normalizedRecoveredName;
      });

      if (matchedByName) {
        const recoveredSoldAmount = getRecoveredSoldAmount(slot);

        return [
          {
            ...matchedByName,
            price: recoveredSoldAmount ?? matchedByName.price,
          },
        ];
      }
    }

    const recoveredSoldAmount = getRecoveredSoldAmount(slot);

    return [
      {
        id: "recovered-service",
        name: recoveredServiceName,
        price: recoveredSoldAmount ?? 0,
        durationMin: 0,
      },
    ];
  }

  return [];
}

function resolveServiceNames(slot: SlotDTO): string[] {
  const visibleServices = resolveVisibleServices(slot);

  if (visibleServices.length > 0) {
    return visibleServices.map((service) => service.name);
  }

  if (typeof slot.serviceName === "string" && slot.serviceName.trim().length > 0) {
    return [slot.serviceName.trim()];
  }

  return ["Servicio sin definir"];
}

function getSlotPriceRange(slot: SlotDTO): { min: number; max: number } | null {
  const visibleServices = resolveVisibleServices(slot);

  if (visibleServices.length === 0) {
    return null;
  }

  if (isRecoveredSlot(slot)) {
    const soldAmount = getRecoveredSoldAmount(slot);

    if (typeof soldAmount === "number" && !Number.isNaN(soldAmount)) {
      return {
        min: soldAmount,
        max: soldAmount,
      };
    }
  }

  const prices = visibleServices
    .map((service) => service.price)
    .filter((price) => typeof price === "number" && !Number.isNaN(price));

  if (prices.length === 0) {
    return null;
  }

  return {
    min: Math.min(...prices),
    max: Math.max(...prices),
  };
}

function mapSlotStatus(slot: SlotDTO): SlotItem["status"] {
  if (slot.recoveredAt) {
    return "recovered";
  }

  if (slot.status === "pending_publish") {
    return "pending";
  }

  if (slot.status === "sent") {
    return "fresh";
  }

  if (slot.status === "expired" || slot.status === "cancelled") {
    return "unfilled";
  }

  return "fresh";
}

function toLegacySlot(slot: SlotDTO): SlotItem {
  return {
    id: slot.id,
    time: formatTimeRange(slot.startsAt, slot.endsAt),
    status: mapSlotStatus(slot),
    service: resolveServiceNames(slot).join(" · "),
    sentToCount: slot.sentCustomerCount,
  };
}

function toSelectedServices(slot: SlotDTO): SelectedServiceItem[] {
  const visibleServices = resolveVisibleServices(slot);

  if (visibleServices.length === 0) {
    return [];
  }

  return visibleServices.map((service) => {
    return {
      serviceId: service.id,
      serviceName: service.name,
      price: service.price,
      durationMin: service.durationMin,
    };
  });
}

function getStatusStyles(label: string) {
  const v = label.toLowerCase();

  if (v.includes("recuper")) {
    return "bg-green-50 text-green-700";
  }

  if (v.includes("pend")) {
    return "bg-amber-50 text-amber-700";
  }

  if (v.includes("enviado")) {
    return "bg-blue-50 text-blue-700";
  }

  if (v.includes("perd") || v.includes("expir")) {
    return "bg-gray-100 text-gray-500";
  }

  return "bg-gray-100 text-gray-500";
}

export function SlotsWeeklyCalendarItem({
  slot,
  onClick,
}: SlotsWeeklyCalendarItemProps) {
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
              statusLabel
            )}`}
          >
            {statusLabel}
          </span>
        </div>
      </div>
    </button>
  );
}