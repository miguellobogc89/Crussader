// app/components/shift-calendar/calendar/views/week/WeekTimeAxis.tsx
"use client";

function fmtTick(min: number) {
  const dayOffset = min >= 24 * 60 ? 1 : 0;
  const m = min % (24 * 60);
  const hh = Math.floor(m / 60);
  const mm = m % 60;

  const time = `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
  if (dayOffset === 0) return time;

  // para nocturnos: 00:00+1, 01:00+1...
  return `${time} +1`;
}

export default function WeekTimeAxis({
  ticks,
  rowHeight = 56,
}: {
  ticks: number[];      // minutos en eje operativo (0..2880)
  rowHeight?: number;   // altura por fila
}) {
  return (
    <div className="sticky left-0 z-10 bg-white">
      <div className="h-10 border-b border-slate-200 bg-white" />

      <div
        className="grid"
        style={{ gridTemplateRows: `repeat(${ticks.length}, ${rowHeight}px)` }}
      >
        {ticks.map((t) => (
          <div
            key={t}
            className="flex items-start justify-end border-b border-slate-200 pr-2 pt-1 text-[11px] font-semibold text-slate-500"
            title={`${t} min`}
          >
            {fmtTick(t)}
          </div>
        ))}
      </div>
    </div>
  );
}
