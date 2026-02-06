"use client";

import AppointmentPill from "@/app/components/calendar/details/appointments/AppointmentPill";
import BankHolidayCell from "@/app/components/calendar/calendar/BankHolidayCell";
import CurrentTimeLineFullSpan from "./CurrentTimeLineFullSpan";
import HourGuides from "./HourGuides";
import { layoutDayAppts, COL_GAP_PX } from "./layout";
import type { CalendarAppt, HolidayLite } from "./types";
import { localKeyTZ } from "./tz";

type Props = {
  date: Date;
  appts: CalendarAppt[];
  onSelect?: (id: string) => void;
  onEdit?: (id: string) => void;

  START_HOUR: number;
  HOURS_COUNT: number;
  ROW_PX: number;

  holidays?: HolidayLite[];

  onCellClick?: (cellId: string) => void;
  selectedCellId?: string | null;
};

export default function DayView({
  date,
  appts,
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
  const dayKey = localKeyTZ(date);

  function makeCellId(hourIndex: number) {
    return `${dayKey}|${hourIndex}`;
  }

  const holidayList = holidays.filter(
    (h) => localKeyTZ(new Date(h.date)) === dayKey
  );
  const isHoliday = holidayList.length > 0;
  const holidayTitle = holidayList.map((x) => x.name).join(" · ");

  return (
    <div className="relative h-full">
      <CurrentTimeLineFullSpan
        referenceDate={date}
        START_HOUR={START_HOUR}
        HOURS_COUNT={HOURS_COUNT}
        ROW_PX={ROW_PX}
      />

      <HourGuides count={HOURS_COUNT} rowPx={ROW_PX} />

      <div className="grid grid-cols-[64px_1fr] h-full">
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

        {/* Lienzo día */}
        <div className="relative" style={{ height: HOURS_COUNT * ROW_PX }}>
          {/* Festivo */}
          {isHoliday && (
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute inset-0 rounded-md bg-amber-50/40" />
              <div className="absolute right-2 top-2">
                <BankHolidayCell visible={true} title={holidayTitle} />
              </div>
            </div>
          )}

          {/* Overlay clicable por celda */}
          {Array.from({ length: HOURS_COUNT }, (_, hourIndex) => {
            const cellId = makeCellId(hourIndex);
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
                onClick={() => {
                  if (onCellClick) onCellClick(cellId);
                }}
              />
            );
          })}

          {/* Pills */}
          {(() => {
            const layout = layoutDayAppts(appts, START_HOUR, ROW_PX);

            return appts.map((a) => {
              const L = layout.get(a.id);
              if (!L) return null;

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
                    onClick={() => {
                      if (onSelect) onSelect(a.id);
                    }}
                    onDoubleClick={() => {
                      if (onEdit) onEdit(a.id);
                    }}
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
