// app/components/shifts
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

type ShiftType = "WORK" | "VACATION" | "SICK" | "OTHER";

type LocalShift = {
  employeeId: string;
  date: string; // "yyyy-MM-dd"
  hour: number; // 0–23
  type: ShiftType;
};

type Props = {
  selectedEmployeeId?: string | null;
};

const HOURS = Array.from({ length: 13 }).map((_, i) => 8 + i); // 08:00–20:00

const SHIFT_TYPE_LABEL: Record<ShiftType, string> = {
  WORK: "Turno",
  VACATION: "Vacaciones",
  SICK: "Baja",
  OTHER: "Otros",
};

const SHIFT_TYPE_COLOR: Record<ShiftType, string> = {
  WORK: "bg-emerald-100 text-emerald-800 border-emerald-200",
  VACATION: "bg-amber-100 text-amber-800 border-amber-200",
  SICK: "bg-rose-100 text-rose-800 border-rose-200",
  OTHER: "bg-sky-100 text-sky-800 border-sky-200",
};

// Colores específicos para la VISTA MES (rellenar el bloque del día)
const SHIFT_TYPE_MONTH_BG: Record<ShiftType, string> = {
  WORK: "bg-emerald-50 border-emerald-100",
  VACATION: "bg-amber-50 border-amber-100",
  SICK: "bg-rose-50 border-rose-100",
  OTHER: "bg-sky-50 border-sky-100",
};

type ViewMode = "week" | "month";

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
          <div className="min-w-full">
            {/* Cabecera de días */}
            <div className="grid grid-cols-[80px,repeat(7,1fr)] border-b border-slate-200 bg-slate-50">
              <div className="border-r border-slate-200" />
              {daysOfWeek.map((day) => (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "px-2 py-2 text-center text-xs font-medium text-slate-600 border-r border-slate-200 last:border-r-0",
                    format(day, "yyyy-MM-dd") ===
                      format(new Date(), "yyyy-MM-dd") &&
                      "bg-blue-50 text-blue-700"
                  )}
                >
                  <div className="uppercase text-[10px] tracking-wide">
                    {format(day, "EEE", { locale: es })}
                  </div>
                  <div className="text-sm">
                    {format(day, "d", { locale: es })}
                  </div>
                </div>
              ))}
            </div>

            {/* Filas por hora */}
            <div className="divide-y divide-slate-200 select-none">
              {HOURS.map((hour) => (
                <div
                  key={hour}
                  className="grid grid-cols-[80px,repeat(7,1fr)] min-h-[40px]"
                >
                  {/* Columna de hora */}
                  <div className="border-r border-slate-200 bg-slate-50 px-2 py-1 text-right text-[11px] text-slate-500">
                    {hour.toString().padStart(2, "0")}:00
                  </div>

                  {/* Celdas día/hora */}
                  {daysOfWeek.map((day) => {
                    const key = day.toISOString() + hour;
                    const event =
                      selectedEmployeeId &&
                      getEventForCell(day, hour, selectedEmployeeId);

                    return (
                      <div
                        key={key}
                        className="border-r border-slate-100 last:border-r-0 bg-white hover:bg-slate-50 transition-colors"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          if (!selectedEmployeeId) return;
                          const hasEvent = !!getEventForCell(
                            day,
                            hour,
                            selectedEmployeeId
                          );
                          const mode: "add" | "remove" = hasEvent
                            ? "remove"
                            : "add";
                          setIsPainting(true);
                          setPaintMode(mode);
                          toggleCell(
                            day,
                            hour,
                            selectedEmployeeId,
                            mode,
                            currentType
                          );
                        }}
                        onMouseEnter={() => {
                          if (
                            !isPainting ||
                            !selectedEmployeeId ||
                            !paintMode
                          ) {
                            return;
                          }
                          toggleCell(
                            day,
                            hour,
                            selectedEmployeeId,
                            paintMode,
                            currentType
                          );
                        }}
                      >
                        {event && (
                          <div
                            className={cn(
                              "m-0.5 rounded-md border px-1.5 py-1 text-[11px] leading-tight shadow-sm",
                              SHIFT_TYPE_COLOR[event.type]
                            )}
                          >
                            <div className="font-medium truncate">
                              {SHIFT_TYPE_LABEL[event.type]}
                            </div>
                            <div className="text-[10px] opacity-80">
                              {hour.toString().padStart(2, "0")}:00–
                              {(hour + 1).toString().padStart(2, "0")}:00
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VISTA MES */}
        {viewMode === "month" && (
          <div className="min-w-full select-none" onWheel={handleMonthWheel}>
            {/* Cabecera días */}
            <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
              {["L", "M", "X", "J", "V", "S", "D"].map((d) => (
                <div
                  key={d}
                  className="px-2 py-2 text-center text-xs font-medium text-slate-600 border-r border-slate-200 last:border-r-0"
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Semanas */}
            <div className="divide-y divide-slate-200">
              {monthWeeks.map((week, idx) => (
                <div key={idx} className="grid grid-cols-7 min-h-[80px]">
                  {week.map((day) => {
                    const isToday =
                      format(day, "yyyy-MM-dd") ===
                      format(new Date(), "yyyy-MM-dd");
                    const inMonth =
                      format(day, "MM") === format(monthStart, "MM");

                    const dayEvents =
                      selectedEmployeeId
                        ? getEventsForDay(day, selectedEmployeeId)
                        : [];
                    const dominantType = resolveDayType(dayEvents);

                    return (
                      <div
                        key={day.toISOString()}
                        className={cn(
                          "border-r border-slate-100 last:border-r-0 px-1.5 py-1.5 text-xs align-top cursor-pointer transition-colors",
                          !inMonth && "bg-slate-50/60 text-slate-400",
                          inMonth && !dominantType && "bg-white",
                          inMonth &&
                            dominantType &&
                            SHIFT_TYPE_MONTH_BG[dominantType]
                        )}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          if (!selectedEmployeeId) return;

                          const hasAny = dayEvents.length > 0;
                          const mode: "add" | "remove" = hasAny
                            ? "remove"
                            : "add";
                          setIsPainting(true);
                          setPaintMode(mode);

                          HOURS.forEach((h) => {
                            toggleCell(day, h, selectedEmployeeId, mode, currentType);
                          });
                        }}
                        onMouseEnter={() => {
                          if (!isPainting || !selectedEmployeeId || !paintMode) {
                            return;
                          }
                          HOURS.forEach((h) => {
                            toggleCell(
                              day,
                              h,
                              selectedEmployeeId,
                              paintMode,
                              currentType
                            );
                          });
                        }}
                      >
                        {/* Número de día */}
                        <div
                          className={cn(
                            "inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] mb-1",
                            isToday
                              ? "bg-blue-600 text-white"
                              : "text-slate-700",
                            !inMonth && "text-slate-400"
                          )}
                        >
                          {format(day, "d")}
                        </div>

                        {/* Bloque coloreado resumido */}
                        {dominantType && (
                          <div className="mt-1 rounded-md border border-white/40 px-1 py-0.5 text-[10px] font-medium text-slate-700/90 truncate">
                            {SHIFT_TYPE_LABEL[dominantType]}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            <div className="px-4 py-2 text-[10px] text-slate-400 border-t border-slate-100">
              Desplázate con la rueda del ratón para cambiar de mes.
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
