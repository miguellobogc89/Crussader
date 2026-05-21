// app/components/shift-calendar/calendar/useCalendarPaintGesture.ts
"use client";

import { useEffect, useRef } from "react";
import type { BrushKind } from "@/app/components/shift-calendar/paint-manager";

export default function useCalendarPaintGesture({
  brushEnabled,
  brushKind,
  selectedEmployeeIds,
  onSelectDay,
  onPaintDay,
}: {
  brushEnabled: boolean;
  brushKind: BrushKind;
  selectedEmployeeIds: string[];

  onSelectDay: (d: Date) => void;
  onPaintDay: (dayKey: string) => void;
}) {
  const isDownRef = useRef(false);
  const paintedKeysRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    function endGesture() {
      isDownRef.current = false;
      paintedKeysRef.current = new Set();
    }

    window.addEventListener("pointerup", endGesture);
    window.addEventListener("pointercancel", endGesture);
    return () => {
      window.removeEventListener("pointerup", endGesture);
      window.removeEventListener("pointercancel", endGesture);
    };
  }, []);

  function canPaint(inMonth: boolean) {
    if (!inMonth) return false;
    if (!brushEnabled) return false;
    if (selectedEmployeeIds.length === 0) return false;
    return true;
  }

  function paintOnce(dayKey: string) {
    if (paintedKeysRef.current.has(dayKey)) return;
    paintedKeysRef.current.add(dayKey);
    onPaintDay(dayKey);
  }

  function getCellHandlers({
    date,
    dayKey,
    inMonth,
  }: {
    date: Date;
    dayKey: string;
    inMonth: boolean;
  }) {
    return {
      onPointerDown: (_e: React.PointerEvent<HTMLButtonElement>) => {
        onSelectDay(date);

        if (!canPaint(inMonth)) return;

        isDownRef.current = true;
        paintedKeysRef.current = new Set();

        paintOnce(dayKey);
      },

      onPointerMove: (_e: React.PointerEvent<HTMLButtonElement>) => {},

      onPointerEnter: () => {
        if (!isDownRef.current) return;
        if (!canPaint(inMonth)) return;
        paintOnce(dayKey);
      },

      onPointerUp: (_e: React.PointerEvent<HTMLButtonElement>) => {
        isDownRef.current = false;
        paintedKeysRef.current = new Set();
      },
    };
  }

  return { getCellHandlers };
}
