// app/components/calendar/calendar/CalendarGrid.tsx
"use client";

import { useEffect, useRef } from "react";
import WeekView from "@/app/components/calendar/calendar/WeekView";
import type {
  HolidayLite,
  CalendarAppt,
} from "@/app/components/calendar/calendar/types";
import { localKeyTZ } from "@/app/components/calendar/calendar/tz";

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
  employeeNameById?: (id: string) => string;
  START_HOUR: number;
  HOURS_COUNT: number;
  ROW_PX: number;

  holidays?: HolidayLite[];

  onCellClick?: (cellId: string) => void;
  selectedCellId?: string | null;

  // ✅ nuevo: cuando el usuario llega al final del scroll
  onReachEnd?: () => void;

  // ✅ nuevos
  apptsByDay?: Map<string, CalendarAppt[]>;
  shiftEvents?: ShiftEventLite[];
};

export default function CalendarGrid({
  days,
  employeeNameById,
  START_HOUR,
  HOURS_COUNT,
  ROW_PX,
  holidays,
  onCellClick,
  selectedCellId,
  onReachEnd,
  apptsByDay,
  shiftEvents,
}: Props) {
  function fallbackEmployeeNameById(id: string) {
    return id;
  }

  const nameFn = employeeNameById ? employeeNameById : fallbackEmployeeNameById;

  const canvasH = HOURS_COUNT * ROW_PX;
  const scrollerRef = useRef<HTMLDivElement | null>(null);

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

  function isWeekend(d: Date) {
    const day = d.getDay(); // 0 dom, 6 sáb
    return day === 0 || day === 6;
  }

  // evita disparar muchas veces mientras estás pegado abajo
  const reachEndLockRef = useRef(false);

  function handleScroll(e: React.UIEvent<HTMLDivElement>) {
    if (!onReachEnd) return;

    const el = e.currentTarget;
    const thresholdPx = 140;

    const remaining = el.scrollHeight - el.scrollTop - el.clientHeight;

    if (remaining <= thresholdPx) {
      if (reachEndLockRef.current) return;
      reachEndLockRef.current = true;
      onReachEnd();
      return;
    }

    // si el usuario se aleja del final, rearmamos el lock
    if (remaining > thresholdPx * 2) {
      reachEndLockRef.current = false;
    }
  }

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    const targetHour = 8;
    const top = (targetHour - START_HOUR) * ROW_PX;
    el.scrollTop = Math.max(0, top);
  }, [START_HOUR, ROW_PX]);

  const safeApptsByDay = apptsByDay ? apptsByDay : new Map<string, CalendarAppt[]>();
  const safeShiftEvents = shiftEvents ? shiftEvents : [];

  const cols = days.length;
  const headerGridCols = `64px repeat(${cols}, minmax(0,1fr))`;

  return (
    <div
      ref={scrollerRef}
      className="flex-1 min-h-0 overflow-auto"
      onScroll={handleScroll}
    >
      <div className="min-w-[900px]">
        {/* HEADER */}
        <div className="sticky top-0 z-30 bg-slate-50 border-b border-border">
          <div
            className="grid"
            style={{ gridTemplateColumns: headerGridCols }}
          >
            <div className="h-10 border-r border-border bg-white" />
            {days.map((d) => {
              const key = localKeyTZ(d);
              const label = fmt.format(d);
              const today = isToday(d);

              return (
                <div
                  key={key}
                  className={[
                    "h-10 px-2 flex items-center border-r border-border text-xs font-medium capitalize",
                    isWeekend(d) ? "bg-slate-100" : "bg-transparent",
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
            className="absolute inset-0 grid"
            style={{ gridTemplateColumns: headerGridCols }}
            aria-hidden
          >
            <div className="border-r border-border bg-white" />
            {days.map((d) => {
              const colKey = localKeyTZ(d);
              return (
                <div
                  key={colKey}
                  className={[
                    "relative border-r border-border",
                    isWeekend(d) ? "bg-slate-50" : "bg-white",
                  ].join(" ")}
                >
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

          {/* WeekView encima */}
          <div className="absolute inset-0">
            <WeekView
              days={days}
              apptsByDay={safeApptsByDay}
              START_HOUR={START_HOUR}
              HOURS_COUNT={HOURS_COUNT}
              ROW_PX={ROW_PX}
              holidays={holidays}
              employeeNameById={nameFn}
              onCellClick={onCellClick}
              selectedCellId={selectedCellId}
              shiftEvents={safeShiftEvents}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
