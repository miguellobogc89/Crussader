"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type ShiftEvent = {
  id: string;
  startAt: string;   // ISO
  endAt: string;     // ISO
  type?: string | null;
  employeeName?: string | null;
  label?: string | null;
};

type Props = {
  /** Lunes (o día inicial) de la semana visible */
  startDate: Date;
  events: ShiftEvent[];
  loading?: boolean;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onToday: () => void;
};

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatDayLabel(date: Date) {
  return date.toLocaleDateString("es-ES", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  });
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function parseIso(iso: string): Date {
  return new Date(iso);
}

export default function ShiftsWeeklyCalendar({
  startDate,
  events,
  loading = false,
  onPrevWeek,
  onNextWeek,
  onToday,
}: Props) {
  const days = React.useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(startDate, i)),
    [startDate],
  );

  const weekLabel = React.useMemo(() => {
    const first = days[0];
    const last = days[6];
    const fmt = (d: Date) =>
      d.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
      });
    return `${fmt(first)} – ${fmt(last)}`;
  }, [days]);

  const today = new Date();

  return (
    <div className="flex flex-col gap-3">
      {/* Header de controles */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onPrevWeek}
            className="rounded-md border px-2 py-1 text-xs hover:bg-slate-50"
          >
            Semana anterior
          </button>
          <button
            type="button"
            onClick={onToday}
            className="rounded-md border px-2 py-1 text-xs hover:bg-slate-50"
          >
            Hoy
          </button>
          <button
            type="button"
            onClick={onNextWeek}
            className="rounded-md border px-2 py-1 text-xs hover:bg-slate-50"
          >
            Semana siguiente
          </button>
        </div>
        <div className="text-sm font-medium text-slate-700">{weekLabel}</div>
        <div className="text-xs text-slate-400">
          {loading ? "Cargando turnos…" : "\u00A0"}
        </div>
      </div>

      {/* Grid semanal simple (sin horas, solo días) */}
      <div className="overflow-hidden rounded-lg border bg-white">
        <div className="grid grid-cols-7 border-b bg-slate-50 text-center text-xs font-medium text-slate-600">
          {days.map((day, idx) => {
            const isToday = isSameDay(day, today);
            return (
              <div
                key={idx}
                className={cn(
                  "border-l first:border-l-0 px-2 py-2",
                  isToday && "bg-sky-50 text-sky-700 font-semibold",
                )}
              >
                {formatDayLabel(day)}
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-7 min-h-[200px]">
          {days.map((day, idx) => {
            const dayEvents = events.filter((ev) =>
              isSameDay(parseIso(ev.startAt), day),
            );

            return (
              <div
                key={idx}
                className={cn(
                  "border-l first:border-l-0 border-t px-2 py-2 align-top text-xs",
                )}
              >
                {dayEvents.length === 0 && (
                  <div className="text-[11px] text-slate-300 select-none">
                    Sin turnos
                  </div>
                )}

                <div className="flex flex-col gap-1">
                  {dayEvents.map((ev) => {
                    const start = parseIso(ev.startAt).toLocaleTimeString(
                      "es-ES",
                      { hour: "2-digit", minute: "2-digit" },
                    );
                    const end = parseIso(ev.endAt).toLocaleTimeString("es-ES", {
                      hour: "2-digit",
                      minute: "2-digit",
                    });

                    const label =
                      ev.label ||
                      ev.type ||
                      (ev.employeeName ? "Turno" : "Turno");

                    return (
                      <div
                        key={ev.id}
                        className="rounded-md border border-sky-100 bg-sky-50 px-2 py-1 text-[11px] text-sky-900 shadow-[0_1px_0_rgba(15,23,42,0.08)]"
                      >
                        <div className="font-medium line-clamp-1">
                          {label}
                        </div>
                        {ev.employeeName && (
                          <div className="text-[10px] text-slate-500 line-clamp-1">
                            {ev.employeeName}
                          </div>
                        )}
                        <div className="text-[10px] text-slate-500">
                          {start} – {end}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
