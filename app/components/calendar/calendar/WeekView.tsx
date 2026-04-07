// app/components/calendar/calendar/WeekView.tsx
"use client";

import { useState } from "react";

import AppointmentPill from "@/app/components/calendar/details/appointments/AppointmentPill";
import BankHolidayCell from "@/app/components/calendar/calendar/BankHolidayCell";
import CurrentTimeLineFullSpan from "./CurrentTimeLineFullSpan";
import HourGuides from "./HourGuides";
import { layoutDayAppts, COL_GAP_PX } from "./layout";
import { localKeyTZ } from "./tz";
import type { CalendarAppt, HolidayLite } from "./types";

import WeekShiftsByEmployee from "@/app/components/calendar/calendar/WeekShiftsByEmployee";
import WeekShiftsByRole from "@/app/components/calendar/calendar/WeekShiftsByRole";
import AppointmentBlock from "@/app/components/calendar/calendar/AppointmentBlock";

type ShiftEventLite = {
  id: string;
  employeeId: string | null;
  locationId: string | null;
  startAt: string;
  endAt: string;
  kind: string;
  label: string | null;
  templateId: string | null;
};

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

  shiftEvents?: ShiftEventLite[];
  slots?: any[];
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
  employeeNameById,
  onCellClick,
  selectedCellId,
  shiftEvents,
  slots = [],
}: Props) {
  const [shiftView, setShiftView] = useState<"role" | "employee">("role");

  const hours = Array.from({ length: HOURS_COUNT }, (_, i) => START_HOUR + i);
  const WEEK_HEADER_PX = 0;

  const safeShiftEvents = shiftEvents ? shiftEvents : [];

  const safeSlots = Array.isArray(slots) ? slots : [];

const slotsByDay = new Map<string, any[]>();

for (const slot of safeSlots) {
  if (!slot?.startsAt || !slot?.endsAt) continue;

  const dayKey = localKeyTZ(new Date(slot.startsAt));
  const current = slotsByDay.get(dayKey);

  if (current) {
    current.push(slot);
  } else {
    slotsByDay.set(dayKey, [slot]);
  }
}

  function makeCellId(dayKey: string, hourIndex: number) {
    return `${dayKey}|${hourIndex}`;
  }

  return (
    <div className="relative h-full">
      {/* Toggle vista turnos */}
      <div className="absolute right-2 top-2 z-40 flex items-center gap-2">
        <button
          type="button"
          className={[
            "px-2 py-1 text-xs rounded-md border",
            shiftView === "role"
              ? "bg-slate-900 text-white border-slate-900"
              : "bg-white border-border",
          ].join(" ")}
          onClick={() => setShiftView("role")}
        >
          Por rol
        </button>

        <button
          type="button"
          className={[
            "px-2 py-1 text-xs rounded-md border",
            shiftView === "employee"
              ? "bg-slate-900 text-white border-slate-900"
              : "bg-white border-border",
          ].join(" ")}
          onClick={() => setShiftView("employee")}
        >
          Por empleado
        </button>
      </div>

      <CurrentTimeLineFullSpan
        referenceDate={new Date()}
        START_HOUR={START_HOUR}
        HOURS_COUNT={HOURS_COUNT}
        ROW_PX={ROW_PX}
        HEADER_OFFSET_PX={WEEK_HEADER_PX}
      />

      <HourGuides count={HOURS_COUNT} rowPx={ROW_PX} headerOffset={WEEK_HEADER_PX} />

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
          const slotList = slotsByDay.get(dayKey) ?? [];

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
  <div className="pointer-events-none absolute inset-0 z-0">
    <div className="absolute inset-0 rounded-md bg-amber-50/40" />
    <div className="absolute right-2 top-2 z-0">
      <BankHolidayCell visible={true} title={holidayTitle} />
    </div>
  </div>
) : null}


                  {/* Turnos: por rol (default) o por empleado */}
                  <div className="relative z-10">
                  {shiftView === "role" ? (
                    <WeekShiftsByRole
                      dayKey={dayKey}
                      START_HOUR={START_HOUR}
                      HOURS_COUNT={HOURS_COUNT}
                      ROW_PX={ROW_PX}
                      shiftEvents={safeShiftEvents}
                      employeeNameById={employeeNameById}
                    />
                  ) : (
                    <WeekShiftsByEmployee
                      dayKey={dayKey}
                      START_HOUR={START_HOUR}
                      HOURS_COUNT={HOURS_COUNT}
                      ROW_PX={ROW_PX}
                      employeeNameById={employeeNameById}
                      shiftEvents={safeShiftEvents}
                    />
                  )}
                  </div>

                  {/* Overlay clicable por celda */}
                  {Array.from({ length: HOURS_COUNT }, (_, hourIndex) => {
                    const cellId = makeCellId(dayKey, hourIndex);
                    const isSelected = selectedCellId === cellId;

                    return (
                      <button
                        key={cellId}
                        type="button"
className={[
  "absolute left-0 right-0 rounded-md cursor-default",
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

                  {slotList.map((slot) => {
  const start = new Date(slot.startsAt);
  const end = new Date(slot.endsAt);

  const startMinutes = start.getHours() * 60 + start.getMinutes();
  const endMinutes = end.getHours() * 60 + end.getMinutes();

  const top = ((startMinutes - START_HOUR * 60) / 60) * ROW_PX;
  const height = ((endMinutes - startMinutes) / 60) * ROW_PX;

  if (height <= 0) return null;

  return (
    <div
      key={slot.id}
      className="absolute left-[6px] right-[6px] z-20 rounded-md border border-dashed border-[#0B6CF4]/55 bg-[#0B6CF4]/10 px-2 py-1"
      style={{
        top,
        height,
      }}
    >
      <div className="flex h-full min-w-0 flex-col justify-between">
        <div className="text-[11px] font-semibold text-[#0B6CF4]">
          Hueco disponible
        </div>

        <div className="flex min-w-0 flex-wrap gap-1">
          {slot.serviceName ? (
            <span className="inline-flex max-w-full items-center rounded-md border border-[#0B6CF4]/30 bg-white/80 px-1.5 py-0.5 text-[11px] font-medium text-slate-800">
              <span className="truncate">{slot.serviceName}</span>
            </span>
          ) : null}

          {slot.employeeName ? (
            <span className="inline-flex max-w-full items-center rounded-md border border-[#0B6CF4]/25 bg-white/70 px-1.5 py-0.5 text-[11px] font-medium text-slate-700">
              <span className="truncate">{slot.employeeName}</span>
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
})}

                  {/* Pills (citas) encima */}
                  {(() => {
                    const layout = layoutDayAppts(list, START_HOUR, ROW_PX);

                    return list.map((a) => {
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
<AppointmentBlock
  id={a.id}
  startAtISO={a.startAt}
  serviceName={a.serviceName}
  employeeName={a.employeeName}
  resourceName={a.resourceName}
  serviceColor={a.serviceColor}
  onSelect={onSelect}
  onEdit={onEdit}
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
