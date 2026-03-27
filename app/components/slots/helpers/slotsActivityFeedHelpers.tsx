// app/components/slots/helpers/slotsActivityFeedHelpers.tsx
import { Clock, CheckCircle2, Send } from "lucide-react";
import type { ReactNode } from "react";

export type ActivityPayload = {
  customer_id?: string;
  customer_name?: string;
  service_id?: string;
  service_name?: string;
  recipients_count?: number;
  missed_count?: number;
};

export type ActivityItem = {
  id: string;
  text: string;
  time: string;
  status: string;
  payload?: ActivityPayload;
};

export function getRecoveredToday(items: ActivityItem[]) {
  return items.filter((item) => item.status === "slot_booked").length;
}

export function getItemVisual(status: string) {
  if (status === "slot_booked") {
    return {
      icon: CheckCircle2,
      iconColor: "text-emerald-500",
      iconBg: "bg-emerald-50",
      rowBg: "bg-emerald-50/60",
    };
  }

  if (status === "booking_missed") {
    return {
      icon: Clock,
      iconColor: "text-amber-500",
      iconBg: "bg-amber-50",
      rowBg: "",
    };
  }

  return {
    icon: Send,
    iconColor: "text-blue-500",
    iconBg: "bg-blue-50",
    rowBg: "",
  };
}

export function getActivityTitle(item: ActivityItem) {
  if (item.status === "invite_sent") {
    return "Invitación Enviada";
  }

  if (item.status === "slot_booked") {
    return "Cita Rescatada";
  }

  if (item.status === "booking_missed") {
    return "Hueco sin Cubrir";
  }

  return "Actividad";
}

export function getActivityDescription(item: ActivityItem): ReactNode {
  if (item.status === "slot_booked") {
    const customerName = item.payload?.customer_name ?? "";
    const serviceName = item.payload?.service_name ?? "";

    if (customerName !== "" && serviceName !== "") {
      return (
        <>
          <span className="font-medium text-primary">{customerName}</span>{" "}
          <span>ha reservado el hueco para</span>{" "}
          <span className="font-semibold text-slate-800">{serviceName}</span>
        </>
      );
    }

    return item.text;
  }

  if (item.status === "invite_sent") {
    const recipientsCount = item.payload?.recipients_count;

    if (typeof recipientsCount === "number") {
      return `Invitación enviada a ${recipientsCount} usuarios`;
    }

    return item.text;
  }

  if (item.status === "booking_missed") {
    const missedCount = item.payload?.missed_count;

    if (typeof missedCount === "number") {
      if (missedCount === 1) {
        return "1 usuario intentó reservar pero ya estaba ocupado";
      }

      return `${missedCount} usuarios intentaron reservar pero ya estaba ocupado`;
    }

    return item.text;
  }

  return item.text;
}