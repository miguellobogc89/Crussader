// app/components/shifts-week-view.tsx

import * as React from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  HOURS,
  ShiftType,
  LocalShift,
  SHIFT_TYPE_COLOR,
  SHIFT_TYPE_LABEL,
} from "@/app/components/shifts/calendar/shifts-constants";

type WeekViewProps = {
  daysOfWeek: Date[];
  selectedEmployeeId?: string | null;
  currentType: ShiftType;
  isPainting: boolean;
  paintMode: "add" | "remove";
  setIsPainting: React.Dispatch<React.SetStateAction<boolean>>;
  setPaintMode: React.Dispatch<React.SetStateAction<"add" | "remove">>;
  getEventForCell: (
    day: Date,
    hour: number,
    employeeId: string
  ) => LocalShift | undefined;
  toggleCell: (
    day: Date,
    hour: number,
    employeeId: string,
    mode: "add" | "remove",
    type: ShiftType
  ) => void;
};

export function WeekView({
  daysOfWeek,
  selectedEmployeeId,
  currentType,
  isPainting,
  paintMode,
  setIsPainting,
  setPaintMode,
  getEventForCell,
  toggleCell,
}: WeekViewProps) {
  return (
    <div className="min-w-full">
      {/* Cabecera de días */}
      <div className="grid grid-cols-[80px,repeat(7,1fr)] border-b border-slate-200 bg-slate-50">
        <div className="border-r border-slate-200" />
        {daysOfWeek.map((day) => (
          <div
            key={day.toISOString()}
            className={cn(
              "px-2 py-2 text-center text-xs font-medium text-slate-600 border-r border-slate-200 last:border-r-0",
              format(day, "yyyy-MM-dd") ===
                format(new Date(), "yyyy-MM-dd") &&
                "bg-blue-50 text-blue-700"
            )}
          >
            <div className="uppercase text-[10px] tracking-wide">
              {format(day, "EEE", { locale: es })}
            </div>
            <div className="text-sm">
              {format(day, "d", { locale: es })}
            </div>
          </div>
        ))}
      </div>

      {/* Filas por hora */}
      <div className="divide-y divide-slate-200 select-none">
        {HOURS.map((hour) => (
          <div
            key={hour}
            className="grid grid-cols-[80px,repeat(7,1fr)] min-h-[40px]"
          >
            {/* Columna de hora */}
            <div className="border-r border-slate-200 bg-slate-50 px-2 py-1 text-right text-[11px] text-slate-500">
              {hour.toString().padStart(2, "0")}:00
            </div>

            {/* Celdas día/hora */}
            {daysOfWeek.map((day) => {
              const key = day.toISOString() + hour;
              const event =
                selectedEmployeeId &&
                getEventForCell(day, hour, selectedEmployeeId);

              return (
                <div
                  key={key}
                  className="border-r border-slate-100 last:border-r-0 bg-white hover:bg-slate-50 transition-colors"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    if (!selectedEmployeeId) return;
                    const hasEvent = !!getEventForCell(
                      day,
                      hour,
                      selectedEmployeeId
                    );
                    const mode: "add" | "remove" = hasEvent ? "remove" : "add";
                    setIsPainting(true);
                    setPaintMode(mode);
                    toggleCell(
                      day,
                      hour,
                      selectedEmployeeId,
                      mode,
                      currentType
                    );
                  }}
                  onMouseEnter={() => {
                    if (!isPainting || !selectedEmployeeId || !paintMode) {
                      return;
                    }
                    toggleCell(
                      day,
                      hour,
                      selectedEmployeeId,
                      paintMode,
                      currentType
                    );
                  }}
                >
                  {event && (
                    <div
                      className={cn(
                        "m-0.5 rounded-md border px-1.5 py-1 text-[11px] leading-tight shadow-sm",
                        SHIFT_TYPE_COLOR[event.type]
                      )}
                    >
                      <div className="font-medium truncate">
                        {SHIFT_TYPE_LABEL[event.type]}
                      </div>
                      <div className="text-[10px] opacity-80">
                        {hour.toString().padStart(2, "0")}:00–
                        {(hour + 1).toString().padStart(2, "0")}:00
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
