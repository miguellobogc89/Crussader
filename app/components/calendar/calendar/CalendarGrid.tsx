// app/components/calendar/calendar/CalendarGrid.tsx
"use client";

import type { PaintBlock } from "@/app/components/calendar/calendar/shiftPaintEngine";
import WeekView from "@/app/components/calendar/calendar/WeekView";
import type { CellPainter } from "@/hooks/calendar/useCellPainter";
import type { HolidayLite } from "@/app/components/calendar/calendar/types";

type PaintedAssignment = {
  employeeIds: string[];
  shiftLabel: string;
};

export default function CalendarGrid({
  days,
  blocks,
  employeeNameById,
  START_HOUR,
  HOURS_COUNT,
  ROW_PX,
  painter,

  // ✅ nuevos
  holidays,
  painted,
}: {
  days: Date[];
  blocks: PaintBlock[];
  employeeNameById?: (id: string) => string;
  START_HOUR: number;
  HOURS_COUNT: number;
  ROW_PX: number;
  painter: CellPainter | null;

  // ✅ nuevos
  holidays?: HolidayLite[];
  painted?: Map<string, PaintedAssignment>;
}) {
  function fallbackEmployeeNameById(id: string) {
    return id;
  }

  const nameFn = employeeNameById ? employeeNameById : fallbackEmployeeNameById;
  const WeekViewAny = WeekView as unknown as React.ComponentType<any>;

  const canvasH = HOURS_COUNT * ROW_PX;

  const fmt = new Intl.DateTimeFormat("es-ES", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  });

  function isToday(d: Date) {
    const now = new Date();
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    );
  }

  return (
    <div className="flex-1 min-h-0 overflow-auto">
      {/* HEADER */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-border">
        <div className="grid grid-cols-[64px_repeat(7,1fr)]">
          <div className="h-10 border-r border-border" />
          {days.map((d) => {
            const key = d.toISOString();
            const label = fmt.format(d);
            const today = isToday(d);

            return (
              <div
                key={key}
                className={[
                  "h-10 px-2 flex items-center border-r border-border text-xs font-medium capitalize",
                  today ? "text-slate-900" : "text-muted-foreground",
                ].join(" ")}
              >
                <span
                  className={[
                    "inline-flex items-center gap-2 truncate",
                    today ? "font-semibold" : "",
                  ].join(" ")}
                >
                  {today ? (
                    <span className="inline-block h-2 w-2 rounded-full bg-primary" />
                  ) : null}
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* CANVAS */}
      <div className="relative min-w-[900px]" style={{ height: canvasH }}>
        {/* grid visual base */}
        <div
          className="absolute inset-0 grid grid-cols-[64px_repeat(7,1fr)]"
          aria-hidden
        >
          <div className="border-r border-border bg-white" />

          {Array.from({ length: 7 }, (_, col) => {
            return (
              <div key={col} className="relative border-r border-border">
                {Array.from({ length: HOURS_COUNT }, (_, r) => {
                  return (
                    <div
                      key={r}
                      className="absolute left-0 right-0 border-b border-border"
                      style={{ top: (r + 1) * ROW_PX }}
                    />
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* WeekView real encima */}
        <div className="absolute inset-0">
          <WeekViewAny
            days={days}
            apptsByDay={new Map()}
            blocks={blocks}
            employeeNameById={nameFn}
            START_HOUR={START_HOUR}
            HOURS_COUNT={HOURS_COUNT}
            ROW_PX={ROW_PX}
            painter={painter}
            holidays={holidays}
            painted={painted}
          />
        </div>
      </div>
    </div>
  );
}
