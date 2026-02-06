// app/components/calendar/calendar/CalendarView.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import CalendarOnly from "@/app/components/calendar/calendar";

import type { HolidayLite } from "@/app/components/calendar/calendar/types";
import type { PaintBlock } from "@/app/components/calendar/calendar/shiftPaintEngine";
import { useCellPainter, type CellPainter } from "@/hooks/calendar/useCellPainter";

export type Range = { fromISO: string; toISO: string };

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

type Props = {
  locationId: string | null;
  holidays?: HolidayLite[];
  onRangeChange?: (r: Range) => void;

  employeeNameById?: (id: string) => string;
  employeeColorById?: (id: string) => string | null;

  blocks?: PaintBlock[];

  // ✅ nuevo (para pintar desde el motor, sin que Shell toque el grid)
  onPaintCell?: (cellId: string) => void;

  // ✅ opcional: overlays por celda (tu Week/Day ya lo usan)
  painted?: Map<string, PaintedAssignment>;
};

export default function CalendarView({
  locationId,
  holidays,
  onRangeChange,
  employeeNameById,
  blocks,
  onPaintCell,
  painted,
}: Props) {
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());

  const range = useMemo<Range>(() => {
    const start = startOfWeekMon(selectedDate);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return { fromISO: start.toISOString(), toISO: end.toISOString() };
  }, [selectedDate]);

  const rangeKey = useMemo(() => `${range.fromISO}|${range.toISO}`, [range]);

  useEffect(() => {
    if (!locationId) return;
    if (!onRangeChange) return;
    onRangeChange(range);
  }, [locationId, rangeKey, onRangeChange, range]);

  const blocked = !locationId;

  // ✅ el painter vive aquí (CalendarView), no en Shell
  const painter: CellPainter | null = useMemo(() => {
    if (!onPaintCell) return null;
    return useCellPainter(onPaintCell);
  }, [onPaintCell]);

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
                selectedView={"week"}
                onChangeView={(_v: "week") => {}}
                selectedDate={selectedDate}
                onChangeDate={(d: Date) => setSelectedDate(d)}
                blocks={Array.isArray(blocks) ? blocks : []}
                employeeNameById={employeeNameById}
                holidays={holidays}
                painter={painter}
                painted={painted}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
