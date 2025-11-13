// app/components/shifts/ShiftsCalendar.tsx
"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/app/components/ui/select";
import { cn } from "@/lib/utils";

type ViewMode = "day" | "week" | "month";

type Employee = {
  id: string;
  name: string;
  role?: string;
};

const MOCK_EMPLOYEES: Employee[] = [
  { id: "e1", name: "Ana López", role: "Recepción" },
  { id: "e2", name: "Marcos Ruiz", role: "Fisioterapia" },
  { id: "e3", name: "Laura Gómez", role: "Estética" },
];

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0 (dom) - 6 (sáb)
  const diff = (day === 0 ? -6 : 1) - day; // queremos lunes como inicio
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getWeekDays(baseDate: Date): Date[] {
  const start = startOfWeek(baseDate);
  const days: Date[] = [];
  for (let i = 0; i < 7; i += 1) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(d);
  }
  return days;
}

export function ShiftsCalendar() {
  const [view, setView] = React.useState<ViewMode>("week");
  const [referenceDate, setReferenceDate] = React.useState<Date>(new Date());
  const [visibleEmployeeIds, setVisibleEmployeeIds] = React.useState<string[]>(
    () => MOCK_EMPLOYEES.map((e) => e.id),
  );

  const weekDays = React.useMemo(() => getWeekDays(referenceDate), [referenceDate]);

  const toggleEmployee = (id: string) => {
    setVisibleEmployeeIds((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id],
    );
  };

  const goPrev = () => {
    if (view === "week") {
      const d = new Date(referenceDate);
      d.setDate(d.getDate() - 7);
      setReferenceDate(d);
    } else if (view === "day") {
      const d = new Date(referenceDate);
      d.setDate(d.getDate() - 1);
      setReferenceDate(d);
    } else {
      const d = new Date(referenceDate);
      d.setMonth(d.getMonth() - 1);
      setReferenceDate(d);
    }
  };

  const goNext = () => {
    if (view === "week") {
      const d = new Date(referenceDate);
      d.setDate(d.getDate() + 7);
      setReferenceDate(d);
    } else if (view === "day") {
      const d = new Date(referenceDate);
      d.setDate(d.getDate() + 1);
      setReferenceDate(d);
    } else {
      const d = new Date(referenceDate);
      d.setMonth(d.getMonth() + 1);
      setReferenceDate(d);
    }
  };

  const goToday = () => {
    setReferenceDate(new Date());
  };

  const visibleEmployees = MOCK_EMPLOYEES.filter((e) =>
    visibleEmployeeIds.includes(e.id),
  );

  const renderWeekView = () => {
    return (
      <div className="border rounded-xl overflow-hidden">
        {/* Cabecera columnas */}
        <div className="grid grid-cols-8 bg-slate-50 text-xs font-medium text-slate-600">
          <div className="px-3 py-2 border-r bg-slate-100">Empleado</div>
          {weekDays.map((d) => {
            const label = d.toLocaleDateString("es-ES", {
              weekday: "short",
              day: "2-digit",
              month: "2-digit",
            });
            return (
              <div
                key={d.toISOString()}
                className="px-3 py-2 text-center border-r last:border-r-0"
              >
                {label}
              </div>
            );
          })}
        </div>

        {/* Filas por empleado */}
        {visibleEmployees.map((emp, rowIdx) => (
          <div
            key={emp.id}
            className={cn(
              "grid grid-cols-8 text-xs",
              rowIdx % 2 === 0 ? "bg-white" : "bg-slate-50/60",
            )}
          >
            {/* Columna empleado */}
            <div className="px-3 py-2 border-t border-r bg-slate-50 text-slate-800">
              <div className="font-medium">{emp.name}</div>
              {emp.role && (
                <div className="text-[11px] text-slate-500">{emp.role}</div>
              )}
            </div>

            {/* Celdas día */}
            {weekDays.map((d) => (
              <button
                key={`${emp.id}-${d.toISOString()}`}
                type="button"
                className="h-12 border-t border-r last:border-r-0 flex items-center justify-center text-[11px] text-slate-400 hover:bg-slate-100 transition-colors"
              >
                {/* Aquí más adelante irán los pills de turno (Mañana, Tarde, Vacaciones, etc.) */}
                —
              </button>
            ))}
          </div>
        ))}

        {visibleEmployees.length === 0 && (
          <div className="p-6 text-center text-xs text-slate-500">
            No hay empleados seleccionados. Marca alguno en el panel de la izquierda.
          </div>
        )}
      </div>
    );
  };

  const renderDayView = () => (
    <div className="flex items-center justify-center h-64 text-xs text-slate-500 border rounded-xl">
      Vista de día en construcción. Primero cerramos la vista semanal.
    </div>
  );

  const renderMonthView = () => (
    <div className="flex items-center justify-center h-64 text-xs text-slate-500 border rounded-xl">
      Vista de mes en construcción. Primero cerramos la vista semanal.
    </div>
  );

  const currentLabel =
    view === "week"
      ? `Semana del ${weekDays[0].toLocaleDateString("es-ES", {
          day: "2-digit",
          month: "2-digit",
        })} al ${weekDays[6].toLocaleDateString("es-ES", {
          day: "2-digit",
          month: "2-digit",
        })}`
      : view === "day"
      ? referenceDate.toLocaleDateString("es-ES", {
          weekday: "long",
          day: "2-digit",
          month: "long",
        })
      : referenceDate.toLocaleDateString("es-ES", {
          month: "long",
          year: "numeric",
        });

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold">
            Calendario de turnos
          </CardTitle>
          <p className="text-xs text-slate-500">
            Selecciona la vista y organiza los horarios de tu equipo.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Selector de vista */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Vista</span>
            <Select
              value={view}
              onValueChange={(val) => setView(val as ViewMode)}
            >
              <SelectTrigger className="h-8 w-[130px] text-xs">
                <SelectValue placeholder="Vista" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Día</SelectItem>
                <SelectItem value="week">Semana</SelectItem>
                <SelectItem value="month">Mes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Navegación temporal */}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 px-2 text-xs"
              onClick={goPrev}
            >
              ←
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 px-2 text-xs"
              onClick={goToday}
            >
              Hoy
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 px-2 text-xs"
              onClick={goNext}
            >
              →
            </Button>
            <span className="ml-2 text-xs font-medium text-slate-600">
              {currentLabel}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-2">
        {/* Layout 2 columnas: filtros izquierda, calendario derecha */}
        <div className="grid gap-4 md:grid-cols-[260px,1fr]">
          {/* Panel lateral: empleados + leyenda */}
          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-semibold text-slate-600 mb-2">
                Empleados visibles
              </h3>
              <div className="space-y-1 rounded-lg border bg-slate-50 p-2">
                {MOCK_EMPLOYEES.map((emp) => {
                  const checked = visibleEmployeeIds.includes(emp.id);
                  return (
                    <button
                      key={emp.id}
                      type="button"
                      onClick={() => toggleEmployee(emp.id)}
                      className={cn(
                        "w-full flex items-center justify-between rounded-md px-2 py-1.5 text-left text-xs transition-colors",
                        checked
                          ? "bg-slate-900 text-slate-50"
                          : "hover:bg-slate-100",
                      )}
                    >
                      <span>
                        {emp.name}
                        {emp.role && (
                          <span className="ml-1 text-[10px] text-slate-400">
                            · {emp.role}
                          </span>
                        )}
                      </span>
                      <span
                        className={cn(
                          "h-2.5 w-2.5 rounded-full border",
                          checked
                            ? "bg-emerald-400 border-emerald-500"
                            : "bg-white border-slate-300",
                        )}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold text-slate-600 mb-2">
                Leyenda de turnos
              </h3>
              <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-600">
                <div className="flex items-center gap-1">
                  <span className="h-3 w-3 rounded-sm bg-sky-400" /> Mañana
                </div>
                <div className="flex items-center gap-1">
                  <span className="h-3 w-3 rounded-sm bg-violet-400" /> Tarde
                </div>
                <div className="flex items-center gap-1">
                  <span className="h-3 w-3 rounded-sm bg-amber-400" /> Completo
                </div>
                <div className="flex items-center gap-1">
                  <span className="h-3 w-3 rounded-sm bg-rose-400" /> Vacaciones
                </div>
                <div className="flex items-center gap-1">
                  <span className="h-3 w-3 rounded-sm bg-slate-300" /> Libre
                </div>
              </div>
            </div>
          </div>

          {/* Calendario según vista */}
          <div>
            {view === "week" && renderWeekView()}
            {view === "day" && renderDayView()}
            {view === "month" && renderMonthView()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
