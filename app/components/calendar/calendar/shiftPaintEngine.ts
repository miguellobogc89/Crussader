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

export type PaintedAssignment = {
  employeeIds: string[];
  shiftLabel: string;
};

type ApplyArgs = {
  prevBlocks: PaintBlock[];
  cellId: string;

  selectedEmployeeIds: string[];
  shiftType: ShiftTypeValue;
  templates: ShiftTemplateLite[];

  START_HOUR: number;
  HOURS_COUNT: number;

  resolveLabel: () => string;
};

export function applyPaintWeekLike(args: ApplyArgs): PaintBlock[] {
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

  // Si el templateId corresponde a un template con horas, pintar el rango completo
  const id = String(shiftType.templateId);
  const t = templates.find((x) => String(x.id) === id);

  if (t && typeof t.startMin === "number" && typeof t.endMin === "number") {
    const startMin = t.startMin;
    const endMin = t.endMin;

    const startHour = Math.floor(startMin / 60);
    const endHour = Math.ceil(endMin / 60);

    startIndex = Math.max(0, startHour - START_HOUR);
    endIndex = Math.min(HOURS_COUNT, endHour - START_HOUR);

    if (startIndex >= endIndex) return prevBlocks;
  }

  const label = resolveLabel();

  const next: PaintBlock[] = prevBlocks.filter((b) => {
    if (b.dayKey !== dayKey) return true;
    const overlap = rangesOverlap(b.startIndex, b.endIndex, startIndex, endIndex);
    if (overlap) return false;
    return true;
  });

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

/**
 * Motor “con autoridad” (sin React): encapsula selection + apply + derivaciones.
 * La idea es que el orquestador solo le pase snapshots y propague resultados.
 */
export function createShiftPaintEngine(opts: {
  START_HOUR: number;
  HOURS_COUNT: number;
  getSelectedEmployeeIds: () => string[];
  getShiftType: () => ShiftTypeValue;
  getTemplates: () => ShiftTemplateLite[];
  resolveLabel: () => string;
}) {
  const { START_HOUR, HOURS_COUNT, getSelectedEmployeeIds, getShiftType, getTemplates, resolveLabel } =
    opts;

  function apply(cellId: string, prevBlocks: PaintBlock[]) {
    const selectedEmployeeIds = getSelectedEmployeeIds();
    if (selectedEmployeeIds.length === 0) return prevBlocks;

    return applyPaintWeekLike({
      prevBlocks,
      cellId,
      selectedEmployeeIds,
      shiftType: getShiftType(),
      templates: getTemplates(),
      START_HOUR,
      HOURS_COUNT,
      resolveLabel,
    });
  }

  function toPaintedCellIds(blocks: PaintBlock[]) {
    const s = new Set<string>();

    for (const b of blocks) {
      const from = Math.max(0, b.startIndex);
      const to = Math.min(HOURS_COUNT, b.endIndex);

      for (let i = from; i < to; i += 1) {
        s.add(`${b.dayKey}|${i}`);
      }
    }

    return s;
  }

  function toPaintedMap(blocks: PaintBlock[]) {
    const m = new Map<string, PaintedAssignment>();

    for (const b of blocks) {
      const from = Math.max(0, b.startIndex);
      const to = Math.min(HOURS_COUNT, b.endIndex);

      for (let i = from; i < to; i += 1) {
        m.set(`${b.dayKey}|${i}`, {
          employeeIds: b.employeeIds,
          shiftLabel: b.label,
        });
      }
    }

    return m;
  }

  return {
    apply,
    toPaintedCellIds,
    toPaintedMap,
  };
}
