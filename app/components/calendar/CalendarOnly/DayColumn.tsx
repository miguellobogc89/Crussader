"use client";

import AppointmentPill from "@/app/components/calendar/AppointmentPill";
import { COL_GAP_PX, layoutDayAppts } from "./layout";
import type { CalendarAppt } from "./types";

export default function DayColumn({
  appts,
  startHour,
  hoursCount,
  rowPx,
  onSelect,
  onEdit,
}: {
  appts: CalendarAppt[];
  startHour: number;
  hoursCount: number;
  rowPx: number;
  onSelect?: (id: string) => void;
  onEdit?: (id: string) => void;
}) {
  return (
    <div className="relative" style={{ height: hoursCount * rowPx }}>
      {(() => {
        const layout = layoutDayAppts(appts, startHour, rowPx);
        return appts.map((a) => {
          const L = layout.get(a.id)!;
          const widthStyle = `calc(${L.widthPct}% - ${COL_GAP_PX}px)`;
          const leftStyle  = `calc(${L.leftPct}% + ${COL_GAP_PX / 2}px)`;
          return (
            <div key={a.id} className="absolute" style={{ top: L.top, height: L.height, left: leftStyle, width: widthStyle }}>
              <AppointmentPill
                startAtISO={a.startAt}
                title={a.serviceName ?? "Cita"}
                subtitle={[a.employeeName, a.resourceName].filter(Boolean).join(" · ")}
                color={a.serviceColor ?? undefined}
                onClick={() => onSelect?.(a.id)}
                onDoubleClick={() => onEdit?.(a.id)}
              />
            </div>
          );
        });
      })()}
    </div>
  );
}
