"use client";

import { useEffect, useMemo, useState } from "react";

import CalendarHeader from "@/app/components/calendar/CalendarHeader";
import CalendarCenter from "@/app/components/calendar/CalendarOnly/CalendarCenter";
import type { CalendarAppt } from "@/app/components/calendar/CalendarOnly";
import { usePersistentSelection } from "@/hooks/usePersistentSelection";
import { useCellPainter } from "@/hooks/calendar/useCellPainter";

type View = "day" | "threeDays" | "workingWeek" | "week" | "month";

type Appointment = {
  id: string;
  locationId: string;
  serviceId: string;
  startAt: string;
  endAt: string;
  status?: "PENDING" | "BOOKED" | "COMPLETED" | "CANCELLED" | "NO_SHOW" | null;
  employeeId?: string | null;
  resourceId?: string | null;
};

type ServiceLite = {
  id: string;
  name: string;
  durationMin: number;
  color?: string | null;
};

type EmployeeLite = { id: string; name: string; color?: string | null; active: boolean };
type ResourceLite = { id: string; name: string; active: boolean };

type CompanyLite = {
  id: string;
  name: string;
  color?: string | null;
  logoUrl?: string | null;
  locationsCount?: number;
};

type LocationRow = { id: string; title: string; city?: string | null };

export default function CalendarView() {
  const painter = useCellPainter();

  const [selectedView, setSelectedView] = useState<View>("week");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const [savedCompanyId, setSavedCompanyId] =
    usePersistentSelection<string>("calendar:companyId");
  const [savedLocationId, setSavedLocationId] =
    usePersistentSelection<string>("calendar:locationId");

  const [companies, setCompanies] = useState<CompanyLite[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);

  const [locations, setLocations] = useState<LocationRow[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(false);
  const [locationId, setLocationId] = useState<string>("");

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<ServiceLite[]>([]);
  const [employees, setEmployees] = useState<EmployeeLite[]>([]);
  const [resources, setResources] = useState<ResourceLite[]>([]);

  const dayBoundsLocalISO = (d: Date) => {
    const start = new Date(d);
    start.setHours(0, 0, 0, 0);
    const end = new Date(d);
    end.setHours(23, 59, 59, 999);
    return { fromISO: start.toISOString(), toISO: end.toISOString() };
  };

  // 1) companies
  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        const res = await fetch("/api/companies", {
          cache: "no-store",
          signal: ac.signal,
        });
        const json = await res.json();
        const list: CompanyLite[] = Array.isArray(json?.companies) ? json.companies : [];
        setCompanies(list);
      } catch {
        if (!ac.signal.aborted) setCompanies([]);
      }
    })();
    return () => ac.abort();
  }, []);

  // 2) pick company
  useEffect(() => {
    if (companies.length === 0) return;

    let next: string | null = null;

    if (savedCompanyId) {
      const ok = companies.some((c) => c.id === savedCompanyId);
      if (ok) next = savedCompanyId;
    }

    if (!next) next = companies[0]?.id ?? null;

    if (next && next !== selectedCompanyId) {
      setSelectedCompanyId(next);
      setSavedCompanyId(next);
    }
  }, [companies, savedCompanyId, selectedCompanyId, setSavedCompanyId]);

  // 3) locations
  useEffect(() => {
    const ac = new AbortController();

    if (!selectedCompanyId) {
      setLocations([]);
      setLocationId("");
      return;
    }

    (async () => {
      try {
        setLocationsLoading(true);
        const res = await fetch(`/api/locations?companyId=${selectedCompanyId}`, {
          cache: "no-store",
          signal: ac.signal,
        });
        const json = await res.json();
        if (!res.ok || json?.ok === false) {
          setLocations([]);
          return;
        }

        const rows: LocationRow[] = (Array.isArray(json?.locations) ? json.locations : []).map(
          (l: any) => ({
            id: String(l.id),
            title: String(l.title ?? "Sin nombre"),
            city: l.city ?? null,
          })
        );

        setLocations(rows);
      } catch {
        if (!ac.signal.aborted) setLocations([]);
      } finally {
        if (!ac.signal.aborted) setLocationsLoading(false);
      }
    })();

    return () => ac.abort();
  }, [selectedCompanyId]);

  // 4) pick location
  useEffect(() => {
    if (locations.length === 0) {
      setLocationId("");
      return;
    }

    let next = "";

    if (savedLocationId) {
      const ok = locations.some((l) => l.id === savedLocationId);
      if (ok) next = savedLocationId;
    }

    if (!next) next = locations[0].id;

    if (next !== locationId) {
      setLocationId(next);
      setSavedLocationId(next);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locations]);

  // 5) fetch by location
  useEffect(() => {
    if (!locationId) return;
    fetchEmployees();
    fetchResources();
    fetchServices();
    fetchAppointmentsForSelectedDay();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationId]);

  // 6) fetch by date
  useEffect(() => {
    if (!locationId) return;
    fetchAppointmentsForSelectedDay();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  async function fetchAppointmentsForSelectedDay() {
    if (!locationId || !selectedDate) {
      setAppointments([]);
      return;
    }

    const { fromISO, toISO } = dayBoundsLocalISO(selectedDate);

    try {
      const res = await fetch(
        `/api/calendar/appointments?locationId=${encodeURIComponent(
          locationId
        )}&from=${encodeURIComponent(fromISO)}&to=${encodeURIComponent(toISO)}`,
        { cache: "no-store" }
      );
      const data = await res.json();
      if (!res.ok || data?.error) {
        setAppointments([]);
        return;
      }
      setAppointments(Array.isArray(data.items) ? data.items : []);
    } catch {
      setAppointments([]);
    }
  }

  async function fetchEmployees() {
    if (!locationId) {
      setEmployees([]);
      return;
    }
    try {
      const res = await fetch(
        `/api/calendar/employees?locationId=${encodeURIComponent(locationId)}`,
        { cache: "no-store" }
      );
      const data = await res.json();
      if (!res.ok || data?.error) {
        setEmployees([]);
        return;
      }
      setEmployees(Array.isArray(data.items) ? data.items : []);
    } catch {
      setEmployees([]);
    }
  }

  async function fetchResources() {
    if (!locationId) {
      setResources([]);
      return;
    }
    try {
      const res = await fetch(
        `/api/calendar/resources?locationId=${encodeURIComponent(locationId)}`,
        { cache: "no-store" }
      );
      const data = await res.json();
      if (!res.ok || data?.error) {
        setResources([]);
        return;
      }
      setResources(Array.isArray(data.items) ? data.items : []);
    } catch {
      setResources([]);
    }
  }

  async function fetchServices() {
    if (!locationId) {
      setServices([]);
      return;
    }
    try {
      const res = await fetch(
        `/api/calendar/services?locationId=${encodeURIComponent(locationId)}`,
        { cache: "no-store" }
      );
      const data = await res.json();
      setServices(Array.isArray(data.items) ? data.items : []);
    } catch {
      setServices([]);
    }
  }

  const calendarAppts: CalendarAppt[] = useMemo(() => {
    const out: CalendarAppt[] = [];

    for (const a of appointments ?? []) {
      let serviceName: string | undefined;
      let serviceColor: string | null | undefined;
      let employeeName: string | undefined;
      let resourceName: string | undefined;

      const svc = services.find((s) => s.id === a.serviceId);
      if (svc) {
        serviceName = svc.name;
        serviceColor = (svc.color ?? null) as string | null;
      }

      const emp = employees.find((e) => e.id === a.employeeId);
      if (emp) employeeName = emp.name;

      const res = resources.find((r) => r.id === a.resourceId);
      if (res) resourceName = res.name;

      out.push({
        id: a.id,
        startAt: String(a.startAt),
        endAt: String(a.endAt),
        serviceName,
        serviceColor,
        employeeName,
        resourceName,
      });
    }

    return out;
  }, [appointments, services, employees, resources]);

  return (
    <div className="flex-1 min-w-0 h-full overflow-hidden flex flex-col">
      <CalendarHeader
        companies={companies}
        selectedCompanyId={selectedCompanyId}
        onSelectCompany={(id) => {
          setSavedCompanyId(id);
          setSavedLocationId(null as any);
          setSelectedCompanyId(id);

          // reset visual
          setAppointments([]);
          setEmployees([]);
          setResources([]);
          setServices([]);
        }}
        locations={locations}
        locationsLoading={locationsLoading}
        locationId={locationId}
        onChangeLocation={(id) => {
          setLocationId(id);
          setSavedLocationId(id);
        }}
        onCreateAppointment={() => {
          // aquí luego lo conecta AppointmentView si quieres
        }}
        settingsHref="/dashboard/calendar/settings"
        disableCreate={!locationId}
      />

      <div className="flex-1 min-h-0 overflow-hidden">
        <CalendarCenter
          selectedView={selectedView}
          setSelectedView={setSelectedView}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          calendarAppts={calendarAppts}
          onSelectAppointmentId={() => {}}
          onEditAppointmentId={() => {}}
          painter={painter}
        />
      </div>
    </div>
  );
}
