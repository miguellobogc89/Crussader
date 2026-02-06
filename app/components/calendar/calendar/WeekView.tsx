"use client";

import AppointmentPill from "@/app/components/calendar/details/appointments/AppointmentPill";
import BankHolidayCell from "@/app/components/calendar/calendar/BankHolidayCell";
import CurrentTimeLineFullSpan from "./CurrentTimeLineFullSpan";
import HourGuides from "./HourGuides";
import { layoutDayAppts, COL_GAP_PX } from "./layout";
import { localKeyTZ } from "./tz";
import type { CalendarAppt, HolidayLite } from "./types";

type Props = {
  days: Date[];
  apptsByDay?: Map<string, CalendarAppt[]>;
  onSelect?: (id: string) => void;
  onEdit?: (id: string) => void;
  START_HOUR: number;
  HOURS_COUNT: number;
  ROW_PX: number;

  holidays?: HolidayLite[];
  employeeNameById?: (id: string) => string;

  onCellClick?: (cellId: string) => void;
  selectedCellId?: string | null;
};

export default function WeekView({
  days,
  apptsByDay = new Map<string, CalendarAppt[]>(),
  onSelect,
  onEdit,
  START_HOUR,
  HOURS_COUNT,
  ROW_PX,
  holidays = [],
  onCellClick,
  selectedCellId,
}: Props) {
  const hours = Array.from({ length: HOURS_COUNT }, (_, i) => START_HOUR + i);
  const WEEK_HEADER_PX = 0;

  function makeCellId(dayKey: string, hourIndex: number) {
    return `${dayKey}|${hourIndex}`;
  }
  function isWeekend(d: Date) {
  const day = d.getDay();
  return day === 0 || day === 6;
}


  return (
    <div className="relative h-full">
      <CurrentTimeLineFullSpan
        referenceDate={new Date()}
        START_HOUR={START_HOUR}
        HOURS_COUNT={HOURS_COUNT}
        ROW_PX={ROW_PX}
        HEADER_OFFSET_PX={WEEK_HEADER_PX}
      />

      <HourGuides
        count={HOURS_COUNT}
        rowPx={ROW_PX}
        headerOffset={WEEK_HEADER_PX}
      />

<div
  className="grid h-full"
  style={{
    gridTemplateColumns: `64px repeat(${days.length}, minmax(0,1fr))`,
  }}
>

        {/* Columna horas */}
        <div className="flex flex-col">
          {hours.map((h) => (
            <div
              key={h}
              className="h-16 text-xs text-muted-foreground flex items-start pt-0.5"
            >
              {String(h).padStart(2, "0")}:00
            </div>
          ))}
        </div>

        {days.map((d) => {
          const dayKey = localKeyTZ(d);
          const list = apptsByDay.get(dayKey) ?? [];

          const holidayList = holidays.filter(
            (h) => localKeyTZ(new Date(h.date)) === dayKey
          );
          const isHoliday = holidayList.length > 0;
          const holidayTitle = holidayList.map((h) => h.name).join(" · ");

          return (
            <div key={dayKey} className="min-w-0">
              <div
                className="relative"
                style={{
                  height: WEEK_HEADER_PX + HOURS_COUNT * ROW_PX,
                }}
              >
                <div
                  className="absolute left-0 right-0"
                  style={{
                    top: WEEK_HEADER_PX,
                    height: HOURS_COUNT * ROW_PX,
                  }}
                >
                  {/* Festivo */}
                  {isHoliday ? (
                    <div className="pointer-events-none absolute inset-0">
                      <div className="absolute inset-0 rounded-md bg-amber-50/40" />
                      <div className="absolute right-2 top-2">
                        <BankHolidayCell visible={true} title={holidayTitle} />
                      </div>
                    </div>
                  ) : null}

                  {/* Overlay clicable por celda */}
                  {Array.from({ length: HOURS_COUNT }, (_, hourIndex) => {
                    const cellId = makeCellId(dayKey, hourIndex);
                    const isSelected = selectedCellId === cellId;

                    return (
                      <button
                        key={cellId}
                        type="button"
                        className={[
                          "absolute left-0 right-0 rounded-md",
                          "hover:bg-slate-900/5",
                          isSelected ? "bg-slate-900/10 ring-1 ring-slate-900/10" : "",
                        ].join(" ")}
                        style={{ top: hourIndex * ROW_PX, height: ROW_PX }}
                        onClick={() => onCellClick?.(cellId)}
                      />
                    );
                  })}

                  {/* Pills (citas) encima */}
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
