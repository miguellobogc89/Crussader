"use client";

import AppointmentPill from "@/app/components/calendar/AppointmentPill";
import CurrentTimeLineFullSpan from "./CurrentTimeLineFullSpan";
import HourGuides from "./HourGuides";
import { layoutDayAppts, COL_GAP_PX } from "./layout";
import type { CalendarAppt } from "./types";

type Props = {
  date: Date;
  appts: CalendarAppt[];
  onSelect?: (id: string) => void;
  onEdit?: (id: string) => void;
  START_HOUR: number;
  HOURS_COUNT: number;
  ROW_PX: number;
};

export default function DayView({
  date,
  appts,
  onSelect,
  onEdit,
  START_HOUR,
  HOURS_COUNT,
  ROW_PX,
}: Props) {
  const hours = Array.from({ length: HOURS_COUNT }, (_, i) => START_HOUR + i);

  return (
    <div className="relative h-full">
      <CurrentTimeLineFullSpan
        referenceDate={date}
        START_HOUR={START_HOUR}
        HOURS_COUNT={HOURS_COUNT}
        ROW_PX={ROW_PX}
      />
      <HourGuides count={HOURS_COUNT} rowPx={ROW_PX} />

      <div className="grid grid-cols-[64px_1fr] gap-2 h-full">
        {/* Columna de horas */}
        <div className="flex flex-col">
          {hours.map((h) => (
            <div key={h} className="h-16 text-xs text-muted-foreground flex items-start pt-0.5">
              {String(h).padStart(2, "0")}:00
            </div>
          ))}
        </div>

        {/* Lienzo del día con layout de solapes */}
        <div className="relative" style={{ height: HOURS_COUNT * ROW_PX }}>
          {(() => {
            const layout = layoutDayAppts(appts, START_HOUR, ROW_PX);
            return appts.map((a) => {
              const L = layout.get(a.id)!;
              const widthStyle = `calc(${L.widthPct}% - ${COL_GAP_PX}px)`;
              const leftStyle = `calc(${L.leftPct}% + ${COL_GAP_PX / 2}px)`;
              return (
                <div
                  key={a.id}
                  className="absolute"
                  style={{ top: L.top, height: L.height, left: leftStyle, width: widthStyle }}
                >
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
      </div>
    </div>
  );
}
