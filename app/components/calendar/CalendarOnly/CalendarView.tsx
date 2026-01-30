// app/components/calendar/CalendarOnly/CalendarView.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import CalendarOnly from "@/app/components/calendar/CalendarOnly";
import { useCellPainter } from "@/hooks/calendar/useCellPainter";

import type { HolidayLite } from "@/app/components/calendar/CalendarOnly/types";

type View = "day" | "threeDays" | "workingWeek" | "week" | "month";

export type Range = { fromISO: string; toISO: string };

function dayBoundsLocalISO(d: Date) {
  const start = new Date(d);
  start.setHours(0, 0, 0, 0);
  const end = new Date(d);
  end.setHours(23, 59, 59, 999);
  return { fromISO: start.toISOString(), toISO: end.toISOString() };
}

function startOfWeekMon(d: Date) {
  const x = new Date(d);
  const day = x.getDay();
  const delta = day === 0 ? -6 : 1 - day;
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() + delta);
  return x;
}

type PaintedAssignment = {
  employeeIds: string[];
  shiftLabel: string;
};

export default function CalendarView({
  locationId,
  holidays = [],
  onRangeChange,

  paintedCellIds,
  onPaintCell,

  painted,
  employeeNameById,
  employeeColorById,
}: {
  locationId: string | null;
  holidays?: HolidayLite[];
  onRangeChange?: (r: Range) => void;

  paintedCellIds: Set<string>;
  onPaintCell: (cellId: string) => void;

  painted?: Map<string, PaintedAssignment>;
  employeeNameById?: (id: string) => string;
   employeeColorById?: (id: string) => string | null;
}) {
  // ✅ CLAVE: painter CONTROLADO -> al pintar llama a onPaintCell (upsertPaint del Shell)
  const painter = useCellPainter({
    paintedCellIds,
    onPaintCell,
  });

  const [selectedView, setSelectedView] = useState<View>("week");
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());

  const range = useMemo<Range>(() => {
    if (selectedView === "month") {
      const first = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
      const last = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
      first.setHours(0, 0, 0, 0);
      last.setHours(23, 59, 59, 999);
      return { fromISO: first.toISOString(), toISO: last.toISOString() };
    }

    if (selectedView === "week" || selectedView === "workingWeek") {
      const start = startOfWeekMon(selectedDate);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      return { fromISO: start.toISOString(), toISO: end.toISOString() };
    }

    if (selectedView === "threeDays") {
      const start = new Date(selectedDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 2);
      end.setHours(23, 59, 59, 999);
      return { fromISO: start.toISOString(), toISO: end.toISOString() };
    }

    return dayBoundsLocalISO(selectedDate);
  }, [selectedView, selectedDate]);

  const rangeKey = useMemo(() => `${range.fromISO}|${range.toISO}`, [range.fromISO, range.toISO]);

  useEffect(() => {
    if (!locationId) return;
    if (!onRangeChange) return;
    onRangeChange(range);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationId, rangeKey]);

  const blocked = !locationId;

  return (
    <div className="flex-1 min-w-0 flex flex-col h-full">
      <div className="relative flex-1 min-h-0 bg-white border border-border rounded-xl overflow-hidden">
        <div className="absolute inset-0 overflow-auto">
          <div className="h-full min-h-0 flex flex-col p-3">
            {blocked ? (
              <div className="h-full w-full flex items-center justify-center text-sm text-muted-foreground">
                Selecciona una ubicación
              </div>
            ) : (
              <CalendarOnly
                selectedView={selectedView}
                onChangeView={(v: View) => setSelectedView(v)}
                selectedDate={selectedDate}
                onChangeDate={(d: Date) => setSelectedDate(d)}
                appointments={[]}
                painter={painter}
                holidays={holidays}
                painted={painted}
                employeeNameById={employeeNameById}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
