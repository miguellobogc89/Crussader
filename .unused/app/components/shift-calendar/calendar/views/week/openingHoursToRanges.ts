// app/components/shift-calendar/calendar/views/week/openingHoursToRanges.ts
"use client";

type Period = {
  openDay: string;
  closeDay: string;
  openTime?: { hours?: number; minutes?: number };
  closeTime?: { hours?: number; minutes?: number };
};

export type DayRange = {
  startMin: number;
  endMin: number;
};

const DAY_INDEX: Record<string, number> = {
  MONDAY: 0,
  TUESDAY: 1,
  WEDNESDAY: 2,
  THURSDAY: 3,
  FRIDAY: 4,
  SATURDAY: 5,
  SUNDAY: 6,
};

function toMinutes(t?: { hours?: number; minutes?: number }) {
  const h = t?.hours ?? 0;
  const m = t?.minutes ?? 0;
  return h * 60 + m;
}

/**
 * Devuelve rangos abiertos por día de semana (0=lunes)
 * Los rangos pueden pasar de 24h (cruce de medianoche)
 */
export function openingHoursToRanges(
  openingHours: any | null
): Record<number, DayRange[]> {
  const result: Record<number, DayRange[]> = {};

  if (!openingHours?.periods) return result;

  for (const p of openingHours.periods as Period[]) {
    const openDay = DAY_INDEX[p.openDay];
    const closeDay = DAY_INDEX[p.closeDay];

    if (openDay == null || closeDay == null) continue;

    const start = toMinutes(p.openTime);
    let end = toMinutes(p.closeTime);

    // 24 significa 24:00
    if (p.closeTime?.hours === 24) end = 24 * 60;

    // mismo día
    if (openDay === closeDay && end > start) {
      result[openDay] ??= [];
      result[openDay].push({ startMin: start, endMin: end });
      continue;
    }

    // cruce de medianoche
    result[openDay] ??= [];
    result[openDay].push({ startMin: start, endMin: 24 * 60 });

    const nextDay = (openDay + 1) % 7;
    result[nextDay] ??= [];
    result[nextDay].push({ startMin: 0, endMin: end });
  }

  return result;
}
