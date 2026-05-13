// app/components/shift-calendar/calendar/views/week/WeekCell.tsx
"use client";

import { Users } from "lucide-react";
import type { PaintableGridHandlers } from "@/app/components/shift-calendar/calendar/PaintableGrid";
import type { PaintState, ShiftKind } from "@/app/components/shift-calendar/paint-manager";
import { groupDayKinds, kindLabelEs } from "@/app/components/shift-calendar/paint-manager";

export default function WeekSlotCell({
  id,
  dayKey,
  isClosed,
  isWeekend,
  rowHeight,
  paint,
  handlers,
}: {
  id: string; // dayKey|minute
  dayKey: string; // YYYY-MM-DD
  isClosed: boolean;
  isWeekend: boolean;
  rowHeight: number;
  paint: PaintState;
  handlers: PaintableGridHandlers;
}) {
  // ✅ FIX: PaintState está indexado por dayKey, no por cell.id (dayKey|minute)
  const dayMap = paint[id];

  const counts = dayMap
    ? groupDayKinds(dayMap)
    : { WORK: 0, VACATION: 0, OFF: 0, SICK: 0 };

  const total = counts.WORK + counts.VACATION + counts.OFF + counts.SICK;

  let topKind: ShiftKind | null = null;

  if (total > 0) {
    topKind = "WORK";

    if (counts.VACATION > counts.WORK) topKind = "VACATION";
    if (counts.OFF > counts[topKind]) topKind = "OFF";
    if (counts.SICK > counts[topKind]) topKind = "SICK";
  }

  let paintBg = "";
  if (topKind === "WORK") paintBg = "bg-emerald-50 hover:bg-emerald-50";
  if (topKind === "VACATION") paintBg = "bg-amber-50 hover:bg-amber-50";
  if (topKind === "OFF") paintBg = "bg-sky-50 hover:bg-sky-50";
  if (topKind === "SICK") paintBg = "bg-rose-50 hover:bg-rose-50";

  const closedBg = isClosed ? "bg-slate-50" : "bg-white";
  const weekendBorder = isWeekend ? "border-blue-200" : "border-slate-200";

  return (
    <button
      key={id}
      type="button"
      onPointerDown={handlers.onPointerDown}
      onPointerMove={handlers.onPointerMove}
      onPointerEnter={handlers.onPointerEnter}
      onPointerUp={handlers.onPointerUp}
      className={[
        "relative w-full",
        "border-b border-r last:border-r-0",
        weekendBorder,
        "transition",
        isClosed ? "" : "hover:bg-slate-100",
        total > 0 ? paintBg : closedBg,
      ].join(" ")}
      style={{ height: `${rowHeight}px` }}
      title={topKind ? `${kindLabelEs(topKind)} — ${total}` : ""}
    >
      {total > 0 ? (
        <div className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-md bg-white/70 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
          <Users className="h-3.5 w-3.5" />
          {total}
        </div>
      ) : null}
    </button>
  );
}
