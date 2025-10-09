"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/app/components/ui/button";

// subcomponentes
import DayView from "@/app/components/calendar/CalendarOnly/DayView";
import WeekView from "@/app/components/calendar/CalendarOnly/WeekView";
import MonthView from "@/app/components/calendar/CalendarOnly/MonthView";

// utilidades
import { localKeyTZ } from "@/app/components/calendar/CalendarOnly/tz";
// tipos
import type { CalendarAppt } from "@/app/components/calendar/CalendarOnly/types";

type View = "day" | "threeDays" | "workingWeek" | "week" | "month";

type Props = {
  selectedView: View;
  onChangeView: (v: View) => void;
  selectedDate: Date;
  onChangeDate: (d: Date) => void;
  appointments?: CalendarAppt[];
  onSelectAppointment?: (id: string) => void;
  onEditAppointmentId?: (id: string) => void;
};

export default function CalendarOnly({
  selectedView,
  onChangeView,
  selectedDate,
  onChangeDate,
  appointments = [],
  onSelectAppointment,
  onEditAppointmentId,
}: Props) {
  const [view, setView] = useState<View>(selectedView);
  useEffect(() => setView(selectedView), [selectedView]);

  /* === Layout base === */
  const START_HOUR = 8;   // 08:00
  const HOURS_COUNT = 12; // 08..19
  const ROW_PX = 64;      // alto por hora

  // helpers fecha
  const startOfWeekMon = (d: Date) => {
    const x = new Date(d);
    const day = x.getDay(); // 0 = Dom
    const delta = day === 0 ? -6 : 1 - day;
    x.setHours(0, 0, 0, 0);
    x.setDate(x.getDate() + delta);
    return x;
  };
  const addDays = (d: Date, n: number) => {
    const x = new Date(d);
    x.setDate(x.getDate() + n);
    return x;
  };
  const sameDayTZ = (a: Date, b: Date) => localKeyTZ(a) === localKeyTZ(b);

  // semanas y colecciones de días
  const weekStart = useMemo(() => startOfWeekMon(selectedDate), [selectedDate]);
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );
  const workingWeekDays = useMemo(
    () => Array.from({ length: 5 }, (_, i) => addDays(weekStart, i)), // Lun..Vie
    [weekStart]
  );
  const threeDays = useMemo(
    () => Array.from({ length: 3 }, (_, i) => addDays(selectedDate, i)),
    [selectedDate]
  );

  // navegación
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
    onChangeView?.(v);
    if (v === "week" || v === "workingWeek") onChangeDate(startOfWeekMon(selectedDate));
  }

  // cabeceras
  const fmtDay = useMemo(
    () => new Intl.DateTimeFormat("es-ES", { weekday: "short", day: "2-digit", month: "short" }),
    []
  );
  const monthTitle = useMemo(
    () => new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric" }).format(selectedDate),
    [selectedDate]
  );

  // citas por día (clave local por TZ)
  const apptsByDay = useMemo(() => {
    const map = new Map<string, CalendarAppt[]>();
    for (const a of appointments) {
      const k = localKeyTZ(new Date(a.startAt));
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(a);
    }
    for (const [k, list] of map) {
      list.sort((A, B) => +new Date(A.startAt) - +new Date(B.startAt));
      map.set(k, list);
    }
    return map;
  }, [appointments]);

  // conjunto de días para header y vista multi-día
  const daysForHeader =
    view === "week" ? weekDays :
    view === "workingWeek" ? workingWeekDays :
    view === "threeDays" ? threeDays : null;

  return (
    <div className="cal-shell h-full flex flex-col">
      {/* CABECERA STICKY */}
      <div className="cal-header sticky top-0 z-20 bg-white border-b border-border">
        {/* Controles */}
        <div className="px-3 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={goPrev}><ChevronLeft className="h-4 w-4" /></Button>
            <Button variant="outline" onClick={goToday}>Hoy</Button>
            <Button variant="outline" size="icon" onClick={goNext}><ChevronRight className="h-4 w-4" /></Button>
            <div className="ml-3 text-sm font-medium capitalize">{monthTitle}</div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant={view === "day" ? "default" : "outline"} onClick={() => handleChangeView("day")}>Día</Button>
            <Button variant={view === "threeDays" ? "default" : "outline"} onClick={() => handleChangeView("threeDays")}>3 días</Button>
            <Button variant={view === "workingWeek" ? "default" : "outline"} onClick={() => handleChangeView("workingWeek")}>Laboral</Button>
            <Button variant={view === "week" ? "default" : "outline"} onClick={() => handleChangeView("week")}>Semana</Button>
            <Button variant={view === "month" ? "default" : "outline"} onClick={() => handleChangeView("month")}>Mes</Button>
          </div>
        </div>

        {/* Cabecera de días (todas las multi-día excepto month) */}
        {daysForHeader && (
          <div className="px-3 pb-3">
            <div
              className="grid gap-2"
              style={{
                gridTemplateColumns: `64px repeat(${daysForHeader.length}, minmax(0,1fr))`,
              }}
            >
              <div />{/* hueco columna horas */}
              {daysForHeader.map((d) => (
                <div
                  key={d.toISOString()}
                  className={`h-10 flex items-center justify-center rounded-md text-xs font-medium ${
                    sameDayTZ(d, new Date()) ? "bg-primary/10 text-primary" : "text-muted-foreground"
                  }`}
                  title={fmtDay.format(d)}
                >
                  {fmtDay.format(d)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* LIENZO SCROLLABLE */}
      <div className="cal-grid flex-1 overflow-auto px-3 pb-3">
        {view === "day" && (
          <DayView
            date={selectedDate}
            appts={apptsByDay.get(localKeyTZ(selectedDate)) ?? []}
            onSelect={onSelectAppointment}
            onEdit={onEditAppointmentId}
            START_HOUR={START_HOUR}
            HOURS_COUNT={HOURS_COUNT}
            ROW_PX={ROW_PX}
          />
        )}

        {(view === "week" || view === "workingWeek" || view === "threeDays") && (
          <WeekView
            days={
              view === "week" ? weekDays :
              view === "workingWeek" ? workingWeekDays :
              threeDays
            }
            apptsByDay={apptsByDay}
            onSelect={onSelectAppointment}
            onEdit={onEditAppointmentId}
            START_HOUR={START_HOUR}
            HOURS_COUNT={HOURS_COUNT}
            ROW_PX={ROW_PX}
          />
        )}

        {view === "month" && (
          <MonthView
            anchor={selectedDate}
            appts={appointments}
            onSelect={onSelectAppointment}
            onEdit={onEditAppointmentId}
          />
        )}
      </div>
    </div>
  );
}

// re-export del tipo para mantener tus imports existentes
export type { CalendarAppt } from "@/app/components/calendar/CalendarOnly/types";
