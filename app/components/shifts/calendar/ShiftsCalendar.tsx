// app/components/shifts.tsx
"use client";

import * as React from "react";
import {
  addDays,
  addMonths,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  format,
} from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import {
  ShiftType,
  LocalShift,
  ViewMode,
} from "@/app/components/shifts/calendar/shifts-constants";
import { WeekView } from "@/app/components/shifts/calendar/shifts-week-view";
import { MonthView } from "@/app/components/shifts/calendar/shifts-month-view";

type Props = {
  selectedEmployeeId?: string | null;
};

export function EmployeeShiftsCalendar({ selectedEmployeeId }: Props) {
  const [viewMode, setViewMode] = React.useState<ViewMode>("week");

  // Fecha “ancla” para ambas vistas
  const [currentDate, setCurrentDate] = React.useState<Date>(() => new Date());

  // Turnos locales (solo front)
  const [events, setEvents] = React.useState<LocalShift[]>([]);

  // Tipo de turno activo (picker)
  const [currentType, setCurrentType] = React.useState<ShiftType>("WORK");

  // Estado de “pintado” al arrastrar
  const [isPainting, setIsPainting] = React.useState(false);
  const [paintMode, setPaintMode] = React.useState<"add" | "remove">("add");

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);

  const daysOfWeek = React.useMemo(
    () => Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  // Helpers de eventos
  function toggleCell(
    day: Date,
    hour: number,
    employeeId: string,
    mode: "add" | "remove",
    type: ShiftType
  ) {
    const dateStr = format(day, "yyyy-MM-dd");

    setEvents((prev) => {
      const exists = prev.some(
        (e) =>
          e.employeeId === employeeId &&
          e.date === dateStr &&
          e.hour === hour
      );

      if (mode === "remove") {
        if (!exists) return prev;
        return prev.filter(
          (e) =>
            !(
              e.employeeId === employeeId &&
              e.date === dateStr &&
              e.hour === hour
            )
        );
      }

      const filtered = prev.filter(
        (e) =>
          !(
            e.employeeId === employeeId &&
            e.date === dateStr &&
            e.hour === hour
          )
      );
      return [
        ...filtered,
        {
          employeeId,
          date: dateStr,
          hour,
          type,
        },
      ];
    });
  }

  function getEventForCell(day: Date, hour: number, employeeId: string) {
    const dateStr = format(day, "yyyy-MM-dd");
    return events.find(
      (e) =>
        e.employeeId === employeeId &&
        e.date === dateStr &&
        e.hour === hour
    );
  }

  function getEventsForDay(date: Date, employeeId: string) {
    const dateStr = format(date, "yyyy-MM-dd");
    return events.filter(
      (e) => e.employeeId === employeeId && e.date === dateStr
    );
  }

  // Tipo dominante de un día (para vista mes)
  function resolveDayType(dayEvents: LocalShift[]): ShiftType | null {
    if (dayEvents.some((e) => e.type === "VACATION")) return "VACATION";
    if (dayEvents.some((e) => e.type === "SICK")) return "SICK";
    if (dayEvents.some((e) => e.type === "OTHER")) return "OTHER";
    if (dayEvents.some((e) => e.type === "WORK")) return "WORK";
    return null;
  }

  // NAV según vista
  const handlePrev = () => {
    setCurrentDate((prev) =>
      viewMode === "week" ? addDays(prev, -7) : addMonths(prev, -1)
    );
  };

  const handleNext = () => {
    setCurrentDate((prev) =>
      viewMode === "week" ? addDays(prev, 7) : addMonths(prev, 1)
    );
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleViewChange = (mode: ViewMode) => {
    setViewMode(mode);
  };

  // Scroll vertical en vista mes → cambia de mes
  const handleMonthWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (Math.abs(e.deltaY) < 20) return;
    if (e.deltaY > 0) {
      setCurrentDate((prev) => addMonths(prev, 1));
    } else {
      setCurrentDate((prev) => addMonths(prev, -1));
    }
  };

  // Semanas de la vista mes
  const monthWeeks = React.useMemo(() => {
    const start = startOfWeek(monthStart, { weekStartsOn: 1 });
    const end = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const days: Date[] = [];
    let cursor = start;
    while (cursor <= end) {
      days.push(cursor);
      cursor = addDays(cursor, 1);
    }
    const weeks: Date[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }
    return weeks;
  }, [monthStart, monthEnd]);

  const stopPainting = () => {
    setIsPainting(false);
  };

  return (
    <Card className="h-full min-h-[420px] flex flex-col border-slate-200 bg-white">
      {/* Header semana/mes + navegación */}
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <div className="flex flex-col gap-1">
          <div className="text-xs uppercase tracking-wide text-slate-400">
            Turnos
          </div>
          <div className="text-sm font-medium text-slate-800">
            {viewMode === "week" ? (
              <>
                {format(weekStart, "d MMM", { locale: es })} –{" "}
                {format(weekEnd, "d MMM yyyy", { locale: es })}
              </>
            ) : (
              <>{format(monthStart, "MMMM yyyy", { locale: es })}</>
            )}
          </div>
          {selectedEmployeeId ? (
            <div className="text-[11px] text-slate-500">
              Pinta turnos para el empleado seleccionado.
            </div>
          ) : (
            <div className="text-[11px] text-slate-500">
              Selecciona un empleado en la columna izquierda para empezar.
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Toggle Semana / Mes */}
          <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => handleViewChange("week")}
              className={cn(
                "px-2 py-1 rounded-full transition-colors",
                viewMode === "week"
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              Semana
            </button>
            <button
              type="button"
              onClick={() => handleViewChange("month")}
              className={cn(
                "px-2 py-1 rounded-full transition-colors",
                viewMode === "month"
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              Mes
            </button>
          </div>

          {/* Navegación temporal */}
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="outline"
              onClick={handlePrev}
              className="h-7 w-7 border-slate-200"
            >
              ‹
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleToday}
              className="h-7 px-2 border-slate-200 text-xs"
            >
              Hoy
            </Button>
            <Button
              size="icon"
              variant="outline"
              onClick={handleNext}
              className="h-7 w-7 border-slate-200"
            >
              ›
            </Button>
          </div>
        </div>
      </div>

      {/* Picker de tipo de turno */}
      <div className="border-b border-slate-200 px-4 py-2 bg-slate-50/80 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[11px] uppercase tracking-wide text-slate-400">
            Tipo de turno
          </span>
          <select
            value={currentType}
            onChange={(e) => setCurrentType(e.target.value as ShiftType)}
            className="h-7 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700 shadow-sm focus:outline-none focus:ring-1 focus:ring-sky-400"
          >
            <option value="WORK">Turno</option>
            <option value="VACATION">Vacaciones</option>
            <option value="SICK">Baja</option>
            <option value="OTHER">Otros</option>
          </select>
        </div>
        <div className="text-[11px] text-slate-400">
          Haz clic y arrastra para pintar horas (semana) o días (mes).
        </div>
      </div>

      {/* Contenido principal */}
      <div
        className="flex-1 overflow-auto"
        onMouseUp={stopPainting}
        onMouseLeave={stopPainting}
      >
        {/* VISTA SEMANA */}
        {viewMode === "week" && (
          <WeekView
            daysOfWeek={daysOfWeek}
            selectedEmployeeId={selectedEmployeeId}
            currentType={currentType}
            isPainting={isPainting}
            paintMode={paintMode}
            setIsPainting={setIsPainting}
            setPaintMode={setPaintMode}
            getEventForCell={getEventForCell}
            toggleCell={toggleCell}
          />
        )}

        {/* VISTA MES */}
        {viewMode === "month" && (
          <MonthView
            monthWeeks={monthWeeks}
            monthStart={monthStart}
            selectedEmployeeId={selectedEmployeeId}
            currentType={currentType}
            isPainting={isPainting}
            paintMode={paintMode}
            setIsPainting={setIsPainting}
            setPaintMode={setPaintMode}
            getEventsForDay={getEventsForDay}
            resolveDayType={resolveDayType}
            handleMonthWheel={handleMonthWheel}
            toggleCell={toggleCell}
          />
        )}
      </div>
    </Card>
  );
}
