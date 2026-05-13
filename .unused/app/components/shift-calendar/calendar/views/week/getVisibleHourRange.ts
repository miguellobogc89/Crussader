// app/components/shift-calendar/calendar/views/week/getVisibleHourRange.ts
"use client";

export type OpeningRange = {
  /** "HH:MM" en hora local (Europe/Madrid). Ej: "23:00" */
  start: string;
  /** "HH:MM" en hora local (Europe/Madrid). Ej: "05:00" */
  end: string;
};

export type VisibleHourRange = {
  /**
   * Minuto inicio en “día operativo”.
   * Rango continuo: 0..(48*60)
   * Ej:
   * 21:00 => 1260
   * 07:00 (día siguiente) => 24*60 + 420 = 1860
   */
  startMin: number;
  endMin: number;

  /** true si el rango real (sin margen) cruzaba medianoche */
  crossesMidnight: boolean;
};

function parseHHMM(s: string): number | null {
  const m = String(s).trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const hh = Number(m[1]);
  const mm = Number(m[2]);
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null;
  if (hh < 0 || hh > 23) return null;
  if (mm < 0 || mm > 59) return null;
  return hh * 60 + mm;
}

function clamp(n: number, min: number, max: number) {
  if (n < min) return min;
  if (n > max) return max;
  return n;
}

function toMinutes(t: any): number {
  const h = typeof t?.hours === "number" ? t.hours : 0;
  const m = typeof t?.minutes === "number" ? t.minutes : 0;
  return h * 60 + m;
}

/**
 * Calcula la ventana visible para vista semanal (día operativo).
 *
 * - Lee openingHoursRaw en formato `{ periods: [...] }` (Google/DB).
 * - Calcula apertura mínima y cierre máximo de la semana.
 * - Aplica margen a ambos lados (por defecto 120 min). Para “2h antes”, pasa 120.
 * - Devuelve minutos en eje continuo (0..2880).
 *
 * Fallback si no hay openingHours válido: 08:00→20:00 + margen.
 */
export function getVisibleHourRange(
  openingHours: any | null | undefined,
  marginMinutes = 120
): VisibleHourRange {
  const fallbackStart = 8 * 60;
  const fallbackEnd = 20 * 60;

  // Fallback si no viene el JSON esperado
  if (!openingHours?.periods || !Array.isArray(openingHours.periods)) {
    const startMin = clamp(fallbackStart - marginMinutes, 0, 48 * 60);
    const endMin = clamp(fallbackEnd + marginMinutes, 0, 48 * 60);
    return { startMin, endMin, crossesMidnight: false };
  }

  let minOpen = Infinity;
  let maxClose = -Infinity;
  let hasNonMidnightOpen = false;

  for (const p of openingHours.periods) {
    const start = toMinutes(p.openTime);
    const end = toMinutes(p.closeTime);

    if (end > maxClose) maxClose = end;

    if (start > 0) {
      hasNonMidnightOpen = true;
      if (start < minOpen) minOpen = start;
    } else {
      // start === 0 -> 00:00, lo dejamos para decidir luego
      if (start < minOpen) minOpen = start;
    }
  }

  if (hasNonMidnightOpen) {
    // si había aperturas reales, fuerza minOpen a la mínima > 0
    minOpen = Infinity;
    for (const p of openingHours.periods) {
      const start = toMinutes(p.openTime);
      if (start > 0 && start < minOpen) minOpen = start;
    }
  }


  // Seguridad si el contenido es raro
  if (!Number.isFinite(minOpen) || !Number.isFinite(maxClose)) {
    const startMin = clamp(fallbackStart - marginMinutes, 0, 48 * 60);
    const endMin = clamp(fallbackEnd + marginMinutes, 0, 48 * 60);
    return { startMin, endMin, crossesMidnight: false };
  }

  // En tu JSON puede haber cierres a las 01:00 y reaperturas a las 13:00,
  // esto NO implica cruce real de medianoche del “rango operativo”, así que
  // mantenemos crossesMidnight en false para el eje semanal simple.
  const crossesMidnight = false;

  const startMin = clamp(minOpen - marginMinutes, 0, 48 * 60);
  const endMin = clamp(maxClose + marginMinutes, 0, 48 * 60);

  // seguridad: mínimo 1h visible
  if (endMin - startMin < 60) {
    const mid = Math.floor((startMin + endMin) / 2);
    return {
      startMin: clamp(mid - 30, 0, 48 * 60),
      endMin: clamp(mid + 30, 0, 48 * 60),
      crossesMidnight,
    };
  }

  return { startMin, endMin, crossesMidnight };
}
