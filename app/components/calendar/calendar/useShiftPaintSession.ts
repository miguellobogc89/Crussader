// app/components/calendar/calendar/useShiftPaintSession.ts
"use client";

import { useCallback, useMemo, useState } from "react";

import {
  applyPaintWeekLike,
  type PaintBlock,
} from "@/app/components/calendar/calendar/shiftPaintEngine";

import type {
  ShiftTemplateLite,
  ShiftTypeValue,
} from "@/app/components/calendar/details/shifts/ShiftList";

type UseShiftPaintSessionArgs = {
  START_HOUR: number;
  HOURS_COUNT: number;
};

export type PaintSelection = {
  selectedEmployeeIds: string[];
  shiftType: ShiftTypeValue;
  templates: ShiftTemplateLite[];
};

export type ShiftPaintSession = {
  blocks: PaintBlock[];
  setBlocks: (next: PaintBlock[] | ((prev: PaintBlock[]) => PaintBlock[])) => void;

  selection: PaintSelection;
  setSelection: (next: PaintSelection) => void;

  resolveShiftLabel: () => string;

  canPaint: boolean;
  paintCell: (cellId: string) => void;
};

export function useShiftPaintSession({
  START_HOUR,
  HOURS_COUNT,
}: UseShiftPaintSessionArgs): ShiftPaintSession {
  const [blocks, setBlocks] = useState<PaintBlock[]>([]);

  const [selection, setSelection] = useState<PaintSelection>(() => ({
    selectedEmployeeIds: [],
    shiftType: { templateId: "standard" },
    templates: [],
  }));

  const resolveShiftLabel = useCallback(() => {
    const id = String(selection.shiftType.templateId);

    if (id === "standard") return "Turno estándar";
    if (id === "abs_vacation") return "Vacaciones";
    if (id === "abs_sick") return "Baja";
    if (id === "abs_off") return "Permiso";

    const t = selection.templates.find((x) => String(x.id) === id);
    if (t) return t.name;

    return "Turno";
  }, [selection.shiftType, selection.templates]);

  const canPaint = useMemo(() => {
    if (selection.selectedEmployeeIds.length === 0) return false;
    return true;
  }, [selection.selectedEmployeeIds]);

  const paintCell = useCallback(
    (cellId: string) => {
      if (!canPaint) return;

      setBlocks((prev) => {
        return applyPaintWeekLike({
          prevBlocks: prev,
          cellId,
          selectedEmployeeIds: selection.selectedEmployeeIds,
          shiftType: selection.shiftType,
          templates: selection.templates,
          START_HOUR,
          HOURS_COUNT,
          resolveLabel: resolveShiftLabel,
        });
      });
    },
    [
      canPaint,
      selection.selectedEmployeeIds,
      selection.shiftType,
      selection.templates,
      START_HOUR,
      HOURS_COUNT,
      resolveShiftLabel,
    ]
  );

  return {
    blocks,
    setBlocks,

    selection,
    setSelection,

    resolveShiftLabel,

    canPaint,
    paintCell,
  };
}
