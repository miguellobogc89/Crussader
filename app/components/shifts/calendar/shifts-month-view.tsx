// app/components/shifts-month-view.tsx

import * as React from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  HOURS,
  ShiftType,
  LocalShift,
  SHIFT_TYPE_MONTH_BG,
  SHIFT_TYPE_LABEL,
} from "@/app/components/shifts/calendar/shifts-constants";

type MonthViewProps = {
  monthWeeks: Date[][];
  monthStart: Date;
  selectedEmployeeId?: string | null;
  currentType: ShiftType;
  isPainting: boolean;
  paintMode: "add" | "remove";
  setIsPainting: React.Dispatch<React.SetStateAction<boolean>>;
  setPaintMode: React.Dispatch<React.SetStateAction<"add" | "remove">>;
  getEventsForDay: (date: Date, employeeId: string) => LocalShift[];
  resolveDayType: (dayEvents: LocalShift[]) => ShiftType | null;
  handleMonthWheel: (e: React.WheelEvent<HTMLDivElement>) => void;
  toggleCell: (
    day: Date,
    hour: number,
    employeeId: string,
    mode: "add" | "remove",
    type: ShiftType
  ) => void;
};

export function MonthView({
  monthWeeks,
  monthStart,
  selectedEmployeeId,
  currentType,
  isPainting,
  paintMode,
  setIsPainting,
  setPaintMode,
  getEventsForDay,
  resolveDayType,
  handleMonthWheel,
  toggleCell,
}: MonthViewProps) {
  return (
    <div className="min-w-full select-none" onWheel={handleMonthWheel}>
      {/* Cabecera días */}
      <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
        {["L", "M", "X", "J", "V", "S", "D"].map((d) => (
          <div
            key={d}
            className="px-2 py-2 text-center text-xs font-medium text-slate-600 border-r border-slate-200 last:border-r-0"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Semanas */}
      <div className="divide-y divide-slate-200">
        {monthWeeks.map((week, idx) => (
          <div key={idx} className="grid grid-cols-7 min-h-[80px]">
            {week.map((day) => {
              const isToday =
                format(day, "yyyy-MM-dd") ===
                format(new Date(), "yyyy-MM-dd");
              const inMonth =
                format(day, "MM") === format(monthStart, "MM");

              const dayEvents =
                selectedEmployeeId
                  ? getEventsForDay(day, selectedEmployeeId)
                  : [];
              const dominantType = resolveDayType(dayEvents);

              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "border-r border-slate-100 last:border-r-0 px-1.5 py-1.5 text-xs align-top cursor-pointer transition-colors",
                    !inMonth && "bg-slate-50/60 text-slate-400",
                    inMonth && !dominantType && "bg-white",
                    inMonth &&
                      dominantType &&
                      SHIFT_TYPE_MONTH_BG[dominantType]
                  )}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    if (!selectedEmployeeId) return;

                    const hasAny = dayEvents.length > 0;
                    const mode: "add" | "remove" = hasAny
                      ? "remove"
                      : "add";
                    setIsPainting(true);
                    setPaintMode(mode);

                    HOURS.forEach((h) => {
                      toggleCell(
                        day,
                        h,
                        selectedEmployeeId,
                        mode,
                        currentType
                      );
                    });
                  }}
                  onMouseEnter={() => {
                    if (!isPainting || !selectedEmployeeId || !paintMode) {
                      return;
                    }
                    HOURS.forEach((h) => {
                      toggleCell(
                        day,
                        h,
                        selectedEmployeeId,
                        paintMode,
                        currentType
                      );
                    });
                  }}
                >
                  {/* Número de día */}
                  <div
                    className={cn(
                      "inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] mb-1",
                      isToday
                        ? "bg-blue-600 text-white"
                        : "text-slate-700",
                      !inMonth && "text-slate-400"
                    )}
                  >
                    {format(day, "d")}
                  </div>

                  {/* Bloque coloreado resumido */}
                  {dominantType && (
                    <div className="mt-1 rounded-md border border-white/40 px-1 py-0.5 text-[10px] font-medium text-slate-700/90 truncate">
                      {SHIFT_TYPE_LABEL[dominantType]}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div className="px-4 py-2 text-[10px] text-slate-400 border-t border-slate-100">
        Desplázate con la rueda del ratón para cambiar de mes.
      </div>
    </div>
  );
}
