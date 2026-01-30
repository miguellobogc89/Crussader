"use client";

import { useEffect, useMemo, useState } from "react";

import CalendarToolbar from "@/app/components/calendar/CalendarOnly/CalendarToolbar";
import CalendarGrid from "@/app/components/calendar/CalendarOnly/CalendarGrid";

import { localKeyTZ } from "@/app/components/calendar/CalendarOnly/tz";

import type { CalendarAppt } from "@/app/components/calendar/CalendarOnly/types";
import type { CellPainter } from "@/hooks/calendar/useCellPainter";
import type { HolidayLite } from "@/app/components/calendar/CalendarOnly/types";

type View = "day" | "threeDays" | "workingWeek" | "week" | "month";

type PaintedAssignment = {
  employeeIds: string[];
  shiftLabel: string;
};

type Props = {
  selectedView: View;
  onChangeView: (v: View) => void;
  selectedDate: Date;
  onChangeDate: (d: Date) => void;

  appointments?: CalendarAppt[];
  onSelectAppointment?: (id: string) => void;
  onEditAppointmentId?: (id: string) => void;

  painter: CellPainter;
  holidays?: HolidayLite[];

  paintedCellIds?: Set<string>;
  onPaintCell?: (cellId: string) => void;

  employeeNameById?: (id: string) => string;
  employeeColorById?: (id: string) => string | null;

  painted?: Map<string, PaintedAssignment>;
};

export default function CalendarOnly({
  selectedView,
  onChangeView,
  selectedDate,
  onChangeDate,
  appointments = [],
  onSelectAppointment,
  onEditAppointmentId,
  painter,
  holidays = [],

  paintedCellIds,
  onPaintCell,

  painted,
  employeeNameById,
  employeeColorById,
}: Props) {
  const [view, setView] = useState<View>(selectedView);

  useEffect(() => {
    setView(selectedView);
  }, [selectedView]);

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

  function sameDayTZ(a: Date, b: Date) {
    return localKeyTZ(a) === localKeyTZ(b);
  }

  const weekStart = useMemo(() => startOfWeekMon(selectedDate), [selectedDate]);

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  const workingWeekDays = useMemo(
    () => Array.from({ length: 5 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  const threeDays = useMemo(
    () => Array.from({ length: 3 }, (_, i) => addDays(selectedDate, i)),
    [selectedDate]
  );

  function goPrev() {
    const d = new Date(selectedDate);

    if (view === "day") d.setDate(d.getDate() - 1);
    else if (view === "threeDays") d.setDate(d.getDate() - 3);
    else if (view === "week" || view === "workingWeek") d.setDate(d.getDate() - 7);
    else d.setMonth(d.getMonth() - 1);

    onChangeDate(d);
  }

  function goNext() {
    const d = new Date(selectedDate);

    if (view === "day") d.setDate(d.getDate() + 1);
    else if (view === "threeDays") d.setDate(d.getDate() + 3);
    else if (view === "week" || view === "workingWeek") d.setDate(d.getDate() + 7);
    else d.setMonth(d.getMonth() + 1);

    onChangeDate(d);
  }

  function goToday() {
    const now = new Date();
    onChangeDate(new Date(now.getFullYear(), now.getMonth(), now.getDate()));
  }

  function handleChangeView(v: View) {
    setView(v);
    onChangeView(v);

    if (v === "week" || v === "workingWeek") {
      onChangeDate(startOfWeekMon(selectedDate));
    }
  }

  const fmtDay = useMemo(
    () =>
      new Intl.DateTimeFormat("es-ES", {
        weekday: "short",
        day: "2-digit",
        month: "short",
      }),
    []
  );

  const monthTitle = useMemo(
    () =>
      new Intl.DateTimeFormat("es-ES", {
        month: "long",
        year: "numeric",
      }).format(selectedDate),
    [selectedDate]
  );

  const apptsByDay = useMemo(() => {
    const map = new Map<string, CalendarAppt[]>();

    for (const a of appointments) {
      const key = localKeyTZ(new Date(a.startAt));
      const list = map.get(key) ?? [];
      list.push(a);
      map.set(key, list);
    }

    for (const [k, list] of map) {
      list.sort((A, B) => +new Date(A.startAt) - +new Date(B.startAt));
      map.set(k, list);
    }

    return map;
  }, [appointments]);

  const holidaysByDay = useMemo(() => {
    const map = new Map<string, HolidayLite[]>();

    for (const h of holidays ?? []) {
      const key = localKeyTZ(new Date(h.date));
      const list = map.get(key) ?? [];
      list.push(h);
      map.set(key, list);
    }

    return map;
  }, [holidays]);

  const daysForHeader =
    view === "week"
      ? weekDays
      : view === "workingWeek"
      ? workingWeekDays
      : view === "threeDays"
      ? threeDays
      : null;

  const isToday = (d: Date) => sameDayTZ(d, new Date());

  const isHoliday = (d: Date) => {
    const list = holidaysByDay.get(localKeyTZ(d)) ?? [];
    return list.length > 0;
  };

  const holidayTitle = (d: Date) => {
    const list = holidaysByDay.get(localKeyTZ(d)) ?? [];
    return list.map((h) => h.name).join(" · ");
  };

  return (
    <div className="cal-shell h-full flex flex-col">
      <CalendarToolbar
        view={view}
        monthTitle={monthTitle}
        selectedDate={selectedDate}
        onPrev={goPrev}
        onNext={goNext}
        onToday={goToday}
        onChangeView={handleChangeView}
        onJumpToMonth={(year, monthIndex) => {
          const d = new Date(selectedDate);
          d.setFullYear(year);
          d.setMonth(monthIndex);
          d.setDate(1);
          d.setHours(0, 0, 0, 0);
          onChangeDate(d);
        }}
      />

      <CalendarGrid
        view={view}
        selectedDate={selectedDate}
        weekDays={weekDays}
        workingWeekDays={workingWeekDays}
        threeDays={threeDays}
        apptsByDay={apptsByDay}
        appointments={appointments}
        onSelectAppointment={onSelectAppointment}
        onEditAppointmentId={onEditAppointmentId}
        START_HOUR={START_HOUR}
        HOURS_COUNT={HOURS_COUNT}
        ROW_PX={ROW_PX}
        painter={painter}
        holidays={holidays}
        daysForHeader={daysForHeader}
        fmtDay={fmtDay}
        isToday={isToday}
        isHoliday={isHoliday}
        holidayTitle={holidayTitle}
        paintedCellIds={paintedCellIds}
        onPaintCell={onPaintCell}
        painted={painted}
        employeeNameById={employeeNameById}
        employeeColorById={employeeColorById}
      />
    </div>
  );
}

export type { CalendarAppt } from "@/app/components/calendar/CalendarOnly/types";
