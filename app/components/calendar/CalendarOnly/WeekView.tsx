// app/components/calendar/CalendarOnly/WeekView.tsx
"use client";

import AppointmentPill from "@/app/components/calendar/AppointmentPill";
import BankHolidayCell from "@/app/components/calendar/CalendarOnly/BankHolidayCell";
import CurrentTimeLineFullSpan from "./CurrentTimeLineFullSpan";
import HourGuides from "./HourGuides";
import { layoutDayAppts, COL_GAP_PX } from "./layout";
import { localKeyTZ } from "./tz";
import type { CalendarAppt, HolidayLite } from "./types";
import type { CellPainter } from "@/hooks/calendar/useCellPainter";

type PaintedAssignment = {
  employeeIds: string[];
  shiftLabel: string;
};

type Props = {
  days: Date[];
  apptsByDay: Map<string, CalendarAppt[]>;
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

export default function WeekView({
  days,
  apptsByDay,
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
  const WEEK_HEADER_PX = 40;

  const makeCellId = (dayKey: string, hourIndex: number) =>
    `${dayKey}|${hourIndex}`;

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
        className="grid h-full gap-2"
        style={{
          gridTemplateColumns: `64px repeat(${days.length}, minmax(0,1fr))`,
        }}
      >
        {/* Columna horas */}
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

        {days.map((d) => {
          const dayKey = localKeyTZ(d);
          const list = apptsByDay.get(dayKey) ?? [];

          const holidayList = holidays.filter(
            (h) => localKeyTZ(new Date(h.date)) === dayKey
          );
          const isHoliday = holidayList.length > 0;
          const holidayTitle = holidayList.map((h) => h.name).join(" · ");

          // ✅ bloques continuos por día (mismo turno+empleados) -> 1 solo render
          const blocks: Array<{
            top: number;
            height: number;
            employeeLine: string;
            shiftLine: string;
          }> = [];

          if (painted) {
            let i = 0;
            while (i < HOURS_COUNT) {
              const cellId = makeCellId(dayKey, i);
              const a = painted.get(cellId);

              if (!a) {
                i += 1;
                continue;
              }

              const sig = assignmentSig(a);

              let j = i + 1;
              while (j < HOURS_COUNT) {
                const next = painted.get(makeCellId(dayKey, j));
                if (!next) break;
                if (assignmentSig(next) !== sig) break;
                j += 1;
              }

              const names = a.employeeIds.map((id) =>
                getEmpName(id, employeeNameById)
              );

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
                  {/* Festivo (banda sutil por día) */}
                  {isHoliday ? (
                    <div className="pointer-events-none absolute inset-0">
                      <div className="absolute inset-0 rounded-md bg-amber-50/40" />
                      <div className="absolute right-2 top-2">
                        <BankHolidayCell visible={true} title={holidayTitle} />
                      </div>
                    </div>
                  ) : null}

                  {/* overlays pintables */}
                  {Array.from({ length: HOURS_COUNT }, (_, hourIndex) => {
                    const cellId = makeCellId(dayKey, hourIndex);
                    const className = painter.getOverlayClass(cellId);
                    const handlers = painter.getCellHandlers(cellId);

                    return (
                      <div
                        key={cellId}
                        className={className}
                        style={{
                          top: hourIndex * ROW_PX,
                          height: ROW_PX,
                        }}
                        {...handlers}
                      />
                    );
                  })}

                  {/* ✅ Bloques “Empleado arriba / Turno abajo” */}
                  {blocks.map((b, idx) => (
                    <div
                      key={`${dayKey}|block|${idx}`}
                      className="pointer-events-none absolute left-1 right-1 rounded-md bg-slate-900/5 ring-1 ring-black/5"
                      style={{
                        top: b.top + 6,
                        height: Math.max(22, b.height - 12),
                      }}
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

                  {/* pills */}
                  {(() => {
                    const layout = layoutDayAppts(list, START_HOUR, ROW_PX);
                    return list.map((a) => {
                      const L = layout.get(a.id)!;
                      const widthStyle = `calc(${L.widthPct}% - ${COL_GAP_PX}px)`;
                      const leftStyle = `calc(${L.leftPct}% + ${
                        COL_GAP_PX / 2
                      }px)`;

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
