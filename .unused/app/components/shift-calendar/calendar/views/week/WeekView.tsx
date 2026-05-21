// app/components/shift-calendar/calendar/views/week/WeekView.tsx
"use client";

import { useMemo } from "react";
import PaintableGrid, {
  type PaintableCell,
} from "@/app/components/shift-calendar/calendar/PaintableGrid";
import WeekSlotCell from "@/app/components/shift-calendar/calendar/views/week/WeekCell";

import WeekDayHeaderRow from "@/app/components/shift-calendar/calendar/views/week/WeekDayHeaderRow";
import WeekTimeAxis from "@/app/components/shift-calendar/calendar/views/week/WeekTimeAxis";
import { getWeekDays } from "@/app/components/shift-calendar/calendar/views/week/getWeekDays";

import { getVisibleHourRange, type OpeningRange } from "@/app/components/shift-calendar/calendar/views/week/getVisibleHourRange";
import { openingHoursToRanges } from "@/app/components/shift-calendar/calendar/views/week/openingHoursToRanges";
import { Users } from "lucide-react";
import {
  groupDayKinds,
  kindLabelEs,
} from "@/app/components/shift-calendar/paint-manager";
import type { PaintState, BrushKind } from "@/app/components/shift-calendar/paint-manager";

function clampToDateOnlyISO(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.toISOString().slice(0, 10);
}

function isWeekend(d: Date) {
  const w = d.getDay();
  return w === 0 || w === 6;
}

// ticks cada 60 min dentro del rango visible
function buildHourTicks(startMin: number, endMin: number) {
  const s = Math.floor(startMin / 60) * 60;
  const e = Math.ceil(endMin / 60) * 60;

  const out: number[] = [];
  for (let t = s; t <= e; t += 60) out.push(t);
  return out;
}

type CellData = {
  dayKey: string;
  dayIndex: number;   // 0..6
  minute: number;     // tick start
  isClosed: boolean;
  isWeekend: boolean;
};

function makeCellId(dayKey: string, minute: number) {
  return `${dayKey}|${minute}`;
}

function parseCellId(id: string) {
  const parts = id.split("|");
  const dayKey = parts[0] || "";
  const minute = Number(parts[1] || "0");
  return { dayKey, minute };
}

export default function WeekView({
  selectedDay,

  openingHours,
  marginMinutes = 120,

  paint,
  brushKind,
  selectedEmployeeIds,
  onPaintSlot,
}: {
  selectedDay: Date;
  openingHours?: OpeningRange | null;
  marginMinutes?: number;

  paint: PaintState;
  brushKind: BrushKind;
  selectedEmployeeIds: string[];
  onPaintSlot: (dayKey: string, minute: number) => void;
}) {
  const weekDays = useMemo(() => getWeekDays(selectedDay), [selectedDay]);

  const dayHeaders = useMemo(() => {
    return weekDays.map((d) => {
      const key = clampToDateOnlyISO(d);
      const label = new Intl.DateTimeFormat("es-ES", {
        weekday: "short",
        day: "2-digit",
      })
        .format(d)
        .toUpperCase()
        .replace(".", "");
      return { key, label, isWeekend: isWeekend(d) };
    });
  }, [weekDays]);

  const dayKeys = useMemo(() => dayHeaders.map((d) => d.key), [dayHeaders]);

  const visible = useMemo(() => {
    return getVisibleHourRange(openingHours ?? null, marginMinutes);
  }, [openingHours, marginMinutes]);

  const ticks = useMemo(
    () => buildHourTicks(visible.startMin, visible.endMin),
    [visible]
  );

  const openRangesByDay = useMemo(() => {
    return openingHoursToRanges(openingHours ?? null);
  }, [openingHours]);

  function isClosedMinute(dayIndex: number, minute: number) {
    const ranges = openRangesByDay[dayIndex];
    if (!ranges || ranges.length === 0) return true;

    for (const r of ranges) {
      if (minute >= r.startMin && minute < r.endMin) return false;
    }
    return true;
  }

  // ✅ “habilitado” igual que Month: solo si hay empleados
  const enabled = selectedEmployeeIds.length > 0;

  const rowHeight = 56;

  const cells: Array<PaintableCell<CellData>> = useMemo(() => {
    const out: Array<PaintableCell<CellData>> = [];

    for (let dayIndex = 0; dayIndex < dayKeys.length; dayIndex++) {
      const dayKey = dayKeys[dayIndex];
      const weekend = Boolean(dayHeaders[dayIndex]?.isWeekend);

      for (const minute of ticks) {
        const id = makeCellId(dayKey, minute);
        const closed = isClosedMinute(dayIndex, minute);

        out.push({
          id,
          disabled: !enabled, // aquí de momento solo depende de empleados
          data: {
            dayKey,
            dayIndex,
            minute,
            isClosed: closed,
            isWeekend: weekend,
          },
        });
      }
    }

    return out;
  }, [dayKeys, dayHeaders, ticks, enabled]);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="grid grid-cols-[64px_1fr]">
        <WeekTimeAxis ticks={ticks} />

        <div className="overflow-auto">
          <WeekDayHeaderRow days={dayHeaders} />

          <PaintableGrid
            colCount={7}
            cells={cells}
            enabled={enabled}
            onPaint={(id) => {
              const parsed = parseCellId(id);
              if (!parsed.dayKey) return;
              onPaintSlot(parsed.dayKey, parsed.minute);
            }}
renderCell={(cell, handlers) => {
  const c = cell.data;

  return (
    <WeekSlotCell
      key={cell.id}
      id={cell.id}
      dayKey={c.dayKey}
      isClosed={c.isClosed}
      isWeekend={c.isWeekend}
      rowHeight={rowHeight}
      paint={paint}
      handlers={handlers}
    />
  );
}}



          />
        </div>
      </div>
    </div>
  );
}
