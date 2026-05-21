// app/components/shift-calendar/paint-manager.ts

export type ShiftKind = "WORK" | "VACATION" | "OFF" | "SICK";
export type BrushKind = ShiftKind | "ERASE";

/**
 * Estado local de "pintado" (sin BBDD):
 * dayKey (YYYY-MM-DD) -> employeeId -> ShiftKind
 */
export type PaintState = Record<string, Record<string, ShiftKind>>;

export const SHIFT_KIND_ORDER: ShiftKind[] = ["WORK", "VACATION", "OFF", "SICK"];

export function nextKind(k: ShiftKind): ShiftKind {
  const idx = SHIFT_KIND_ORDER.indexOf(k);
  const next = idx === -1 ? 0 : (idx + 1) % SHIFT_KIND_ORDER.length;
  return SHIFT_KIND_ORDER[next];
}

export function kindLabelEs(k: ShiftKind): string {
  if (k === "WORK") return "Trabajo";
  if (k === "VACATION") return "Vacaciones";
  if (k === "OFF") return "Libre";
  return "Baja";
}

export function brushLabelEs(k: BrushKind): string {
  if (k === "ERASE") return "Borrar";
  return kindLabelEs(k);
}

/**
 * Clases tailwind de chip por tipo (claritos).
 */
export function kindChipClasses(k: ShiftKind): string {
  if (k === "WORK") return "bg-emerald-100 text-emerald-800 border-emerald-200";
  if (k === "VACATION") return "bg-sky-100 text-sky-800 border-sky-200";
  if (k === "OFF") return "bg-slate-100 text-slate-700 border-slate-200";
  return "bg-rose-100 text-rose-800 border-rose-200";
}

/**
 * Clases para botones de brocha (incluye ERASE).
 */
export function brushButtonClasses(k: BrushKind): string {
  if (k === "ERASE") return "bg-slate-50 text-slate-700 border-slate-200";
  return kindChipClasses(k);
}

/**
 * Aplica un tipo a un día para N empleados.
 */
export function applyPaint(
  prev: PaintState,
  dayKey: string,
  employeeIds: string[],
  kind: ShiftKind
): PaintState {
  if (employeeIds.length === 0) return prev;

  const next: PaintState = { ...prev };
  const day = { ...(next[dayKey] ?? {}) };

  for (const id of employeeIds) {
    day[id] = kind;
  }

  next[dayKey] = day;
  return next;
}

/**
 * Borra el estado de un día para N empleados.
 */
export function clearPaint(
  prev: PaintState,
  dayKey: string,
  employeeIds: string[]
): PaintState {
  if (employeeIds.length === 0) return prev;

  const existingDay = prev[dayKey];
  if (!existingDay) return prev;

  const day = { ...existingDay };
  let changed = false;

  for (const id of employeeIds) {
    if (day[id] != null) {
      delete day[id];
      changed = true;
    }
  }

  if (!changed) return prev;

  const next: PaintState = { ...prev };

  if (Object.keys(day).length === 0) {
    delete next[dayKey];
    return next;
  }

  next[dayKey] = day;
  return next;
}

/**
 * Rotación por click:
 * - Si está vacío: set brush
 * - Si tiene algo: rota desde el valor actual
 */
export function rotateForDay(
  prev: PaintState,
  dayKey: string,
  employeeIds: string[],
  brush: ShiftKind
): PaintState {
  if (employeeIds.length === 0) return prev;

  const day = prev[dayKey] ?? {};
  const base = day[employeeIds[0]];

  if (!base) return applyPaint(prev, dayKey, employeeIds, brush);

  const k = nextKind(base);
  return applyPaint(prev, dayKey, employeeIds, k);
}

/**
 * Agrupa (para mostrar chips compactos en mes):
 * dayKey -> { kind -> count }
 */
export function groupDayKinds(day: Record<string, ShiftKind> | undefined) {
  const counts: Record<ShiftKind, number> = {
    WORK: 0,
    VACATION: 0,
    OFF: 0,
    SICK: 0,
  };

  if (!day) return counts;

  for (const k of Object.values(day)) {
    if (k === "WORK") counts.WORK += 1;
    if (k === "VACATION") counts.VACATION += 1;
    if (k === "OFF") counts.OFF += 1;
    if (k === "SICK") counts.SICK += 1;
  }

  return counts;
}
