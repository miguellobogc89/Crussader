// app/components/calendar/CalendarOnly/CalendarGrid.tsx
"use client";

import DayView from "@/app/components/calendar/CalendarOnly/DayView";
import WeekView from "@/app/components/calendar/CalendarOnly/WeekView";
import MonthView from "@/app/components/calendar/CalendarOnly/MonthView";
import { localKeyTZ } from "@/app/components/calendar/CalendarOnly/tz";

import CalendarHeaderRow from "@/app/components/calendar/CalendarOnly/Grid/CalendarHeaderRow";

import type { CalendarAppt } from "@/app/components/calendar/CalendarOnly/types";
import type { CellPainter } from "@/hooks/calendar/useCellPainter";
import type { HolidayLite } from "@/app/components/calendar/CalendarOnly/types";

type View = "day" | "threeDays" | "workingWeek" | "week" | "month";

type PaintedAssignment = {
  employeeIds: string[];
  shiftLabel: string;
};

export default function CalendarGrid({
  view,
  selectedDate,
  weekDays,
  workingWeekDays,
  threeDays,
  apptsByDay,
  appointments,
  onSelectAppointment,
  onEditAppointmentId,
  START_HOUR,
  HOURS_COUNT,
  ROW_PX,
  painter,
  holidays,

  daysForHeader,
  fmtDay,
  isToday,
  isHoliday,
  holidayTitle,

  paintedCellIds,
  onPaintCell,

  painted,
  employeeNameById,
  employeeColorById,
}: {
  view: View;
  selectedDate: Date;

  weekDays: Date[];
  workingWeekDays: Date[];
  threeDays: Date[];

  apptsByDay: Map<string, CalendarAppt[]>;
  appointments: CalendarAppt[];

  onSelectAppointment?: (id: string) => void;
  onEditAppointmentId?: (id: string) => void;

  START_HOUR: number;
  HOURS_COUNT: number;
  ROW_PX: number;

  painter: CellPainter;
  holidays?: HolidayLite[];

  daysForHeader: Date[] | null;
  fmtDay: Intl.DateTimeFormat;
  isToday: (d: Date) => boolean;
  isHoliday: (d: Date) => boolean;
  holidayTitle: (d: Date) => string;

  paintedCellIds?: Set<string>;
  onPaintCell?: (cellId: string) => void;

  painted?: Map<string, PaintedAssignment>;
  employeeNameById?: (id: string) => string;
    employeeColorById?: (id: string) => string | null;
}) {
  const daysForWeekLike =
    view === "week"
      ? weekDays
      : view === "workingWeek"
      ? workingWeekDays
      : view === "threeDays"
      ? threeDays
      : null;

  const headerDays = daysForHeader ?? daysForWeekLike;

  return (
    <div className="cal-grid flex-1 min-h-0 overflow-auto">
      {headerDays ? (
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-border">
          <CalendarHeaderRow
            days={headerDays}
            fmtDay={fmtDay}
            isToday={isToday}
            isHoliday={isHoliday}
            holidayTitle={holidayTitle}
          />
        </div>
      ) : null}

      <div className="px-3 pb-3">
        {view === "day" && (
          <DayView
            date={selectedDate}
            appts={apptsByDay.get(localKeyTZ(selectedDate)) ?? []}
            onSelect={onSelectAppointment}
            onEdit={onEditAppointmentId}
            START_HOUR={START_HOUR}
            HOURS_COUNT={HOURS_COUNT}
            ROW_PX={ROW_PX}
            painter={painter}
            holidays={holidays}
            // ✅ CLAVE: pasar datos para que DayView muestre nombres/turno
            painted={painted}
            employeeNameById={employeeNameById}
          />
        )}

        {(view === "week" || view === "workingWeek" || view === "threeDays") && (
          <WeekView
            days={view === "week" ? weekDays : view === "workingWeek" ? workingWeekDays : threeDays}
            apptsByDay={apptsByDay}
            onSelect={onSelectAppointment}
            onEdit={onEditAppointmentId}
            START_HOUR={START_HOUR}
            HOURS_COUNT={HOURS_COUNT}
            ROW_PX={ROW_PX}
            painter={painter}
            holidays={holidays}
            // ✅ CLAVE: pasar datos para que WeekView muestre nombres/turno
            painted={painted}
            employeeNameById={employeeNameById}
          />
        )}

        {view === "month" && (
          <MonthView
            anchor={selectedDate}
            appts={appointments}
            onSelect={onSelectAppointment}
            onEdit={onEditAppointmentId}
            painter={painter}
            holidays={holidays}
            painted={painted}
            employeeNameById={employeeNameById}
            employeeColorById={employeeColorById}
          />
        )}
      </div>
    </div>
  );
}
