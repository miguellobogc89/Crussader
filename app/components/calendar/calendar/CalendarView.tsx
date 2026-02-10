"use client";

import { useEffect, useMemo, useState } from "react";
import CalendarOnly from "@/app/components/calendar/calendar/index";

export type Range = { fromISO: string; toISO: string };

type ToolbarView = "day" | "threeDays" | "workingWeek" | "week" | "month";

function startOfWeekMon(d: Date) {
  const x = new Date(d);
  const day = x.getDay();
  const delta = day === 0 ? -6 : 1 - day;
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() + delta);
  return x;
}

function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

type ShiftEventLite = {
  id: string;
  employeeId: string | null;
  locationId: string | null;
  startAt: string; // ISO
  endAt: string; // ISO
  kind: string;
  label: string | null;
  templateId: string | null;
};

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
  const [view, setView] = useState<ToolbarView>("week");
  const [shiftEvents, setShiftEvents] = useState<ShiftEventLite[]>([]);

  const range = useMemo<Range>(() => {
    // por defecto semana completa
    let start = startOfWeekMon(selectedDate);
    let end = addDays(start, 6);
    end.setHours(23, 59, 59, 999);

    if (view === "day") {
      start = new Date(selectedDate);
      start.setHours(0, 0, 0, 0);
      end = new Date(selectedDate);
      end.setHours(23, 59, 59, 999);
    }

    if (view === "threeDays") {
      start = new Date(selectedDate);
      start.setHours(0, 0, 0, 0);
      end = addDays(start, 2);
      end.setHours(23, 59, 59, 999);
    }

    if (view === "workingWeek") {
      start = startOfWeekMon(selectedDate);
      end = addDays(start, 4);
      end.setHours(23, 59, 59, 999);
    }

    if (view === "week") {
      start = startOfWeekMon(selectedDate);
      end = addDays(start, 6);
      end.setHours(23, 59, 59, 999);
    }

    return { fromISO: start.toISOString(), toISO: end.toISOString() };
  }, [selectedDate, view]);

  const rangeKey = useMemo(() => `${range.fromISO}|${range.toISO}`, [range]);

  useEffect(() => {
    if (!locationId) return;
    if (!onRangeChange) return;
    onRangeChange(range);
  }, [locationId, rangeKey, onRangeChange, range]);

  // ✅ fetch shift-events
  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!locationId) {
        setShiftEvents([]);
        return;
      }

      const url =
        `/api/calendar/shifts/shift-events?locationId=${encodeURIComponent(locationId)}` +
        `&from=${encodeURIComponent(range.fromISO)}` +
        `&to=${encodeURIComponent(range.toISO)}`;

      try {
        const res = await fetch(url, { method: "GET" });
        const json = await res.json().catch(() => null);

        if (cancelled) return;

        if (!res.ok || !json || json.ok === false) {
          setShiftEvents([]);
          return;
        }

        const items = Array.isArray(json.items) ? (json.items as ShiftEventLite[]) : [];
        setShiftEvents(items);
      } catch {
        if (cancelled) return;
        setShiftEvents([]);
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [locationId, rangeKey, range.fromISO, range.toISO]);

  void employeeColorById;

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
                view={view}
                onChangeView={(v: ToolbarView) => setView(v)}
                selectedDate={selectedDate}
                onChangeDate={(d: Date) => setSelectedDate(d)}
                employeeNameById={employeeNameById}
                onCellClick={onCellClick}
                selectedCellId={selectedCellId}
                shiftEvents={shiftEvents}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
