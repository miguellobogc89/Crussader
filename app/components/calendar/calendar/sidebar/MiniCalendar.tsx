// app/components/calendar/calendar/sidebar/MiniCalendar.tsx
"use client";

type Props = {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
};

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function startOfCalendarGrid(date: Date) {
  const first = startOfMonth(date);
  const day = first.getDay();
  const diff = day === 0 ? -6 : 1 - day;

  const start = new Date(first);
  start.setDate(first.getDate() + diff);

  return start;
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export default function MiniCalendar({ selectedDate, onSelectDate }: Props) {
  const today = new Date();

  const monthLabel = selectedDate.toLocaleDateString("es-ES", {
    month: "long",
    year: "numeric",
  });

  const gridStart = startOfCalendarGrid(selectedDate);

  const days = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    return d;
  });

  return (
    <>
      <div className="border-b border-slate-200 px-3 py-2 xl2:px-4 xl2:py-3">
        <h2 className="text-xs font-semibold capitalize text-slate-900 xl2:text-sm">
          {monthLabel}
        </h2>
      </div>

      <div className="px-2.5 py-3 xl2:px-3 xl2:py-4">
        <div className="mb-1.5 grid grid-cols-7 gap-1 xl2:mb-2">
          {["L", "M", "X", "J", "V", "S", "D"].map((day) => (
            <div
              key={day}
              className="flex h-6 items-center justify-center text-[10px] font-semibold text-slate-400 xl2:h-8 xl2:text-[11px]"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const isTodayDay = isSameDay(day, today);
            const isSelected = isSameDay(day, selectedDate);
            const isCurrentMonth = day.getMonth() === selectedDate.getMonth();

            return (
              <button
                key={day.toISOString()}
                type="button"
                onClick={() => onSelectDate(day)}
                className={[
                  "flex h-7 items-center justify-center rounded-lg text-xs font-medium transition-colors xl2:h-9 xl2:rounded-xl xl2:text-sm",
                  isSelected ? "bg-blue-600 text-white shadow-sm" : "",
                  !isSelected && isTodayDay ? "bg-blue-50 text-blue-700" : "",
                  !isSelected && !isTodayDay
                    ? "text-slate-700 hover:bg-slate-100"
                    : "",
                  !isCurrentMonth ? "opacity-35" : "",
                ].join(" ")}
              >
                {day.getDate()}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}