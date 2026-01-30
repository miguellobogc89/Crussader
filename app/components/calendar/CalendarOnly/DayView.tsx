// app/components/calendar/CalendarOnly/DayView.tsx
"use client";

import AppointmentPill from "@/app/components/calendar/AppointmentPill";
import BankHolidayCell from "@/app/components/calendar/CalendarOnly/BankHolidayCell";
import CurrentTimeLineFullSpan from "./CurrentTimeLineFullSpan";
import HourGuides from "./HourGuides";
import { layoutDayAppts, COL_GAP_PX } from "./layout";
import type { CalendarAppt, HolidayLite } from "./types";
import { localKeyTZ } from "./tz";
import type { CellPainter } from "@/hooks/calendar/useCellPainter";

type PaintedAssignment = {
  employeeIds: string[];
  shiftLabel: string;
};

type Props = {
  date: Date;
  appts: CalendarAppt[];
  onSelect?: (id: string) => void;
  onEdit?: (id: string) => void;
  START_HOUR: number;
  HOURS_COUNT: number;
  ROW_PX: number;

  painter: CellPainter;

  holidays?: HolidayLite[];

  // ✅ para mostrar “empleado arriba / turno abajo” sin repetir por hora
  painted?: Map<string, PaintedAssignment>;
  employeeNameById?: (id: string) => string;
};

function assignmentSig(a: PaintedAssignment) {
  const ids = [...a.employeeIds].sort().join(",");
  return `${a.shiftLabel}|${ids}`;
}

function getEmpName(id: string, employeeNameById?: (id: string) => string) {
  if (!employeeNameById) return id;
  const name = employeeNameById(id);
  if (!name) return id;
  return name;
}

export default function DayView({
  date,
  appts,
  onSelect,
  onEdit,
  START_HOUR,
  HOURS_COUNT,
  ROW_PX,
  painter,
  holidays = [],
  painted,
  employeeNameById,
}: Props) {
  const hours = Array.from({ length: HOURS_COUNT }, (_, i) => START_HOUR + i);

  const dayKey = localKeyTZ(date);
  const makeCellId = (hourIndex: number) => `${dayKey}|${hourIndex}`;

  const holidayList = (holidays ?? []).filter(
    (h) => localKeyTZ(new Date(h.date)) === dayKey
  );
  const isHoliday = holidayList.length > 0;
  const holidayTitle = holidayList.map((x) => x.name).join(" · ");

  // ✅ construye bloques continuos (mismo turno+empleados) para renderizar 1 sola vez
  const blocks: Array<{
    top: number;
    height: number;
    employeeLine: string;
    shiftLine: string;
  }> = [];

  if (painted) {
    let i = 0;
    while (i < HOURS_COUNT) {
      const cellId = makeCellId(i);
      const a = painted.get(cellId);

      if (!a) {
        i += 1;
        continue;
      }

      const sig = assignmentSig(a);

      let j = i + 1;
      while (j < HOURS_COUNT) {
        const next = painted.get(makeCellId(j));
        if (!next) break;
        if (assignmentSig(next) !== sig) break;
        j += 1;
      }

      const names = a.employeeIds.map((id) => getEmpName(id, employeeNameById));
      blocks.push({
        top: i * ROW_PX,
        height: (j - i) * ROW_PX,
        employeeLine: names.join(", "),
        shiftLine: a.shiftLabel,
      });

      i = j;
    }
  }

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
            <div
              key={h}
              className="h-16 text-xs text-muted-foreground flex items-start pt-0.5"
            >
              {String(h).padStart(2, "0")}:00
            </div>
          ))}
        </div>

        {/* Lienzo */}
        <div className="relative" style={{ height: HOURS_COUNT * ROW_PX }}>
          {/* Festivo (banda sutil, no interactiva) */}
          {isHoliday ? (
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute inset-0 rounded-md bg-amber-50/40" />
              <div className="absolute right-2 top-2">
                <BankHolidayCell visible={true} title={holidayTitle} />
              </div>
            </div>
          ) : null}

          {/* Overlay pintable por celda */}
          {Array.from({ length: HOURS_COUNT }, (_, hourIndex) => {
            const cellId = makeCellId(hourIndex);
            const className = painter.getOverlayClass(cellId);
            const handlers = painter.getCellHandlers(cellId);

            return (
              <div
                key={cellId}
                className={className}
                style={{ top: hourIndex * ROW_PX, height: ROW_PX }}
                {...handlers}
              />
            );
          })}

          {/* ✅ Bloques “Empleado arriba / Turno abajo” (1 por tramo continuo) */}
          {blocks.map((b, idx) => (
            <div
              key={`${dayKey}|block|${idx}`}
              className="pointer-events-none absolute left-1 right-1 rounded-md bg-slate-900/5 ring-1 ring-black/5"
              style={{ top: b.top + 6, height: Math.max(22, b.height - 12) }}
            >
              <div className="px-2 py-1">
                <div className="truncate text-[11px] font-medium text-slate-800">
                  {b.employeeLine}
                </div>
                <div className="truncate text-[11px] text-slate-600">
                  {b.shiftLine}
                </div>
              </div>
            </div>
          ))}

          {/* Pills (citas) encima */}
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
}
