// app/components/calendar/calendar/index.tsx
"use client";

import { useMemo, useState } from "react";
import CalendarToolbar from "./header/CalendarToolbar";
import type { CalendarToolbarView } from "./header/CalendarViewSelector";
import CalendarGrid from "./grid/CalendarGrid";
import MonthView from "./MonthView";

import type { CalendarAppt } from "./types";

type ToolbarView = CalendarToolbarView;

const DEFAULT_START_HOUR = 10;
const DEFAULT_END_HOUR = 21;
const ROW_PX = 104;

type Props = {
  view: ToolbarView;
  onChangeView: (v: ToolbarView) => void;
  selectedDate: Date;
  onChangeDate: (d: Date) => void;
  onCellClick?: (cellId: string) => void;
  selectedCellId?: string | null;
  apptsByDay?: Map<string, CalendarAppt[]>;
  apptsForMonth?: CalendarAppt[];
  onAppointmentSelect?: (id: string) => void;
  onCreateAppointment?: () => void;
  visibleStartHour: number;
visibleEndHour: number;
onChangeVisibleHours: (startHour: number, endHour: number) => void;
};

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
  view,
  onChangeView,
  selectedDate,
  onChangeDate,
  onCellClick,
  selectedCellId,
  apptsByDay,
  apptsForMonth,
  onAppointmentSelect,
  onCreateAppointment,
    visibleStartHour,
  visibleEndHour,
  onChangeVisibleHours,
  
}: Props) {

  const hoursCount = Math.max(
    1,
    visibleEndHour - visibleStartHour
  );


  const weekStart = useMemo(
    () => startOfWeekMon(selectedDate),
    [selectedDate]
  );

  const days = useMemo(() => {
    if (view === "day") {
      return [new Date(selectedDate)];
    }

    if (view === "threeDays") {
      return [
        addDays(selectedDate, 0),
        addDays(selectedDate, 1),
        addDays(selectedDate, 2),
      ];
    }

    if (view === "workingWeek") {
      return Array.from({ length: 5 }, (_, i) => addDays(weekStart, i));
    }

    if (view === "week") {
      return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    }

    return [];
  }, [view, selectedDate, weekStart]);

  const rangeTitle = useMemo(() => {
    const fmtMonth = new Intl.DateTimeFormat("es-ES", {
      month: "long",
      year: "numeric",
    });

    if (view === "month") {
      const s = fmtMonth.format(selectedDate);
      return s.charAt(0).toUpperCase() + s.slice(1);
    }

    if (view === "day") {
      return selectedDate.toLocaleDateString("es-ES", {
        weekday: "long",
        day: "numeric",
        month: "long",
      });
    }

    const endDate = days[days.length - 1] ?? selectedDate;

    return `${days[0]?.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
    })} - ${endDate.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })}`;
  }, [view, selectedDate, days]);

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

    if (view === "threeDays") {
      onChangeDate(addDays(selectedDate, -3));
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

    if (view === "threeDays") {
      onChangeDate(addDays(selectedDate, 3));
      return;
    }

    onChangeDate(addDays(selectedDate, 7));
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b border-border bg-white px-3 py-2">
        <CalendarToolbar
          view={view}
          rangeTitle={rangeTitle}
          onPrev={goPrev}
          onNext={goNext}
          onToday={() => onChangeDate(new Date())}
          onChangeView={onChangeView}
          onCreateAppointment={onCreateAppointment}
          visibleStartHour={visibleStartHour}
          visibleEndHour={visibleEndHour}
          onChangeVisibleHours={onChangeVisibleHours}
        />
      </div>

      <div className="flex flex-1 min-h-0 flex-col px-3 pb-3">
        {view !== "month" ? (
          <CalendarGrid
            days={days}
            START_HOUR={visibleStartHour}
            HOURS_COUNT={hoursCount}
            ROW_PX={ROW_PX}
            onCellClick={onCellClick}
            selectedCellId={selectedCellId}
            onAppointmentSelect={onAppointmentSelect}
            apptsByDay={apptsByDay ?? new Map()}
          />
        ) : (
          <MonthView
            anchor={selectedDate}
            appts={apptsForMonth ?? []}
            onCellClick={onCellClick}
            selectedCellId={selectedCellId}
          />
        )}
      </div>
    </div>
  );
}