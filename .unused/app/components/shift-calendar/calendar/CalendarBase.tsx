// app/components/shift-calendar/calendar/CalendarBase.tsx
"use client";

import { Card } from "@/app/components/ui/card";
import { useState } from "react";
import CursorChip from "@/app/components/shift-calendar/calendar/CursorChip";
import useCalendarPaintGesture from "@/app/components/shift-calendar/calendar/useCalendarPaintGesture";
import type { BrushKind } from "@/app/components/shift-calendar/paint-manager";

type Handlers = {
  onPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => void;
  onPointerMove: (e: React.PointerEvent<HTMLButtonElement>) => void;
  onPointerEnter: () => void;
  onPointerUp: (e: React.PointerEvent<HTMLButtonElement>) => void;
};

export default function CalendarBase({
  brushEnabled,
  brushKind,
  selectedEmployeeIds,
  onSelectDay,
  onPaintDay,
  children,
}: {
  brushEnabled: boolean;
  brushKind: BrushKind;
  selectedEmployeeIds: string[];

  onSelectDay: (d: Date) => void;
  onPaintDay: (dayKey: string) => void;

  children: (api: {
    getCellHandlers: (args: { date: Date; dayKey: string; inMonth: boolean }) => Handlers;
  }) => React.ReactNode;
}) {
  const { getCellHandlers } = useCalendarPaintGesture({
    brushEnabled,
    brushKind,
    selectedEmployeeIds,
    onSelectDay,
    onPaintDay,
  });

  const [hovering, setHovering] = useState(false);

  return (
    <Card
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
      onPointerEnter={() => setHovering(true)}
      onPointerLeave={() => setHovering(false)}
    >
      <CursorChip
        show={hovering && brushEnabled && selectedEmployeeIds.length > 0}
        brushKind={brushKind}
      />

      {children({ getCellHandlers })}
    </Card>
  );
}
