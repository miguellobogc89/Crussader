// app/components/slots/helpers/AvailableSlotsListHelpers.ts
import type { SlotDTO } from "@/hooks/slots/useSlots";
import type { SlotItem } from "../slots.types";

export function formatDateLabel(value: string): string {
  const date = new Date(value);

  return new Intl.DateTimeFormat("es-ES", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  }).format(date);
}

export function formatTimeRange(startValue: string, endValue: string): string {
  const start = new Date(startValue);
  const end = new Date(endValue);

  const startText = new Intl.DateTimeFormat("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(start);

  const endText = new Intl.DateTimeFormat("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(end);

  return `${startText} - ${endText}`;
}

export function getStatusLabel(slot: SlotDTO): string {
  if (slot.status === "pending_publish") {
    return "Pendiente de publicar";
  }

  if (slot.status === "sent") {
    return `Enviado ${slot.sentCustomerCount} usuarios`;
  }

  if (slot.status === "recovered") {
    return "Recuperado";
  }

  if (slot.status === "expired") {
    return "Perdido";
  }

  if (slot.status === "cancelled") {
    return "Cancelado";
  }

  return slot.status;
}

export function getCardClasses(slot: SlotDTO): string {
  if (slot.status === "pending_publish") {
    return "border-amber-200 bg-amber-50";
  }

  if (slot.status === "sent") {
    return "border-sky-200 bg-sky-50";
  }

  if (slot.status === "recovered") {
    return "border-emerald-200 bg-emerald-50";
  }

  if (slot.status === "expired") {
    return "border-rose-200 bg-rose-50";
  }

  return "border-slate-200 bg-slate-50";
}

export function getTextClasses(slot: SlotDTO): string {
  if (slot.status === "pending_publish") {
    return "text-amber-800";
  }

  if (slot.status === "sent") {
    return "text-sky-800";
  }

  if (slot.status === "recovered") {
    return "text-emerald-800";
  }

  if (slot.status === "expired") {
    return "text-rose-800";
  }

  return "text-slate-700";
}

export function mapSlotToLegacyShape(slot: SlotDTO): SlotItem {
  const time = new Date(slot.startsAt).toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  if (slot.status === "pending_publish") {
    return {
      time,
      status: "fresh",
      service: slot.serviceName ?? undefined,
    } as SlotItem;
  }

  if (slot.status === "sent") {
    return {
      time,
      status: "pending",
      service: slot.serviceName ?? undefined,
      sentToCount: slot.sentCustomerCount,
    } as SlotItem;
  }

  if (slot.status === "recovered") {
    return {
      id: slot.id,
      time,
      status: "recovered",
      service: slot.serviceName || "",
    };
  }

  return {
    time,
    status: "unfilled",
    service: slot.serviceName ?? undefined,
  } as SlotItem;
}

export function getPendingPublishCount(slots: SlotDTO[]): number {
  return slots.filter((slot) => slot.status === "pending_publish").length;
}