"use client";

import AppointmentPill from "@/app/components/calendar/AppointmentPill";
import CurrentTimeLineFullSpan from "./CurrentTimeLineFullSpan";
import HourGuides from "./HourGuides";
import { layoutDayAppts, COL_GAP_PX } from "./layout";
import { localKeyTZ } from "./tz";
import type { CalendarAppt } from "./types";

type Props = {
  days: Date[];                               // ✅ ahora dinámico (3, 5 o 7 días)
  apptsByDay: Map<string, CalendarAppt[]>;
  onSelect?: (id: string) => void;
  onEdit?: (id: string) => void;
  START_HOUR: number;
  HOURS_COUNT: number;
  ROW_PX: number;
};

export default function WeekView({
  days,
  apptsByDay,
  onSelect,
  onEdit,
  START_HOUR,
  HOURS_COUNT,
  ROW_PX,
}: Props) {
  const hours = Array.from({ length: HOURS_COUNT }, (_, i) => START_HOUR + i);
  const WEEK_HEADER_PX = 40; // h-10

  return (
    <div className="relative h-full">
      {/* Línea “ahora” a lo ancho del lienzo (para cualquier multi-día) */}
      <CurrentTimeLineFullSpan
        referenceDate={new Date()}
        START_HOUR={START_HOUR}
        HOURS_COUNT={HOURS_COUNT}
        ROW_PX={ROW_PX}
        HEADER_OFFSET_PX={WEEK_HEADER_PX}
      />

      {/* Guías con offset de cabecera */}
      <HourGuides count={HOURS_COUNT} rowPx={ROW_PX} headerOffset={WEEK_HEADER_PX} />

      {/* Grid con columna de horas + N columnas de días */}
      <div
        className="grid h-full gap-2"
        style={{ gridTemplateColumns: `64px repeat(${days.length}, minmax(0,1fr))` }}
      >
        {/* columna horas */}
        <div className="flex flex-col">
          <div className="h-10" />
          {hours.map((h) => (
            <div
              key={h}
              className="h-16 text-xs text-muted-foreground flex items-start pt-0.5"
            >
              {String(h).padStart(2, "0")}:00
            </div>
          ))}
        </div>

        {/* columnas de días */}
        {days.map((d) => {
          const key = localKeyTZ(d);
          const list = apptsByDay.get(key) ?? [];

          return (
            <div key={key} className="min-w-0">
              <div
                className="relative"
                style={{ height: WEEK_HEADER_PX + HOURS_COUNT * ROW_PX }}
              >
                {/* Contenedor de pills debajo del header del día */}
                <div
                  className="absolute left-0 right-0"
                  style={{ top: WEEK_HEADER_PX, height: HOURS_COUNT * ROW_PX }}
                >
                  {(() => {
                    const layout = layoutDayAppts(list, START_HOUR, ROW_PX);
                    return list.map((a) => {
                      const L = layout.get(a.id)!;
                      const widthStyle = `calc(${L.widthPct}% - ${COL_GAP_PX}px)`;
                      const leftStyle = `calc(${L.leftPct}% + ${COL_GAP_PX / 2}px)`;
                      return (
                        <div
                          key={a.id}
                          className="absolute"
                          style={{
                            top: L.top,
                            height: L.height,
                            left: leftStyle,
                            width: widthStyle,
                          }}
                        >
                          <AppointmentPill
                            startAtISO={a.startAt}
                            title={a.serviceName ?? "Cita"}
                            subtitle={[a.employeeName, a.resourceName]
                              .filter(Boolean)
                              .join(" · ")}
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
        })}
      </div>
    </div>
  );
}
