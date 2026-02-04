// app/components/calendar/shift-paint/paintEngine.ts

export type ShiftTypeValue =
  | { type: "kind"; kind: string }
  | { type: "template"; templateId: string };

export type ShiftTemplateLite = {
  id: string;
  name: string;
  startMin: number;
  endMin: number;
  color?: string | null;
};

export type PaintedAssignment = {
  employeeIds: string[];
  shiftLabel: string;
};

export type GridWindow = {
  START_HOUR: number;
  HOURS_COUNT: number;
};

export type ResolveArgs = {
  cellId: string; // `${dayKey}|${hourIndex}` (week/day) o `${dayKey}|day` (month)
  selectedEmployeeIds: string[];
  shiftType: ShiftTypeValue;
  shiftTemplates: ShiftTemplateLite[];
  grid: GridWindow;

  /**
   * Te lo pasa el caller (Shell): label ya resuelto
   * - kind: "Trabajo", "Baja", etc.
   * - template: nombre del template
   */
  shiftLabel: string;

  /**
   * Si quieres que en week/day un "kind" pinte bloque completo (día entero),
   * ponlo a true. Por defecto: pinta 1 hora.
   */
  kindPaintsWholeDay?: boolean;
};

export type ResolveResult = {
  dayKey: string;
  affectedCellIds: string[];
  assignment: PaintedAssignment;
};

function clamp(n: number, a: number, b: number) {
  if (n < a) return a;
  if (n > b) return b;
  return n;
}

function parseCellId(cellId: string) {
  const parts = String(cellId).split("|");
  const dayKey = parts[0] || "";
  const slot = parts[1] || "";
  return { dayKey, slot };
}

function findTemplate(
  templates: ShiftTemplateLite[],
  templateId: string
): ShiftTemplateLite | null {
  const idStr = String(templateId);
  for (const t of templates) {
    if (String(t.id) === idStr) return t;
  }
  return null;
}

function hourIndexFromSlot(slot: string) {
  const n = Number(slot);
  if (!Number.isFinite(n)) return null;
  return n;
}

function indicesForTemplate(
  startMin: number,
  endMin: number,
  grid: GridWindow
): { startIndex: number; endIndexExclusive: number } | null {
  const startHour = Math.floor(startMin / 60);
  const endHour = Math.ceil(endMin / 60);

  // Convertimos a índices dentro de la ventana visible
  const startIndex = clamp(startHour - grid.START_HOUR, 0, grid.HOURS_COUNT - 1);
  const endIndexExclusive = clamp(endHour - grid.START_HOUR, 0, grid.HOURS_COUNT);

  // Fuera completamente
  if (endIndexExclusive <= 0) return null;
  if (startIndex >= grid.HOURS_COUNT) return null;

  // Si end == start (por redondeos raros), no pintamos
  if (endIndexExclusive <= startIndex) return null;

  return { startIndex, endIndexExclusive };
}

export function resolvePaintCells(args: ResolveArgs): ResolveResult | null {
  if (!args.selectedEmployeeIds || args.selectedEmployeeIds.length === 0) return null;

  const { dayKey, slot } = parseCellId(args.cellId);
  if (!dayKey) return null;

  // Month (|day) NO se gestiona aquí (por ahora)
  if (slot === "day") return null;

  const assignment: PaintedAssignment = {
    employeeIds: [...args.selectedEmployeeIds],
    shiftLabel: args.shiftLabel,
  };

  // 1) KIND
  if (args.shiftType.type === "kind") {
    // Por defecto: 1 hora (la celda pintada)
    if (!args.kindPaintsWholeDay) {
      const hourIndex = hourIndexFromSlot(slot);
      if (hourIndex === null) return null;

      return {
        dayKey,
        affectedCellIds: [`${dayKey}|${hourIndex}`],
        assignment,
      };
    }

    // Opcional: día entero
    const all: string[] = [];
    for (let i = 0; i < args.grid.HOURS_COUNT; i += 1) {
      all.push(`${dayKey}|${i}`);
    }

    return {
      dayKey,
      affectedCellIds: all,
      assignment,
    };
  }

  // 2) TEMPLATE
  const t = findTemplate(args.shiftTemplates, args.shiftType.templateId);
  if (!t) return null;

  const idx = indicesForTemplate(t.startMin, t.endMin, args.grid);
  if (!idx) return null;

  const out: string[] = [];
  for (let i = idx.startIndex; i < idx.endIndexExclusive; i += 1) {
    out.push(`${dayKey}|${i}`);
  }

  return {
    dayKey,
    affectedCellIds: out,
    assignment,
  };
}
