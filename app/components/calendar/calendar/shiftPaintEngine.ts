// app/components/calendar/calendar/shiftPaintEngine.ts

import type {
  ShiftTypeValue,
  ShiftTemplateLite,
} from "@/app/components/calendar/details/shifts/ShiftList";

export type PaintBlock = {
  dayKey: string;
  startIndex: number; // índice relativo al grid
  endIndex: number; // exclusivo
  employeeIds: string[];
  label: string;
};

type Args = {
  prevBlocks: PaintBlock[];
  cellId: string;
  selectedEmployeeIds: string[];
  shiftType: ShiftTypeValue;
  templates: ShiftTemplateLite[];
  START_HOUR: number;
  HOURS_COUNT: number;
  resolveLabel: () => string;
};

export function applyPaintWeekLike(args: Args): PaintBlock[] {
  const {
    prevBlocks,
    cellId,
    selectedEmployeeIds,
    shiftType,
    templates,
    START_HOUR,
    HOURS_COUNT,
    resolveLabel,
  } = args;

  const parts = String(cellId).split("|");
  const dayKey = parts[0];
  const slot = parts[1];

  if (!dayKey) return prevBlocks;
  if (slot === "day") return prevBlocks;

  const hourIndex = Number(slot);
  if (!Number.isFinite(hourIndex)) return prevBlocks;

  let startIndex = hourIndex;
  let endIndex = hourIndex + 1;

  // ✅ si el templateId corresponde a un template con horas, pintar el rango completo
  const id = String(shiftType.templateId);
  const t = templates.find((x) => String(x.id) === id);

  if (
    t &&
    typeof t.startMin === "number" &&
    typeof t.endMin === "number"
  ) {
    const startMin = t.startMin;
    const endMin = t.endMin;

    const startHour = Math.floor(startMin / 60);
    const endHour = Math.ceil(endMin / 60);

    startIndex = Math.max(0, startHour - START_HOUR);
    endIndex = Math.min(HOURS_COUNT, endHour - START_HOUR);

    if (startIndex >= endIndex) return prevBlocks;
  }


  const label = resolveLabel();

  const next: PaintBlock[] = prevBlocks.filter(
    (b) =>
      !(
        b.dayKey === dayKey &&
        rangesOverlap(b.startIndex, b.endIndex, startIndex, endIndex)
      )
  );

  next.push({
    dayKey,
    startIndex,
    endIndex,
    employeeIds: [...selectedEmployeeIds],
    label,
  });

  return next;
}

function rangesOverlap(a1: number, a2: number, b1: number, b2: number) {
  return a1 < b2 && b1 < a2;
}
