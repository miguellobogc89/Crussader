// app/components/calendar/CalendarOnly/shiftPaintPolicy.ts

export type PaintedAssignment = {
  employeeIds: string[];
  shiftLabel: string;
};

export function normalizePaintCellId(args: {
  cellId: string;
  mode: "standard" | "template";
}) {
  const parts = String(args.cellId).split("|");
  const dayKey = parts[0] ?? "";
  if (!dayKey) return args.cellId;

  // ✅ mantenemos esto porque tu engine lo espera
  if (args.mode === "standard") {
    return `${dayKey}|day`;
  }

  return args.cellId;
}

export function upsertPaintedMap(args: {
  prev: Map<string, PaintedAssignment>;
  cellId: string;
  assignment: PaintedAssignment;
  mode: "standard" | "template";
}) {
  void args.mode;

  const next = new Map(args.prev);

  // ✅ CLAVE: NO borrar todo el día.
  // Ese loop era el que hacía que el template “desapareciera”.
  next.set(String(args.cellId), args.assignment);

  return next;
}

export function buildHourBlocks(args: {
  dayKey: string;
  HOURS_COUNT: number;
  ROW_PX: number;
  painted?: Map<string, PaintedAssignment>;
}) {
  const { dayKey, HOURS_COUNT, ROW_PX, painted } = args;

  const blocks: Array<{
    top: number;
    height: number;
    assignment: PaintedAssignment;
  }> = [];

  if (!painted) return blocks;

  function makeHourCellId(hourIndex: number) {
    return `${dayKey}|${hourIndex}`;
  }

  function sig(a: PaintedAssignment) {
    const ids = [...a.employeeIds].map(String).sort().join(",");
    return `${a.shiftLabel}|${ids}`;
  }

  let i = 0;
  while (i < HOURS_COUNT) {
    const a = painted.get(makeHourCellId(i));
    if (!a) {
      i += 1;
      continue;
    }

    const s = sig(a);

    let j = i + 1;
    while (j < HOURS_COUNT) {
      const b = painted.get(makeHourCellId(j));
      if (!b) break;
      if (sig(b) !== s) break;
      j += 1;
    }

    blocks.push({
      top: i * ROW_PX,
      height: (j - i) * ROW_PX,
      assignment: a,
    });

    i = j;
  }

  return blocks;
}
