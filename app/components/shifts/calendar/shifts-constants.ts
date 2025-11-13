// app/components/shifts-constants.ts

export type ShiftType = "WORK" | "VACATION" | "SICK" | "OTHER";

export type LocalShift = {
  employeeId: string;
  date: string; // "yyyy-MM-dd"
  hour: number; // 0–23
  type: ShiftType;
};

export type ViewMode = "week" | "month";

export const HOURS = Array.from({ length: 13 }).map((_, i) => 8 + i); // 08:00–20:00

export const SHIFT_TYPE_LABEL: Record<ShiftType, string> = {
  WORK: "Turno",
  VACATION: "Vacaciones",
  SICK: "Baja",
  OTHER: "Otros",
};

export const SHIFT_TYPE_COLOR: Record<ShiftType, string> = {
  WORK: "bg-emerald-100 text-emerald-800 border-emerald-200",
  VACATION: "bg-amber-100 text-amber-800 border-amber-200",
  SICK: "bg-rose-100 text-rose-800 border-rose-200",
  OTHER: "bg-sky-100 text-sky-800 border-sky-200",
};

// Colores específicos para la VISTA MES (rellenar el bloque del día)
export const SHIFT_TYPE_MONTH_BG: Record<ShiftType, string> = {
  WORK: "bg-emerald-50 border-emerald-100",
  VACATION: "bg-amber-50 border-amber-100",
  SICK: "bg-rose-50 border-rose-100",
  OTHER: "bg-sky-50 border-sky-100",
};
