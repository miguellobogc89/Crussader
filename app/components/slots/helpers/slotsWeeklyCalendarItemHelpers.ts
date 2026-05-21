// app/components/slots/helpers/slotsWeeklyCalendarItemHelpers.ts
import type { SlotDTO } from "@/hooks/slots/useSlots";
import type { SlotItem, SelectedServiceItem } from "../slots.types";
import { formatTimeRange } from "./AvailableSlotsListHelpers";

export type SlotServiceLike = {
  id: string;
  name: string;
  price: number;
  durationMin: number;
};

export function isRecoveredSlot(slot: SlotDTO): boolean {
  return Boolean(slot.recoveredAt);
}

export type EffectiveSlotStatus =
  | "pending_publish"
  | "sent"
  | "recovered"
  | "expired"
  | "cancelled"
  | string;

export function isExpiredSlot(slot: SlotDTO): boolean {
  if (isRecoveredSlot(slot)) {
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

export function getEffectiveSlotStatus(slot: SlotDTO): EffectiveSlotStatus {
  if (isRecoveredSlot(slot)) {
    return "recovered";
  }

  if (isExpiredSlot(slot)) {
    return "expired";
  }

  return slot.status;
}

export function formatEuro(value: number): string {
  return `${value}€`;
}

export function getRecoveredServiceName(slot: SlotDTO): string | null {
  if (
    typeof slot.recoveredServiceName === "string" &&
    slot.recoveredServiceName.trim().length > 0
  ) {
    return slot.recoveredServiceName.trim();
  }

  if (typeof slot.serviceName === "string" && slot.serviceName.trim().length > 0) {
    return slot.serviceName.trim();
  }

  return null;
}

export function getRecoveredServiceId(slot: SlotDTO): string | null {
  if (
    typeof slot.recoveredServiceId === "string" &&
    slot.recoveredServiceId.trim().length > 0
  ) {
    return slot.recoveredServiceId.trim();
  }

  return null;
}

export function getRecoveredSoldAmount(slot: SlotDTO): number | null {
  if (
    typeof slot.recoveredSoldAmount === "number" &&
    !Number.isNaN(slot.recoveredSoldAmount)
  ) {
    return slot.recoveredSoldAmount;
  }

  return null;
}

export function resolveVisibleServices(slot: SlotDTO): SlotServiceLike[] {
  if (!isRecoveredSlot(slot)) {
    if (Array.isArray(slot.services) && slot.services.length > 0) {
      return slot.services.map((service) => {
        return {
          id: service.id,
          name: service.name,
          price: service.price,
          durationMin: service.durationMin,
        };
      });
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
          id: matchedById.id,
          name: matchedById.name,
          price:
            recoveredSoldAmount !== null ? recoveredSoldAmount : matchedById.price,
          durationMin: matchedById.durationMin,
        },
      ];
    }
  }

  const recoveredServiceName = getRecoveredServiceName(slot);

  if (recoveredServiceName) {
    const recoveredSoldAmount = getRecoveredSoldAmount(slot);
    let recoveredPrice = 0;

    if (recoveredSoldAmount !== null) {
      recoveredPrice = recoveredSoldAmount;
    }

    return [
      {
        id: recoveredServiceId || "recovered-service",
        name: recoveredServiceName,
        price: recoveredPrice,
        durationMin: 0,
      },
    ];
  }

  return [];
}

export function resolveServiceNames(slot: SlotDTO): string[] {
  const visibleServices = resolveVisibleServices(slot);

  if (visibleServices.length > 0) {
    return visibleServices.map((service) => service.name);
  }

  if (typeof slot.serviceName === "string" && slot.serviceName.trim().length > 0) {
    return [slot.serviceName.trim()];
  }

  return ["Servicio sin definir"];
}

export function getSlotPriceRange(
  slot: SlotDTO,
): { min: number; max: number } | null {
  const visibleServices = resolveVisibleServices(slot);

  if (visibleServices.length === 0) {
    return null;
  }

  if (isRecoveredSlot(slot)) {
    const soldAmount = getRecoveredSoldAmount(slot);

    if (soldAmount !== null) {
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

export function mapSlotStatus(slot: SlotDTO): SlotItem["status"] {
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

export function toLegacySlot(slot: SlotDTO): SlotItem {
  return {
    id: slot.id,
    time: formatTimeRange(slot.startsAt, slot.endsAt),
    status: mapSlotStatus(slot),
    service: resolveServiceNames(slot).join(" · "),
    sentToCount: slot.sentCustomerCount,
  };
}

export function toSelectedServices(slot: SlotDTO): SelectedServiceItem[] {
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

export function getStatusStyles(label: string): string {
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