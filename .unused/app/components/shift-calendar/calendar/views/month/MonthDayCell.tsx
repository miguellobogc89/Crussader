// app/components/shift-calendar/calendar/views/month/MonthDayCell.tsx
"use client";

import { Users } from "lucide-react";
import { Badge } from "@/app/components/ui/badge";
import type { PaintableGridHandlers } from "@/app/components/shift-calendar/calendar/PaintableGrid";

import type {
  PaintState,
  BrushKind,
  ShiftKind,
} from "@/app/components/shift-calendar/paint-manager";
import {
  groupDayKinds,
  kindChipClasses,
  kindLabelEs,
} from "@/app/components/shift-calendar/paint-manager";

type Holiday = {
  id: string;
  date: string;
  name: string;
  isClosed: boolean;
  locationId?: string | null;
};

function isWeekend(d: Date) {
  const w = d.getDay();
  return w === 0 || w === 6;
}

export default function MonthDayCell({
  id,
  date,
  inMonth,
  isToday,
  isSelected,
  isClosed,
  holidays,
  paint,
  handlers,
  onSelectDay,
}: {
  id: string;
  date: Date;
  inMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  isClosed: boolean;
  holidays: Holiday[];

  paint: PaintState;
  handlers: PaintableGridHandlers;

  onSelectDay: (d: Date) => void;
}) {
  const hasHoliday = holidays.length > 0;
  const weekend = isWeekend(date);

  const bgWeekend = weekend ? "bg-sky-50" : "";
  const bgHoliday = hasHoliday ? "bg-amber-50" : "";

  // closed overlay (very subtle)
  const closedShade = isClosed ? "bg-slate-50" : "";

  // keep height stable
  const cellMinH = "min-h-[112px]";

  const dayMap = paint[id] || null;

  const maxChipsToShow = 2;

  function renderShiftChips() {
    if (!dayMap) return null;

    const counts = groupDayKinds(dayMap);
    const kindsInOrder: ShiftKind[] = ["WORK", "VACATION", "OFF", "SICK"];

    const chips = kindsInOrder
      .filter((k) => (counts[k] || 0) > 0)
      .map((k) => ({ kind: k, count: counts[k] }));

    if (chips.length === 0) return null;

    const shown = chips.slice(0, maxChipsToShow);
    const rest = chips.length - shown.length;

    return (
      <div className="mt-2 space-y-1">
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
            <span className="inline-flex items-center gap-1 shrink-0 opacity-80">
              <Users className="h-3.5 w-3.5" />
              {count}
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
      key={id}
      type="button"
      onClick={() => onSelectDay(date)}
      onPointerDown={handlers.onPointerDown}
      onPointerMove={handlers.onPointerMove}
      onPointerEnter={handlers.onPointerEnter}
      onPointerUp={handlers.onPointerUp}
      className={[
        "group relative border-b border-r transition text-left p-2",
        "border-slate-300", // darker borders
        "hover:bg-slate-50",
        cellMinH,
        isSelected ? "bg-violet-50" : "bg-white",
        bgWeekend,
        bgHoliday,
        closedShade,
        weekend ? "border-sky-200" : "", // weekend border blue-ish
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-2">
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

        {/* holiday tag removed; we show names inline (no dot) */}
        {hasHoliday ? (
          <Badge className="h-6 rounded-lg bg-amber-100 text-amber-800 hover:bg-amber-100">
            Festivo
          </Badge>
        ) : null}
      </div>

      {/* Holiday names (blue-ish darker, no bullet) */}
      {hasHoliday ? (
        <div className="mt-2 space-y-1">
          {holidays.slice(0, 2).map((h) => (
            <div
              key={h.id}
              className="truncate text-[11px] font-semibold text-sky-800"
              title={h.name}
            >
              {h.name}
            </div>
          ))}
          {holidays.length > 2 ? (
            <div className="text-[11px] text-slate-500">+{holidays.length - 2} más</div>
          ) : null}
        </div>
      ) : (
        // no ugly dashes anymore
        <div className="mt-2 text-[11px] text-transparent select-none">.</div>
      )}

      {/* Painted chips */}
      {renderShiftChips()}

      {/* outside-month overlay */}
      {!inMonth ? <div className="pointer-events-none absolute inset-0 bg-white/50" /> : null}

      {/* closed overlay tag */}
      {isClosed ? (
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute bottom-2 right-2 rounded-md bg-slate-200/60 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
            Cerrado
          </div>
        </div>
      ) : null}

      {/* today top bar */}
      {isToday ? (
        <div className="pointer-events-none absolute inset-x-2 top-2 h-[2px] rounded bg-violet-200" />
      ) : null}
    </button>
  );
}
