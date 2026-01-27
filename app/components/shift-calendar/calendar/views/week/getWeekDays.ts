// app/components/shift-calendar/calendar/views/week/getWeekDays.ts
"use client";

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

// semana ISO: lunes como primer día
export function getWeekStartMonday(anchor: Date) {
  const x = startOfDay(anchor);
  const day = x.getDay(); // 0 domingo
  const diff = day === 0 ? -6 : 1 - day;
  return addDays(x, diff);
}

export function getWeekDays(anchor: Date) {
  const start = getWeekStartMonday(anchor);
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) days.push(addDays(start, i));
  return days;
}
