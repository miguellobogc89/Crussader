// app/components/calendar/calendarCalendarView.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import CalendarOnly from "@/app/components/calendar/calendar/index";
import type { CalendarAppt } from "@/app/components/calendar/calendar/types";

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

function localDayKey(dateInput: string | Date) {
  const d = new Date(dateInput);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

type ShiftEventLite = {
  id: string;
  employeeId: string | null;
  locationId: string | null;
  startAt: string;
  endAt: string;
  kind: string;
  label: string | null;
  templateId: string | null;
};

type AppointmentLite = {
  id: string;
  startAt: string;
  endAt: string;
  status: string | null;
  serviceId: string | null;
  serviceName: string | null;
  customerName: string | null;
  employeeId: string | null;
  resourceId?: string | null;
  employeeName?: string | null;
  resourceName?: string | null;
};

type Props = {
  companyId: string | null;
  locationId: string | null;
  onRangeChange?: (r: Range) => void;
  employeeNameById?: (id: string) => string;
  employeeColorById?: (id: string) => string | null;
  onCellClick?: (cellId: string) => void;
  selectedCellId?: string | null;
};

export default function CalendarView({
  companyId,
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
  const [appointments, setAppointments] = useState<CalendarAppt[]>([]);

  const range = useMemo<Range>(() => {
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

    if (view === "month") {
      start = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
      start.setHours(0, 0, 0, 0);

      end = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
    }

    return { fromISO: start.toISOString(), toISO: end.toISOString() };
  }, [selectedDate, view]);

  const rangeKey = useMemo(() => `${range.fromISO}|${range.toISO}`, [range]);
  const [slots, setSlots] = useState<any[]>([]);

  useEffect(() => {
    if (!locationId) return;
    if (!onRangeChange) return;
    onRangeChange(range);
  }, [locationId, rangeKey, onRangeChange, range]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!companyId || !locationId) {
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

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!locationId) {
        setAppointments([]);
        return;
      }

const url =
  `/api/calendar/appointments?locationId=${encodeURIComponent(locationId)}` +
  `&from=${encodeURIComponent(range.fromISO)}` +
  `&to=${encodeURIComponent(range.toISO)}`;

      try {
        const res = await fetch(url, { method: "GET" });
        const json = await res.json().catch(() => null);

        if (cancelled) return;

        if (!res.ok || !json || json.ok === false) {
          setAppointments([]);
          return;
        }

        const items = Array.isArray(json.items) ? (json.items as AppointmentLite[]) : [];

        const mapped: CalendarAppt[] = items.map((item) => {
          let resolvedEmployeeName: string | null = null;

          if (item.employeeName && item.employeeName.trim().length > 0) {
            resolvedEmployeeName = item.employeeName.trim();
          } else if (item.employeeId && employeeNameById) {
            resolvedEmployeeName = employeeNameById(item.employeeId);
          }

          return {
            id: item.id,
            startAt: item.startAt,
            endAt: item.endAt,
            serviceName: item.serviceName,
            employeeName: resolvedEmployeeName,
            resourceName: item.resourceName ?? null,
            status: item.status,
            serviceId: item.serviceId,
            customerName: item.customerName,
          };
        });

        setAppointments(mapped);
      } catch {
        if (cancelled) return;
        setAppointments([]);
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [locationId, rangeKey, range.fromISO, range.toISO, employeeNameById]);

  useEffect(() => {
  let cancelled = false;

  async function run() {
    if (!companyId || !locationId) {
      setSlots([]);
      return;
    }

const url =
  `/api/slots/list?companyId=${encodeURIComponent(companyId)}` +
  `&locationId=${encodeURIComponent(locationId)}`;

    try {
      const res = await fetch(url);
      const json = await res.json().catch(() => null);

      console.log("[slots status]", res.status);
console.log("[slots json]", json);

      if (cancelled) return;

      if (!res.ok || !json || json.ok === false) {
        setSlots([]);
        return;
      }

      setSlots(Array.isArray(json.slots) ? json.slots : []);
    } catch {
      if (cancelled) return;
      setSlots([]);
    }
  }

  run();

  return () => {
    cancelled = true;
  };
}, [companyId, locationId]);

  const apptsByDay = useMemo(() => {
    const map = new Map<string, CalendarAppt[]>();

    for (const appt of appointments) {
      const key = localDayKey(appt.startAt);
      const current = map.get(key);

      if (current) {
        current.push(appt);
      } else {
        map.set(key, [appt]);
      }
    }

    for (const entry of map.values()) {
      entry.sort((a, b) => {
        return new Date(a.startAt).getTime() - new Date(b.startAt).getTime();
      });
    }

    return map;
  }, [appointments]);

  const apptsForDay = useMemo(() => {
    const key = localDayKey(selectedDate);
    const items = apptsByDay.get(key);

    if (items) return items;
    return [];
  }, [apptsByDay, selectedDate]);

  const apptsForMonth = useMemo(() => {
    return appointments
      .slice()
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  }, [appointments]);

  void employeeColorById;

  const blocked = !locationId;

    console.log("[CalendarView] appointments", appointments);
  console.log("[CalendarView] apptsByDay", Array.from(apptsByDay.entries()));
  console.log("[CalendarView] view", view, "selectedDate", selectedDate);

  console.log("[CalendarView] locationId", locationId);
console.log("[CalendarView] appointments", appointments);
console.log("[CalendarView] apptsByDay", Array.from(apptsByDay.entries()));
console.log("[CalendarView] view", view, "selectedDate", selectedDate);


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
                apptsByDay={apptsByDay}
                apptsForDay={apptsForDay}
                apptsForMonth={apptsForMonth}
                slots={slots}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}