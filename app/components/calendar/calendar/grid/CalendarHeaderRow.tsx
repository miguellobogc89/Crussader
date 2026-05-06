// app/components/calendar/calendar/Grid/CalendarHeaderRow.tsx
"use client";

import BankHolidayCell from "@/app/components/calendar/calendar/BankHolidayCell";
import { localKeyTZ } from "@/app/components/calendar/calendar/tz";

type Mode = "date" | "weekday";

export default function CalendarHeaderRow({
  days,
  fmtDay,
  isToday,
  isHoliday,
  holidayTitle,

  showHourGutter = true,
  mode = "date",
}: {
  days: Date[];
  fmtDay: Intl.DateTimeFormat;
  isToday: (d: Date) => boolean;
  isHoliday: (d: Date) => boolean;
  holidayTitle: (d: Date) => string;

  showHourGutter?: boolean;
  mode?: Mode;
}) {
  function isWeekend(d: Date) {
    const wd = d.getDay();
    return wd === 0 || wd === 6;
  }

  function weekdayLabel(d: Date) {
    const raw = new Intl.DateTimeFormat("es-ES", { weekday: "short" }).format(d);
    return raw.replace(".", "");
  }

  function DayCell({ d }: { d: Date }) {
    const label = mode === "weekday" ? weekdayLabel(d) : fmtDay.format(d);

let cls =
  "h-10 flex items-center justify-center text-xs font-medium px-2 " +
  "border-r border-border last:border-r-0 " +
  "bg-slate-50 text-slate-700";


    if (isWeekend(d)) cls += " bg-slate-100";

    if (isToday(d)) {
      cls += " text-primary bg-primary/5";
    }

    return (
      <div className={cls} title={label}>
        <div className="flex items-center gap-2 min-w-0">
          {mode === "date" ? (
            <BankHolidayCell visible={isHoliday(d)} title={holidayTitle(d)} />
          ) : null}
          <span className="truncate capitalize">{label}</span>
        </div>
      </div>
    );
  }

  const cols = showHourGutter
    ? `64px repeat(${days.length}, minmax(0,1fr))`
    : `repeat(${days.length}, minmax(0,1fr))`;

  return (
    <div className="px-3">
      <div className="grid" style={{ gridTemplateColumns: cols }}>
        {showHourGutter ? (
          <div className="h-10 border-r border-border bg-white" />
        ) : null}

        {days.map((d) => (
          <DayCell key={localKeyTZ(d)} d={d} />
        ))}
      </div>
    </div>
  );
}
