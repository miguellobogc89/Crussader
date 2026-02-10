// app/components/calendar/calendar/index.tsx
"use client";

import { useMemo, useState } from "react";

import CalendarToolbar from "@/app/components/calendar/calendar/CalendarToolbar";
import CalendarGrid from "@/app/components/calendar/calendar/CalendarGrid";
import DayView from "@/app/components/calendar/calendar/DayView";
import MonthView from "@/app/components/calendar/calendar/MonthView";

import type {
  HolidayLite,
  CalendarAppt,
} from "@/app/components/calendar/calendar/types";

type View = "day" | "week" | "month";
type ToolbarView = "day" | "threeDays" | "workingWeek" | "week" | "month";

const START_HOUR = 0;
const HOURS_COUNT = 24;
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

type ShiftEventLite = {
  id: string;
  employeeId: string | null;
  locationId: string | null;
  startAt: string; // ISO
  endAt: string; // ISO
  kind: string;
  label: string | null;
  templateId: string | null;
};

type Props = {
  selectedDate: Date;
  onChangeDate: (d: Date) => void;

  employeeNameById?: (id: string) => string;
  employeeColorById?: (id: string) => string | null;

  holidays?: HolidayLite[];

  onCellClick?: (cellId: string) => void;
  selectedCellId?: string | null;

  apptsByDay?: Map<string, CalendarAppt[]>;
  apptsForDay?: CalendarAppt[];
  apptsForMonth?: CalendarAppt[];

  // ✅ nuevo
  shiftEvents?: ShiftEventLite[];
};

export default function CalendarOnly({
  selectedDate,
  onChangeDate,
  employeeNameById,
  employeeColorById,
  holidays,
  onCellClick,
  selectedCellId,
  apptsByDay,
  apptsForDay,
  apptsForMonth,
  shiftEvents,
}: Props) {
  const [view, setView] = useState<View>("week");

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
    if (view === "month") {
      const d = new Date(selectedDate);
      d.setMonth(d.getMonth() - 1);
      d.setDate(1);
      onChangeDate(d);
      return;
    }

    if (view === "day") {
      onChangeDate(addDays(selectedDate, -1));
      return;
    }

    onChangeDate(addDays(selectedDate, -7));
  }

  function goNext() {
    if (view === "month") {
      const d = new Date(selectedDate);
      d.setMonth(d.getMonth() + 1);
      d.setDate(1);
      onChangeDate(d);
      return;
    }

    if (view === "day") {
      onChangeDate(addDays(selectedDate, 1));
      return;
    }

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

  function handleChangeView(v: ToolbarView) {
    if (v === "day") {
      setView("day");
      return;
    }

    if (v === "month") {
      setView("month");
      return;
    }

    // por ahora: todo lo demás cae en week (incluye threeDays/workingWeek)
    setView("week");
  }

  void employeeColorById;

  const weekApptsByDay = apptsByDay ? apptsByDay : new Map<string, CalendarAppt[]>();
  const dayAppts = apptsForDay ? apptsForDay : [];
  const monthAppts = apptsForMonth ? apptsForMonth : [];
  const safeShiftEvents = shiftEvents ? shiftEvents : [];

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="shrink-0 px-3 py-2 border-b border-border bg-white">
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

      <div className="flex-1 min-h-0 px-3 pb-3 pt-0 flex flex-col">
        {view === "week" ? (
          <CalendarGrid
            days={weekDays}
            employeeNameById={employeeNameById}
            START_HOUR={START_HOUR}
            HOURS_COUNT={HOURS_COUNT}
            ROW_PX={ROW_PX}
            holidays={holidays}
            onCellClick={onCellClick}
            selectedCellId={selectedCellId}
            onReachEnd={() => {
              onChangeDate(addDays(selectedDate, 7));
            }}
            apptsByDay={weekApptsByDay}
            shiftEvents={safeShiftEvents}
          />
        ) : null}

        {view === "day" ? (
          <div className="h-full min-h-0 overflow-auto">
            <DayView
              date={selectedDate}
              appts={dayAppts}
              START_HOUR={START_HOUR}
              HOURS_COUNT={HOURS_COUNT}
              ROW_PX={ROW_PX}
              holidays={holidays}
              onCellClick={onCellClick}
              selectedCellId={selectedCellId}
            />
          </div>
        ) : null}

        {view === "month" ? (
          <div className="h-full min-h-0 overflow-auto">
            <MonthView
              anchor={selectedDate}
              appts={monthAppts}
              holidays={holidays}
              onCellClick={onCellClick}
              selectedCellId={selectedCellId}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
