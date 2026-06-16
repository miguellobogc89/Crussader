// app/components/calendar/calendar/grid/CalendarGrid.tsx
"use client";

import { useEffect, useRef } from "react";

import CalendarCell from "./CalendarCell";
import AppointmentBlock from "../../appointments/AppointmentBlock";
import CurrentTimeLineFullSpan from "../CurrentTimeLineFullSpan";
import HourGuides from "../HourGuides";

import { layoutDayAppts, COL_GAP_PX } from "../layout";
import { localKeyTZ } from "../tz";

import type { CalendarAppt } from "../types";

type Props = {
  days: Date[];
  START_HOUR: number;
  HOURS_COUNT: number;
  ROW_PX: number;
  onCellClick?: (cellId: string) => void;
  selectedCellId?: string | null;
  onAppointmentSelect?: (id: string) => void;
  apptsByDay?: Map<string, CalendarAppt[]>;
};

export default function CalendarGrid({
  days,
  START_HOUR,
  HOURS_COUNT,
  ROW_PX,
  onCellClick,
  selectedCellId,
  onAppointmentSelect,
  apptsByDay = new Map(),
}: Props) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  const canvasHeight = HOURS_COUNT * ROW_PX;
const HEADER_HEIGHT_PX = 56;
const HOUR_COL_PX = 64;

  const hours = Array.from(
    { length: HOURS_COUNT },
    (_, i) => START_HOUR + i
  );

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    const targetHour = START_HOUR;
    el.scrollTop = 0;
  }, [START_HOUR, ROW_PX]);

  function makeCellId(dayKey: string, hourIndex: number) {
    return `${dayKey}|${hourIndex}`;
  }

  return (
    <div ref={scrollerRef} className="h-full min-h-0 flex-1 overflow-auto">
      <div className="relative w-full min-w-0">
        <CurrentTimeLineFullSpan
          referenceDate={new Date()}
          START_HOUR={START_HOUR}
          HOURS_COUNT={HOURS_COUNT}
          ROW_PX={ROW_PX}
          HEADER_OFFSET_PX={HEADER_HEIGHT_PX}
        />

        <HourGuides
          count={HOURS_COUNT}
          rowPx={ROW_PX}
          headerOffset={HEADER_HEIGHT_PX}
        />

        <div
          className="grid"
          style={{
            gridTemplateColumns: `${HOUR_COL_PX}px repeat(${days.length}, minmax(0,1fr))`,
          }}
        >
          <div
            className="sticky left-0 top-0 z-30 border-b border-border bg-white"
            style={{ height: HEADER_HEIGHT_PX }}
          />

{days.map((day) => {
  const today = new Date();

  const isToday =
    day.getFullYear() === today.getFullYear() &&
    day.getMonth() === today.getMonth() &&
    day.getDate() === today.getDate();

  const dayNumber = day.getDate();

  const dayLabel = day
    .toLocaleDateString("es-ES", {
      weekday: "short",
    })
    .replace(".", "")
    .slice(0, 3)
    .toUpperCase();

  return (
    <div
      key={localKeyTZ(day)}
      className={[
        "sticky top-0 z-20 flex items-center justify-center border-b border-r border-slate-100 bg-white",
        isToday ? "bg-blue-50/70" : "",
      ].join(" ")}
      style={{ height: HEADER_HEIGHT_PX }}
    >
      <div className="relative flex h-full w-full items-center justify-center">
        <div className="flex items-start gap-1.5 xl2:gap-2">
          <span
            className={[
              "leading-none text-[26px] font-black tracking-tight xl2:text-[38px]",
              isToday ? "text-blue-600" : "text-slate-300",
            ].join(" ")}
          >
            {dayNumber}
          </span>

          <span
            className={[
              "pt-0.5 text-[10px] font-bold tracking-[0.16em] xl2:pt-1.5 xl2:text-[11px] xl2:tracking-[0.22em]",
              isToday ? "text-blue-600" : "text-slate-400",
            ].join(" ")}
          >
            {dayLabel}
          </span>
        </div>

        {isToday ? (
          <div className="absolute bottom-0 h-0.5 w-10 rounded-t-full bg-blue-600 xl2:h-1 xl2:w-14" />
        ) : null}
      </div>
    </div>
  );
})}

          <div className="flex flex-col">
            {hours.map((hour) => (
              <div
                key={hour}
                className="flex items-start justify-end border-r border-border pr-1.5 pt-1 text-[11px] font-medium text-slate-600 xl2:pr-2 xl2:text-xs"
                style={{ height: ROW_PX }}
              >
                {String(hour).padStart(2, "0")}:00
              </div>
            ))}
          </div>

          {days.map((day) => {
            const dayKey = localKeyTZ(day);
            const appointments =
              apptsByDay.get(dayKey) ?? [];

            const layout = layoutDayAppts(
              appointments,
              START_HOUR,
              ROW_PX
            );

            return (
              <div
                key={dayKey}
                className="relative flex flex-col overflow-hidden"
                style={{ height: canvasHeight }}
              >
                {Array.from(
                  { length: HOURS_COUNT },
                  (_, hourIndex) => {
                    const cellId = makeCellId(
                      dayKey,
                      hourIndex
                    );

                    return (
                      <CalendarCell
                        key={cellId}
                        cellId={cellId}
                        rowPx={ROW_PX}
                        isSelected={
                          selectedCellId === cellId
                        }
                        onClick={onCellClick}
                      />
                    );
                  }
                )}

                {appointments.map((appointment) => {
                  const itemLayout = layout.get(
                    appointment.id
                  );

                  if (!itemLayout) return null;



                  return (
                    
                    <div
                      key={appointment.id}
                      className="absolute z-20"
                      style={{
                        top: itemLayout.top,
                        height: itemLayout.height,
                        left: `calc(${itemLayout.leftPct}% + ${
                          COL_GAP_PX / 2
                        }px)`,
                        width: `calc(${itemLayout.widthPct}% - ${COL_GAP_PX}px)`,
                      }}
                    >
                      
                      <AppointmentBlock
                        id={appointment.id}
                        startAtISO={appointment.startAt}
                        endAtISO={appointment.endAt}
                        serviceName={appointment.serviceName}
                        employeeName={appointment.employeeName}
                        employeeColor={appointment.employeeColor}
                        resourceName={appointment.resourceName}
                        serviceColor={appointment.serviceColor}
                        status={appointment.status}
                        onSelect={onAppointmentSelect}
                        customerName={appointment.customerName}
                        customerPhone={appointment.customerPhone}
                        source={appointment.source}
                        hasRecoverySlot={appointment.hasRecoverySlot}
                      />
                    </div>
                  );  
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}