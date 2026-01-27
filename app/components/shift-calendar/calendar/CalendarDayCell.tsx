// app/components/shift-calendar/calendar/CalendarDayCell.tsx
"use client";

import { Users } from "lucide-react";
import type { ShiftKind } from "@/app/components/shift-calendar/paint-manager";
import {
  groupDayKinds,
  kindChipClasses,
  kindLabelEs,
} from "@/app/components/shift-calendar/paint-manager";
import type { PaintState, BrushKind } from "@/app/components/shift-calendar/paint-manager";

type Holiday = {
  id: string;
  date: string;
  name: string;
  isClosed: boolean;
  locationId?: string | null;
};

export default function CalendarDayCell({
  date,
  dayKey,
  inMonth,
  isToday,
  isSelected,

  holidays,
  hasHoliday,
  isClosed,

  paint,
  brushKind,
  selectedEmployeeIds,

  onPointerDown,
  onPointerMove,
  onPointerEnter,
  onPointerUp,
}: {
  date: Date;
  dayKey: string;
  inMonth: boolean;
  isToday: boolean;
  isSelected: boolean;

  holidays: Holiday[];
  hasHoliday: boolean;
  isClosed: boolean;

  paint: PaintState;
  brushKind: BrushKind;
  selectedEmployeeIds: string[];

  onPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => void;
  onPointerMove: (e: React.PointerEvent<HTMLButtonElement>) => void;
  onPointerEnter: () => void;
  onPointerUp: (e: React.PointerEvent<HTMLButtonElement>) => void;

}) {
  const maxChipsToShow = 2;

  const weekday = date.getDay(); // 0 dom .. 6 sáb
  const isWeekend = weekday === 0 || weekday === 6;

  const holidayName = hasHoliday ? String(holidays[0]?.name || "") : "";
  const extraHolidays = hasHoliday ? Math.max(0, holidays.length - 1) : 0;

  const isHolidayCell = hasHoliday;
  const isWeekendCell = isWeekend;

  function renderShiftChips() {
    const dayMap = paint[dayKey];

    // ✅ reserva altura fija para que NO cambie el tamaño al aparecer chips
    if (!dayMap) return <div className="mt-2 min-h-[46px]" />;

    const counts = groupDayKinds(dayMap);
    const kindsInOrder: ShiftKind[] = ["WORK", "VACATION", "OFF", "SICK"];
    const chips = kindsInOrder
      .filter((k) => counts[k] > 0)
      .map((k) => ({ kind: k, count: counts[k] }));

    if (chips.length === 0) return <div className="mt-2 min-h-[46px]" />;

    const shown = chips.slice(0, maxChipsToShow);
    const rest = chips.length - shown.length;

    return (
      <div className="mt-2 min-h-[46px] space-y-1">
        {shown.map(({ kind, count }) => (
          <div
            key={kind}
            className={[
              "inline-flex w-full items-center justify-between gap-2 rounded-lg border px-2 py-1",
              "text-[11px] font-semibold",
              kindChipClasses(kind),
            ].join(" ")}
            title={`${kindLabelEs(kind)} (${count})`}
          >
            <span className="truncate">{kindLabelEs(kind)}</span>

            {/* ✅ icono usuarios + número (sin ×N) */}
            <span className="inline-flex items-center gap-1 shrink-0 opacity-80">
              <Users className="h-3.5 w-3.5" />
              <span>{count}</span>
            </span>
          </div>
        ))}

        {rest > 0 ? (
          <div className="text-[11px] text-slate-500">+{rest} más</div>
        ) : null}
      </div>
    );
  }

  return (
    <button
      type="button"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerEnter={onPointerEnter}
      onPointerUp={onPointerUp}
    className={[
  "group relative min-h-[92px] p-2 text-left transition",

  // 🔲 bordes base
  "border-b border-r",
  isWeekendCell
    ? "border-sky-200"
    : "border-slate-200",

  // selección manual
  isSelected ? "bg-violet-50" : "",

  // cerrado
  isClosed ? "bg-slate-50" : "",

  // 🎯 prioridad visual
  isHolidayCell
    ? "bg-amber-50 hover:bg-amber-100"
    : isWeekendCell
    ? "bg-sky-50 hover:bg-sky-100"
    : "bg-white hover:bg-slate-50",
].join(" ")}

    >
      <div className="flex h-full flex-col">
        {/* Top row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div
              className={[
                "flex h-7 w-7 items-center justify-center rounded-lg text-sm font-semibold",
                inMonth ? "text-slate-800" : "text-slate-400",
                isToday ? "ring-2 ring-violet-300" : "",
                isClosed ? "text-slate-400" : "",
              ].join(" ")}
            >
              {date.getDate()}
            </div>

            {/* ✅ Festivo: nombre azul oscuro junto al número, sin bolita */}
            {isHolidayCell ? (
              <div className="min-w-0">
                <div
                className="truncate text-[11px] font-semibold text-amber-800"
                title={holidayName}
                >
                {holidayName}
                {extraHolidays > 0 ? (
                    <span className="ml-1 text-amber-700/80">+{extraHolidays}</span>
                ) : null}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* espacio mínimo (sin lista/bolitas de festivos) */}
        <div className="mt-2 min-h-[16px]" />

        {/* Chips */}
        {renderShiftChips()}
      </div>

      {/* fuera de mes */}
      {!inMonth ? <div className="pointer-events-none absolute inset-0 bg-white/50" /> : null}

      {/* cerrado */}
      {isClosed ? (
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute bottom-2 right-2 rounded-md bg-slate-200/60 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
            Cerrado
          </div>
        </div>
      ) : null}

      {/* hoy */}
      {isToday ? (
        <div className="pointer-events-none absolute inset-x-2 top-2 h-[2px] rounded bg-violet-200" />
      ) : null}

      {/* ✅ quitado “Selecciona empleado” */}
      {/* ✅ quitado “Brocha: …” */}
    </button>
  );
}
