"use client";

import { useEffect, useMemo, useState } from "react";
import CalendarOnly from "@/app/components/calendar/calendar/index";

export type Range = { fromISO: string; toISO: string };

function startOfWeekMon(d: Date) {
  const x = new Date(d);
  const day = x.getDay();
  const delta = day === 0 ? -6 : 1 - day;
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() + delta);
  return x;
}

type Props = {
  locationId: string | null;
  onRangeChange?: (r: Range) => void;

  employeeNameById?: (id: string) => string;
  employeeColorById?: (id: string) => string | null;

  onCellClick?: (cellId: string) => void;
  selectedCellId?: string | null;
};

export default function CalendarView({
  locationId,
  onRangeChange,
  employeeNameById,
  employeeColorById,
  onCellClick,
  selectedCellId,
}: Props) {
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());

  const range = useMemo<Range>(() => {
    const start = startOfWeekMon(selectedDate);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return { fromISO: start.toISOString(), toISO: end.toISOString() };
  }, [selectedDate]);

  const rangeKey = useMemo(() => `${range.fromISO}|${range.toISO}`, [range]);

  useEffect(() => {
    if (!locationId) return;
    if (!onRangeChange) return;
    onRangeChange(range);
  }, [locationId, rangeKey, onRangeChange, range]);

  const blocked = !locationId;

  return (
    <div className="flex-1 min-w-0 flex flex-col h-full">
      <div className="relative flex-1 min-h-0 bg-white border border-border rounded-xl overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="h-full min-h-0 flex flex-col">
            {blocked ? (
              <div className="h-full w-full flex items-center justify-center text-sm text-muted-foreground">
                Selecciona una ubicación
              </div>
            ) : (
              <CalendarOnly
                selectedDate={selectedDate}
                onChangeDate={(d: Date) => setSelectedDate(d)}
                employeeNameById={employeeNameById}
                onCellClick={onCellClick}
                selectedCellId={selectedCellId}
              />
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
