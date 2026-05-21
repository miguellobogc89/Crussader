// app/components/shift-calendar/calendar/Calendar.tsx
"use client";

import { Card } from "@/app/components/ui/card";
import WeekView from "@/app/components/shift-calendar/calendar/views/week/WeekView";
import WorkingWeekView from "@/app/components/shift-calendar/calendar/views/working-week/WorkingWeekView";
import MonthView from "@/app/components/shift-calendar/calendar/views/month/MonthView";

import type { PaintState, BrushKind } from "@/app/components/shift-calendar/paint-manager";

type Holiday = {
  id: string;
  date: string;
  name: string;
  isClosed: boolean;
  locationId?: string | null;
};

export type CalendarViewMode = "1d" | "3d" | "1w" | "ww" | "1m" | "3m" | "1y";

export default function Calendar({
  // month inputs (los mantengo para no romperte callers aunque ya no uses headers globales)
  weekHeaders,
  days,
  anchorDate,
  selectedDay,
  onSelectDay,
  holidaysByDay,
  closedDayKeys,

  // view
  viewMode,

  // paint
  paint,
  brushKind,
  selectedEmployeeIds,
  onPaintDay,

  // extras que ya estabas pasando desde la page
  onRotateDay,
  brushEnabled = true,
  openingHoursRaw,
}: {
  weekHeaders: string[];
  days: Date[];
  anchorDate: Date;
  selectedDay: Date;
  onSelectDay: (d: Date) => void;
  holidaysByDay: Map<string, Holiday[]>;
  closedDayKeys?: Set<string> | string[];

  viewMode: CalendarViewMode;

  paint: PaintState;
  brushKind: BrushKind;
  selectedEmployeeIds: string[];
  onPaintDay: (dayKey: string) => void;

  // ✅ props extra (para que compile)
  onRotateDay?: (dayKey: string) => void;
  brushEnabled?: boolean;
  openingHoursRaw?: any;
}) {
  return (
    <Card className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div>
        {viewMode === "1m" ? (
          <MonthView
            days={days}
            anchorDate={anchorDate}
            selectedDay={selectedDay}
            onSelectDay={onSelectDay}
            holidaysByDay={holidaysByDay}
            closedDayKeys={closedDayKeys}
            paint={paint}
            brushKind={brushKind}
            selectedEmployeeIds={selectedEmployeeIds}
            onPaintDay={onPaintDay}
          />
        ) : viewMode === "ww" ? (
          <WorkingWeekView
            selectedDay={selectedDay}
            openingHours={openingHoursRaw ?? null}
            paint={paint}
            brushKind={brushKind}
            selectedEmployeeIds={selectedEmployeeIds}
            onPaintSlot={(dayKey, minute) => {
              onPaintDay(`${dayKey}|${minute}`);
            }}
          />
        ) : viewMode === "1w" ? (
          <WeekView
            selectedDay={selectedDay}
            openingHours={openingHoursRaw ?? null}
            paint={paint}
            brushKind={brushKind}
            selectedEmployeeIds={selectedEmployeeIds}
            onPaintSlot={(dayKey, minute) => {
              onPaintDay(`${dayKey}|${minute}`);
            }}
          />
        ) : (
          <div className="p-6 text-sm text-slate-500">
            Vista {viewMode} pendiente de migrar.
          </div>
        )}
      </div>
    </Card>
  );
}
