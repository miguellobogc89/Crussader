// app/components/shift-calendar/calendar/views/week/WeekGrid.tsx
"use client";

type Handlers = {
  onPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => void;
  onPointerMove: (e: React.PointerEvent<HTMLButtonElement>) => void;
  onPointerEnter: () => void;
  onPointerUp: (e: React.PointerEvent<HTMLButtonElement>) => void;
};

export default function WeekGrid({
  dayKeys,
  dayDates,
  ticks,
  rowHeight = 56,
  isClosedCell,
  onClickCell,
  getCellHandlers,
}: {
  dayKeys: string[]; // 7 elementos (orden semana)
  dayDates: Date[];  // 7 fechas reales (mismo orden)
  ticks: number[];   // minutos (0..2880)
  rowHeight?: number;
  isClosedCell: (dayIndex: number, minute: number) => boolean;
  onClickCell: (dayKey: string, minute: number) => void;

  getCellHandlers: (args: { date: Date; dayKey: string; inMonth: boolean }) => Handlers;
}) {
  return (
    <div className="grid grid-cols-7">
      {dayKeys.map((dayKey, dayIndex) => {
        const date = dayDates[dayIndex];
        const inMonth = true; // en week no aplicamos “fuera de mes” (de momento)

        return (
          <div key={dayKey} className="border-r border-slate-300 last:border-r-0">
            <div
              className="grid"
              style={{ gridTemplateRows: `repeat(${ticks.length}, ${rowHeight}px)` }}
            >
              {ticks.map((t) => {
                const closed = isClosedCell(dayIndex, t);

                // ✅ gesto de pintura (pinta por dayKey, aunque estés en “horas”)
                const handlers = getCellHandlers({ date, dayKey, inMonth });

                return (
                  <button
                    key={`${dayKey}-${t}`}
                    type="button"
                    onClick={() => onClickCell(dayKey, t)}
                    onPointerDown={handlers.onPointerDown}
                    onPointerMove={handlers.onPointerMove}
                    onPointerEnter={handlers.onPointerEnter}
                    onPointerUp={handlers.onPointerUp}
                    className={[
                      "w-full border-b border-slate-200 transition",
                      closed
                        ? "bg-slate-100/40 cursor-not-allowed"
                        : "hover:bg-slate-50",
                    ].join(" ")}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
