// app/dashboard/shift-calendar/page.tsx
"use client";

import { useMemo, useState } from "react";
import PageShell from "@/app/components/layouts/PageShell";
import ShiftCalendarShell from "@/app/components/shift-calendar/ShiftCalendarShell";

import RightMenu from "@/app/components/shift-calendar/right-menu";
import EmployeePicker, { type Employee } from "@/app/components/shift-calendar/employee-picker";

import Calendar from "@/app/components/shift-calendar/calendar/Calendar";
import type { CalendarViewMode } from "@/app/components/shift-calendar/calendar/CalendarViewPicker";


import { Button } from "@/app/components/ui/button";
import { CalendarDays, ChevronLeft, ChevronRight, Eraser } from "lucide-react";

import type {
  PaintState,
  BrushKind,
  ShiftKind,
} from "@/app/components/shift-calendar/paint-manager";
import {
  applyPaint,
  clearPaint,
  rotateForDay,
  brushButtonClasses,
  brushLabelEs,
} from "@/app/components/shift-calendar/paint-manager";

/* ───────────────── local ctx types (evita depender del export del shell) ───────────────── */
type Holiday = {
  id: string;
  date: string;
  name: string;
  isClosed: boolean;
  locationId?: string | null;
};

type EmployeeLite = {
  id: string;
  name: string;
  color?: string | null;
  active: boolean;
};

type ShiftCalendarCtxLocal = {
  locationId: string | null;

  anchorDate: Date;
  setAnchorDate: (d: Date) => void;
  monthStart: Date;
  monthEnd: Date;

  holidays: Holiday[];
  holidaysMsg: string;

  employees: EmployeeLite[];
  employeesMsg: string;

  jobTitles: string[];
  jobTitlesMsg: string;

  isCreatingEmployee: boolean;
  createEmployeeErr: string | null;
  createEmployee: (payload: { name: string; jobTitle: string | null }) => Promise<void>;
  location?: { openingHours?: any | null } | null;
};

/* ───────────────── helpers ───────────────── */
function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

function clampToDateOnlyISO(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.toISOString().slice(0, 10);
}

function holidayDateKey(iso: string) {
  return String(iso).slice(0, 10);
}

/* ───────────────── body ───────────────── */
function ShiftCalendarBody({ ctx }: { ctx: ShiftCalendarCtxLocal }) {
  const {
    locationId,
    anchorDate,
    setAnchorDate,
    monthStart,
    monthEnd,
    holidays,
    holidaysMsg,
    employees,
    employeesMsg,
    jobTitles,
    jobTitlesMsg,
    isCreatingEmployee,
    createEmployeeErr,
    createEmployee,
    location,
  } = ctx;

  const [selectedDay, setSelectedDay] = useState<Date>(() => new Date());
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<CalendarViewMode>("1m");

  // brocha + estado local pintado
  const [brushKind, setBrushKind] = useState<BrushKind>("WORK");
  const [paint, setPaint] = useState<PaintState>({});

  function toggleEmployee(id: string) {
    const exists = selectedEmployeeIds.includes(id);
    if (exists) {
      setSelectedEmployeeIds(selectedEmployeeIds.filter((x) => x !== id));
      return;
    }
    setSelectedEmployeeIds([...selectedEmployeeIds, id]);
  }

  const fmtMonthTitle = useMemo(
    () =>
      new Intl.DateTimeFormat("es-ES", {
        timeZone: "Europe/Madrid",
        month: "long",
        year: "numeric",
      }),
    []
  );

  const fmtWeekday = useMemo(
    () =>
      new Intl.DateTimeFormat("es-ES", {
        timeZone: "Europe/Madrid",
        weekday: "short",
      }),
    []
  );

  // grid 6 semanas (42 días), empezando lunes
  const gridStart = useMemo(() => {
    const x = startOfDay(monthStart);
    const day = x.getDay(); // 0 domingo
    const diff = day === 0 ? -6 : 1 - day; // lunes
    return addDays(x, diff);
  }, [monthStart]);

  const days = useMemo(() => {
    const arr: Date[] = [];
    for (let i = 0; i < 42; i++) arr.push(addDays(gridStart, i));
    return arr;
  }, [gridStart]);

  const weekHeaders = useMemo(() => {
    const base = new Date("2024-01-01T00:00:00.000Z");
    const arr: string[] = [];
    for (let i = 0; i < 7; i++) arr.push(fmtWeekday.format(addDays(base, i)));
    return arr;
  }, [fmtWeekday]);

  const holidaysByDay = useMemo(() => {
    const map = new Map<string, Holiday[]>();
    for (const h of holidays) {
      const key = holidayDateKey(h.date);
      const list = map.get(key) ?? [];
      list.push(h);
      map.set(key, list);
    }
    return map;
  }, [holidays]);

  const selectedDayKey = useMemo(() => clampToDateOnlyISO(selectedDay), [selectedDay]);

  const selectedDayHolidays = useMemo(
    () => holidaysByDay.get(selectedDayKey) ?? [],
    [holidaysByDay, selectedDayKey]
  );

  const activeEmployees: Employee[] = useMemo(() => {
    return employees
      .filter((emp) => emp.active)
      .map((emp) => ({
        id: emp.id,
        name: emp.name,
        active: emp.active,
        color: emp.color ?? null,
      }));
  }, [employees]);

  // pintura (con ERASE)
  function handlePaintDay(dayKey: string) {
    if (selectedEmployeeIds.length === 0) return;

    if (brushKind === "ERASE") {
      setPaint((prev) => clearPaint(prev, dayKey, selectedEmployeeIds));
      return;
    }

    setPaint((prev) =>
      applyPaint(prev, dayKey, selectedEmployeeIds, brushKind as ShiftKind)
    );
  }

  function handleRotateDay(dayKey: string) {
    if (selectedEmployeeIds.length === 0) return;

    if (brushKind === "ERASE") {
      setPaint((prev) => clearPaint(prev, dayKey, selectedEmployeeIds));
      return;
    }

    setPaint((prev) =>
      rotateForDay(prev, dayKey, selectedEmployeeIds, brushKind as ShiftKind)
    );
  }

  if (!locationId) return <></>;

  const brushButtons: BrushKind[] = ["WORK", "VACATION", "OFF", "SICK", "ERASE"];

  return (
    <>
      {/* Toolbar */}
      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <EmployeePicker
            items={activeEmployees}
            selectedIds={selectedEmployeeIds}
            onToggle={toggleEmployee}
            onCreate={createEmployee}
            jobTitles={jobTitles}
            jobTitlesStatusText={jobTitlesMsg}
          />

          <div className="text-xs text-slate-500">
            {isCreatingEmployee ? "⏳ Creando empleado…" : employeesMsg}
            {createEmployeeErr ? (
              <span className="ml-2 text-rose-600">❌ {createEmployeeErr}</span>
            ) : null}
          </div>

          {/* Brocha */}
          <div className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1">
            {brushButtons.map((k) => {
              const active = k === brushKind;

              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => setBrushKind(k)}
                  className={[
                    "h-9 rounded-xl px-3 text-xs font-semibold border transition",
                    brushButtonClasses(k),
                    active ? "ring-2 ring-violet-300" : "opacity-80 hover:opacity-100",
                  ].join(" ")}
                  title={`Brocha: ${brushLabelEs(k)}`}
                >
                  {k === "ERASE" ? (
                    <span className="inline-flex items-center gap-2">
                      <Eraser className="h-4 w-4" />
                      <span>Borrar</span>
                    </span>
                  ) : (
                    brushLabelEs(k)
                  )}
                </button>
              );
            })}
          </div>

          <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
            <CalendarDays className="h-4 w-4 text-slate-500" />
            <div className="text-sm font-semibold text-slate-800 capitalize">
              {fmtMonthTitle.format(anchorDate)}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-9 rounded-xl"
              onClick={() => {
                const d = new Date(anchorDate);
                d.setMonth(d.getMonth() - 1);
                setAnchorDate(d);
              }}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <Button
              type="button"
              variant="outline"
              className="h-9 rounded-xl"
              onClick={() => {
                setAnchorDate(new Date());
                setSelectedDay(new Date());
              }}
            >
              Hoy
            </Button>

            <Button
              type="button"
              variant="outline"
              className="h-9 rounded-xl"
              onClick={() => {
                const d = new Date(anchorDate);
                d.setMonth(d.getMonth() + 1);
                setAnchorDate(d);
              }}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            <div className="ml-2 text-xs text-slate-500">{holidaysMsg}</div>
          </div>
        </div>
      </div>

      {/* Layout */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">
        <Calendar
          weekHeaders={weekHeaders}
          days={days}
          anchorDate={anchorDate}
          selectedDay={selectedDay}
          onSelectDay={setSelectedDay}
          holidaysByDay={holidaysByDay}
          viewMode={viewMode}
          onChangeViewMode={setViewMode}
          closedDayKeys={undefined}
          paint={paint}
          brushKind={brushKind}
          selectedEmployeeIds={selectedEmployeeIds}
          onPaintDay={handlePaintDay}
          onRotateDay={handleRotateDay}
          brushEnabled={true}
          openingHoursRaw={location?.openingHours}
        />

        <RightMenu selectedDay={selectedDay} selectedDayHolidays={selectedDayHolidays} />
      </div>

      {/* Debug */}
      <div className="mt-4 text-xs text-slate-600">
        <div className="font-semibold text-slate-700">
          Debug festivos — {monthStart.toISOString().slice(0, 10)} →{" "}
          {monthEnd.toISOString().slice(0, 10)}
        </div>
        <pre className="mt-2 whitespace-pre-wrap break-words rounded-xl border border-slate-200 bg-white p-3">
          {JSON.stringify(holidays, null, 2)}
        </pre>

        <div className="mt-3 font-semibold text-slate-700">Debug paint</div>
        <pre className="mt-2 whitespace-pre-wrap break-words rounded-xl border border-slate-200 bg-white p-3">
          {JSON.stringify(paint, null, 2)}
        </pre>
      </div>
    </>
  );
}

/* ───────────────── page ───────────────── */
export default function ShiftCalendarPage() {
  return (
    <PageShell title="Turnos" description="Gestión de turnos y calendario" variant="full">
      <ShiftCalendarShell>
        {(ctx) => {
          const typed = ctx as ShiftCalendarCtxLocal;
          if (!typed.locationId) return <></>;
          return <ShiftCalendarBody ctx={typed} />;
        }}
      </ShiftCalendarShell>
    </PageShell>
  );
}

