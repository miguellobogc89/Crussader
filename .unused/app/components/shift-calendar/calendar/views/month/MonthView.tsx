// app/components/shift-calendar/calendar/views/month/MonthView.tsx
"use client";

import { useMemo } from "react";
import PaintableGrid, {
  type PaintableCell,
} from "@/app/components/shift-calendar/calendar/PaintableGrid";
import MonthDayCell from "@/app/components/shift-calendar/calendar/views/month/MonthDayCell";

import type {
  PaintState,
  BrushKind,
} from "@/app/components/shift-calendar/paint-manager";

type Holiday = {
  id: string;
  date: string;
  name: string;
  isClosed: boolean;
  locationId?: string | null;
};

function clampToDateOnlyISO(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.toISOString().slice(0, 10);
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function normalizeClosedKeys(
  closedDayKeys: Set<string> | string[] | undefined
): Set<string> {
  if (!closedDayKeys) return new Set<string>();
  if (closedDayKeys instanceof Set) return closedDayKeys;
  return new Set(closedDayKeys.map((x) => String(x).slice(0, 10)));
}

export default function MonthView({
  days,
  anchorDate,
  selectedDay,
  onSelectDay,
  holidaysByDay,
  closedDayKeys,

  paint,
  brushKind,
  selectedEmployeeIds,
  onPaintDay,
}: {
  days: Date[]; // 42
  anchorDate: Date;
  selectedDay: Date;
  onSelectDay: (d: Date) => void;
  holidaysByDay: Map<string, Holiday[]>;
  closedDayKeys?: Set<string> | string[];

  paint: PaintState;
  brushKind: BrushKind;
  selectedEmployeeIds: string[];
  onPaintDay: (dayKey: string) => void;
}) {
  const closedSet = useMemo(() => normalizeClosedKeys(closedDayKeys), [closedDayKeys]);

  // ✅ painting enabled only if you have employees selected (and brush is not "NONE")
  const enabled = selectedEmployeeIds.length > 0;


  type CellData = {
    date: Date;
    dayKey: string;
    inMonth: boolean;
    isToday: boolean;
    isSelected: boolean;
    holidays: Holiday[];
    isClosed: boolean;
  };

  const cells: Array<PaintableCell<CellData>> = useMemo(() => {
    return days.map((d) => {
      const inMonth = d.getMonth() === anchorDate.getMonth();
      const isToday = isSameDay(d, new Date());
      const isSelected = isSameDay(d, selectedDay);
      const dayKey = clampToDateOnlyISO(d);
      const holidays = holidaysByDay.get(dayKey) ?? [];
      const isClosed = inMonth && closedSet.has(dayKey);

      return {
        id: dayKey,
        disabled: !inMonth || selectedEmployeeIds.length === 0,
        data: { date: d, dayKey, inMonth, isToday, isSelected, holidays, isClosed },
      };
    });
  }, [days, anchorDate, selectedDay, holidaysByDay, closedSet, selectedEmployeeIds.length]);

  return (
    <PaintableGrid
      colCount={7}
      cells={cells}
      enabled={enabled}
      onPaint={(id) => {
        // ✅ Your page decides if it's erase or apply; we keep it simple:
        onPaintDay(id);
      }}
      renderCell={(cell, handlers) => {
        const c = cell.data;
        return (
          <MonthDayCell
            key={cell.id}
            id={cell.id}
            date={c.date}
            inMonth={c.inMonth}
            isToday={c.isToday}
            isSelected={c.isSelected}
            isClosed={c.isClosed}
            holidays={c.holidays}
            paint={paint}
            handlers={handlers}
            onSelectDay={onSelectDay}
          />
        );
      }}
    />
  );
}
