// app/components/shift-calendar/calendar/views/week/WeekDayHeaderRow.tsx
"use client";

type DayHeader = {
  key: string; // YYYY-MM-DD
  label: string; // LUN 12
  isWeekend: boolean;
};

export default function WeekDayHeaderRow({ days }: { days: DayHeader[] }) {
  return (
    <div className="grid grid-cols-7 border-b border-slate-200 bg-white">
      {days.map((d) => (
        <div
          key={d.key}
          className={[
            "h-10 px-3 flex items-center justify-between",
            d.isWeekend ? "bg-sky-50" : "bg-white",
          ].join(" ")}
        >
          <div className="text-xs font-semibold text-slate-800">{d.label}</div>
        </div>
      ))}
    </div>
  );
}
