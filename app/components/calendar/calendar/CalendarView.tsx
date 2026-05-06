// app/components/calendar/calendar/CalendarView.tsx
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import CalendarOnly from "./index";
import type { CalendarAppt } from "./types";
import type { CalendarToolbarView } from "./header/CalendarViewSelector";
import { localKeyTZ } from "./tz";
import AppointmentDetailsModal from "@/app/components/calendar/appointments/AppointmentDetailsModal";
import CreateAppointmentModal from "@/app/components/calendar/appointments/CreateAppointmentModal";

type ToolbarView = CalendarToolbarView;

type AppointmentLite = {
  id: string;
  locationId: string;
  startAt: string;
  endAt: string;
  serviceId: string | null;
  serviceName: string | null;
  serviceColor: string | null;
  employeeId: string | null;
  employeeName: string | null;
  employeeColor?: string | null;
  resourceId: string | null;
  resourceName: string | null;
  status: string | null;
  customerId: string | null;
  customerName: string | null;
  customerPhone: string | null;
  customerEmail: string | null;
  notes: string | null;
};

type Props = {
  locationId: string | null;
  onCellClick?: (cellId: string) => void;
  selectedCellId?: string | null;
};

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

export default function CalendarView({
  locationId,
  onCellClick,
  selectedCellId,
}: Props) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState<ToolbarView>("week");
  const [visibleStartHour, setVisibleStartHour] = useState(10);
  const [visibleEndHour, setVisibleEndHour] = useState(21);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  const [appointments, setAppointments] = useState<CalendarAppt[]>([]);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  useEffect(() => {
    if (!locationId) return;

    const safeLocationId = locationId;

    async function loadSettings() {
      const res = await fetch(
        `/api/calendar/settings?locationId=${encodeURIComponent(safeLocationId)}`
      );

      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.ok) {
        setSettingsLoaded(true);
        return;
      }

      setView(json.item.defaultView ?? "week");
      setVisibleStartHour(json.item.visibleStartHour ?? 10);
      setVisibleEndHour(json.item.visibleEndHour ?? 21);
      setSettingsLoaded(true);
    }

    loadSettings();
  }, [locationId]);

  async function saveSettings(next: {
    view?: ToolbarView;
    visibleStartHour?: number;
    visibleEndHour?: number;
  }) {
    if (!locationId || !settingsLoaded) return;

    await fetch("/api/calendar/settings", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        locationId,
        defaultView: next.view ?? view,
        visibleStartHour: next.visibleStartHour ?? visibleStartHour,
        visibleEndHour: next.visibleEndHour ?? visibleEndHour,
      }),
    });
  }

  function handleChangeView(nextView: ToolbarView) {
    setView(nextView);
    saveSettings({ view: nextView });
  }

  function handleChangeVisibleHours(startHour: number, endHour: number) {
    setVisibleStartHour(startHour);
    setVisibleEndHour(endHour);

    saveSettings({
      visibleStartHour: startHour,
      visibleEndHour: endHour,
    });
  }

  const range = useMemo(() => {
    let start = startOfWeekMon(selectedDate);
    let end = addDays(start, 6);

    if (view === "day") {
      start = new Date(selectedDate);
      end = new Date(selectedDate);
    }

    if (view === "threeDays") {
      start = new Date(selectedDate);
      end = addDays(start, 2);
    }

    if (view === "workingWeek") {
      start = startOfWeekMon(selectedDate);
      end = addDays(start, 4);
    }

    if (view === "month") {
      start = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
      end = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
    }

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    return {
      fromISO: start.toISOString(),
      toISO: end.toISOString(),
    };
  }, [selectedDate, view]);

  const loadAppointments = useCallback(async () => {
    if (!locationId) {
      setAppointments([]);
      return;
    }

    const url =
      `/api/calendar/appointments?locationId=${encodeURIComponent(locationId)}` +
      `&from=${encodeURIComponent(range.fromISO)}` +
      `&to=${encodeURIComponent(range.toISO)}`;

    const res = await fetch(url);
    const json = await res.json().catch(() => null);

    if (!res.ok || !json?.ok) {
      setAppointments([]);
      return;
    }

    const items: AppointmentLite[] = Array.isArray(json.items) ? json.items : [];

    setAppointments([
      ...items.map((item) => ({
        id: item.id,
        locationId: item.locationId,
        startAt: item.startAt,
        endAt: item.endAt,
        serviceId: item.serviceId ?? null,
        serviceName: item.serviceName ?? null,
        serviceColor: item.serviceColor ?? null,
        employeeId: item.employeeId ?? null,
        employeeName: item.employeeName ?? null,
        employeeColor: item.employeeColor ?? null,
        resourceId: item.resourceId ?? null,
        resourceName: item.resourceName ?? null,
        status: item.status ?? null,
        customerId: item.customerId ?? null,
        customerName: item.customerName ?? null,
        customerPhone: item.customerPhone ?? null,
        customerEmail: item.customerEmail ?? null,
        notes: item.notes ?? null,
      })),
    ]);
  }, [locationId, range]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  useEffect(() => {
  if (!locationId) return;

  const interval = setInterval(async () => {
    await fetch("/api/integrations/google/calendar/sync", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        companyId: "cmfv7vjd30000i5xktjoncp48",
        locationId,
      }),
    });

    await loadAppointments();
  }, 30000);

  return () => clearInterval(interval);
}, [locationId, loadAppointments]);

  const apptsByDay = useMemo(() => {
    const map = new Map<string, CalendarAppt[]>();

    for (const appt of appointments) {
      const key = localKeyTZ(new Date(appt.startAt));

      if (!map.has(key)) {
        map.set(key, []);
      }

      map.get(key)!.push(appt);
    }

    for (const day of map.values()) {
      day.sort(
        (a, b) =>
          new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
      );
    }

    return map;
  }, [appointments]);

  const apptsForMonth = useMemo(() => {
    return [...appointments].sort(
      (a, b) =>
        new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
    );
  }, [appointments]);

  const selectedAppointment = useMemo(() => {
    return appointments.find((appt) => appt.id === selectedAppointmentId) ?? null;
  }, [appointments, selectedAppointmentId]);

  async function handleCancelAppointment() {
    if (!selectedAppointmentId) return;

    const res = await fetch(`/api/calendar/appointments/${selectedAppointmentId}`, {
      method: "DELETE",
    });

    if (!res.ok) return;

    setSelectedAppointmentId(null);
    await loadAppointments();
  }

  if (!locationId) {
    return (
      <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
        Selecciona una ubicación
      </div>
    );
  }

  function getSelectedSlotDateTime() {
  if (!selectedCellId) {
    return {
      initialDate: undefined,
      initialTime: undefined,
    };
  }

  const [dayKey, hourIndexRaw] = selectedCellId.split("|");
  const hourIndex = Number(hourIndexRaw);

  if (!dayKey || Number.isNaN(hourIndex)) {
    return {
      initialDate: undefined,
      initialTime: undefined,
    };
  }

  const hour = visibleStartHour + hourIndex;

  return {
    initialDate: dayKey,
    initialTime: `${String(hour).padStart(2, "0")}:00`,
  };
}

const selectedSlotDateTime = getSelectedSlotDateTime();

  return (
    <>
      <CalendarOnly
        view={view}
        onChangeView={handleChangeView}
        selectedDate={selectedDate}
        onChangeDate={setSelectedDate}
        onCellClick={onCellClick}
        selectedCellId={selectedCellId}
        onAppointmentSelect={setSelectedAppointmentId}
        onCreateAppointment={() => setCreateModalOpen(true)}
        visibleStartHour={visibleStartHour}
        visibleEndHour={visibleEndHour}
        onChangeVisibleHours={handleChangeVisibleHours}
        apptsByDay={apptsByDay}
        apptsForMonth={apptsForMonth}
      />

      <AppointmentDetailsModal
        open={Boolean(selectedAppointment)}
        appointment={selectedAppointment}
        onClose={() => setSelectedAppointmentId(null)}
        onCancelAppointment={handleCancelAppointment}
        onUpdated={loadAppointments}
      />

      <CreateAppointmentModal
        open={createModalOpen}
        locationId={locationId}
        initialDate={selectedSlotDateTime.initialDate}
        initialTime={selectedSlotDateTime.initialTime}
        onClose={() => setCreateModalOpen(false)}
        onCreated={async () => {
          setCreateModalOpen(false);
          await loadAppointments();
        }}
      />
    </>
  );
}