// app/components/slots/CancelledAppointments/CancelledAppointmentItem.tsx
"use client";

import { CalendarX2 } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import type { CancelledAppointmentItem } from "./CancelledAppointmentsList";

type Props = {
  item: CancelledAppointmentItem;
  onCreateSlot?: (appointment: CancelledAppointmentItem) => void;
};

export function CancelledAppointmentRow({ item, onCreateSlot }: Props) {
  return (
    <div className="rounded-2xl border border-red-100 bg-white px-3 py-3 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
          <CalendarX2 className="h-4 w-4" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="truncate text-[12px] font-semibold text-slate-900 xl:text-[13px]">
            {formatTimeRange(item.startAt, item.endAt)}
          </div>

          <div className="mt-0.5 truncate text-[12px] font-medium text-slate-800">
            {item.customerName ?? item.title ?? "Cita cancelada"}
          </div>

          <div className="mt-1 truncate text-[11px] text-muted-foreground">
            {item.serviceName ?? "Servicio no identificado"}
            {item.employeeName ? ` · ${item.employeeName}` : ""}
          </div>

          {item.notes ? (
            <div className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">
              {item.notes}
            </div>
          ) : null}
        </div>

        <Button
          type="button"
          size="sm"
          onClick={() => onCreateSlot?.(item)}
          className="h-8 shrink-0 rounded-xl bg-[#0B6CF4] px-3 text-[11px] font-semibold text-white shadow-[0_2px_8px_rgba(11,108,244,0.18)] hover:bg-[#0a5ed8]"
        >
          Crear hueco
        </Button>
      </div>
    </div>
  );
}

function formatTimeRange(startAt: string, endAt: string): string {
  const startDate = new Date(startAt);
  const endDate = new Date(endAt);

  const formatter = new Intl.DateTimeFormat("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return `${formatter.format(startDate)} - ${formatter.format(endDate)}`;
}