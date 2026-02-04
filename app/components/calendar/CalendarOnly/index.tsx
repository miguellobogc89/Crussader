// app/components/calendar/CalendarOnly/index.tsx
"use client";

import { useMemo } from "react";

import CalendarToolbar from "@/app/components/calendar/CalendarOnly/CalendarToolbar";
import CalendarGrid from "@/app/components/calendar/CalendarOnly/CalendarGrid";

import type { PaintBlock } from "@/app/components/calendar/CalendarOnly/shiftPaintEngine";

type View = "week";
type ToolbarView = "day" | "threeDays" | "workingWeek" | "week" | "month";

const START_HOUR = 8;
const HOURS_COUNT = 12;
const ROW_PX = 64;

function startOfWeekMon(d: Date) {
  const x = new Date(d);
  const day = x.getDay();
  const delta = day === 0 ? -6 : 1 - day;
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() + delta);
  return x;
}

function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export default function CalendarOnly({
  selectedView,
  onChangeView,
  selectedDate,
  onChangeDate,
  blocks,
  employeeNameById,
}: {
  selectedView: View;
  onChangeView: (v: View) => void;

  selectedDate: Date;
  onChangeDate: (d: Date) => void;

  blocks: PaintBlock[];
  employeeNameById?: (id: string) => string;
}) {
  const view: View = "week";

  const weekStart = useMemo(() => startOfWeekMon(selectedDate), [selectedDate]);

  const weekDays = useMemo(() => {
    const out: Date[] = [];
    for (let i = 0; i < 7; i += 1) out.push(addDays(weekStart, i));
    return out;
  }, [weekStart]);

  const monthTitle = useMemo(() => {
    const fmt = new Intl.DateTimeFormat("es-ES", {
      month: "long",
      year: "numeric",
    });
    const s = fmt.format(selectedDate);
    return s.charAt(0).toUpperCase() + s.slice(1);
  }, [selectedDate]);

  function goPrev() {
    onChangeDate(addDays(selectedDate, -7));
  }

  function goNext() {
    onChangeDate(addDays(selectedDate, 7));
  }

  function goToday() {
    onChangeDate(new Date());
  }

  function jumpToMonth(year: number, monthIndex: number) {
    const d = new Date(selectedDate);
    d.setFullYear(year);
    d.setMonth(monthIndex);
    d.setDate(1);
    onChangeDate(d);
  }

  // Toolbar usa union grande: aceptamos eso y forzamos week.
  function handleChangeView(_v: ToolbarView) {
    if (selectedView !== "week") onChangeView("week");
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="shrink-0">
        <CalendarToolbar
          view={view as ToolbarView}
          monthTitle={monthTitle}
          selectedDate={selectedDate}
          onPrev={goPrev}
          onNext={goNext}
          onToday={goToday}
          onChangeView={handleChangeView}
          onJumpToMonth={jumpToMonth}
        />
      </div>

      <div className="flex-1 min-h-0">
        <CalendarGrid
          days={weekDays}
          blocks={blocks}
          employeeNameById={employeeNameById}
          START_HOUR={START_HOUR}
          HOURS_COUNT={HOURS_COUNT}
          ROW_PX={ROW_PX}
        />
      </div>
    </div>
  );
}
