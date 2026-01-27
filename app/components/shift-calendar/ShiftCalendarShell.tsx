// app/components/shift-calendar/ShiftCalendarShell.tsx
"use client";

import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import LocationSelector, {
  type LocationLite,
} from "@/app/components/crussader/LocationSelector";
import { useBootstrapData } from "@/app/providers/bootstrap-store";

type Holiday = {
  id: string;
  date: string;
  name: string;
  isClosed: boolean;
  locationId?: string | null;
};

export type EmployeeLite = {
  id: string;
  name: string;
  color?: string | null;
  active: boolean;
};

export type ShiftCalendarCtx = {
  companyId: string | null;

  locationId: string | null;
  location: LocationLite | null;

  anchorDate: Date;
  setAnchorDate: (d: Date) => void;
  monthStart: Date;
  monthEnd: Date;

  holidays: Holiday[];
  holidaysMsg: string;

  employees: EmployeeLite[];
  employeesMsg: string;

  jobTitles: string[];
  jobTitlesMsg: string;

  isCreatingEmployee: boolean;
  createEmployeeErr: string | null;
  createEmployee: (payload: { name: string; jobTitle: string | null }) => Promise<void>;

  refreshEmployees: () => Promise<void>;
  refreshJobTitles: () => Promise<void>;
  refreshHolidays: () => Promise<void>;
};

type Props = {
  children: (ctx: ShiftCalendarCtx) => ReactNode;
};

function startOfMonth(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(1);
  return x;
}

function endOfMonth(d: Date) {
  const x = startOfMonth(d);
  x.setMonth(x.getMonth() + 1);
  x.setDate(0);
  x.setHours(23, 59, 59, 999);
  return x;
}

export default function ShiftCalendarShell({ children }: Props) {
  const boot = useBootstrapData();
  const companyId = boot?.activeCompany?.id ? String(boot.activeCompany.id) : null;

  const [locationId, setLocationId] = useState<string | null>(null);
  const [location, setLocation] = useState<LocationLite | null>(null);

  const [anchorDate, setAnchorDate] = useState<Date>(() => new Date());
  const monthStart = useMemo(() => startOfMonth(anchorDate), [anchorDate]);
  const monthEnd = useMemo(() => endOfMonth(anchorDate), [anchorDate]);

  // holidays
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [holidaysMsg, setHolidaysMsg] = useState<string>("");

  // employees
  const [employees, setEmployees] = useState<EmployeeLite[]>([]);
  const [employeesMsg, setEmployeesMsg] = useState<string>("");

  // job titles
  const [jobTitles, setJobTitles] = useState<string[]>([]);
  const [jobTitlesMsg, setJobTitlesMsg] = useState<string>("");

  // create employee
  const [isCreatingEmployee, setIsCreatingEmployee] = useState(false);
  const [createEmployeeErr, setCreateEmployeeErr] = useState<string | null>(null);

  // anti-doble llamada (dev strict mode)
  const bootstrappedForLocationRef = useRef<string | null>(null);

  async function bootstrapLocationIfNeeded() {
    if (!locationId) return;
    if (bootstrappedForLocationRef.current === locationId) return;
    bootstrappedForLocationRef.current = locationId;

    await fetch(`/api/locations/${locationId}/enrich-from-places`, {
      method: "POST",
      cache: "no-store",
    }).catch(() => null);

    await fetch("/api/calendar/bootstrap-location", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({ locationId }),
    }).catch(() => null);
  }

  async function refreshEmployees() {
    if (!locationId) {
      setEmployees([]);
      setEmployeesMsg("");
      return;
    }

    setEmployeesMsg("⏳ Cargando empleados…");
    try {
      const qs = new URLSearchParams({ locationId });
      const res = await fetch(`/api/calendar/employees?${qs.toString()}`, {
        cache: "no-store",
      });
      const data = await res.json();

      if (!res.ok || data?.error) {
        setEmployees([]);
        setEmployeesMsg(`❌ ${data?.error || "Error"}`);
        return;
      }

      const rows = Array.isArray(data?.items) ? data.items : [];
      const mapped: EmployeeLite[] = rows.map((e: any) => ({
        id: String(e.id),
        name: String(e.name),
        active: Boolean(e.active),
        color: e?.primaryRoleColor ? String(e.primaryRoleColor) : null,
      }));

      setEmployees(mapped);
      setEmployeesMsg(`✅ ${mapped.length} empleados`);
    } catch (e: any) {
      setEmployees([]);
      setEmployeesMsg(`❌ ${e?.message || "Error"}`);
    }
  }

  async function refreshJobTitles() {
    if (!locationId) {
      setJobTitles([]);
      setJobTitlesMsg("");
      return;
    }

    setJobTitlesMsg("⏳ Cargando cargos…");
    try {
      const qs = new URLSearchParams({ locationId });
      const res = await fetch(`/api/calendar/employees/job-titles?${qs.toString()}`, {
        cache: "no-store",
      });
      const data = await res.json();

      if (!res.ok || data?.error) {
        setJobTitles([]);
        setJobTitlesMsg(`❌ ${data?.error || "Error"}`);
        return;
      }

      const items = Array.isArray(data?.items) ? data.items : [];
      const normalized = items.map((x: any) => String(x)).filter(Boolean);

      setJobTitles(normalized);
      setJobTitlesMsg(`✅ ${normalized.length} cargos`);
    } catch (e: any) {
      setJobTitles([]);
      setJobTitlesMsg(`❌ ${e?.message || "Error"}`);
    }
  }

  async function refreshHolidays() {
    if (!locationId) {
      setHolidays([]);
      setHolidaysMsg("");
      return;
    }

    setHolidaysMsg("⏳ Cargando festivos…");
    try {
      const qs = new URLSearchParams({
        locationId,
        from: monthStart.toISOString().slice(0, 10),
        to: monthEnd.toISOString().slice(0, 10),
      });

      const res = await fetch(`/api/calendar/holidays?${qs.toString()}`, {
        cache: "no-store",
      });
      const data = await res.json();

      if (!res.ok || data?.ok === false) {
        setHolidays([]);
        setHolidaysMsg(`❌ ${data?.error || "Error"}`);
        return;
      }

      setHolidays(Array.isArray(data?.items) ? data.items : []);
      setHolidaysMsg(`✅ ${data?.items?.length || 0} festivos`);
    } catch (e: any) {
      setHolidays([]);
      setHolidaysMsg(`❌ ${e?.message || "Error"}`);
    }
  }

  async function createEmployee(payload: { name: string; jobTitle: string | null }) {
    if (!locationId) return;

    setIsCreatingEmployee(true);
    setCreateEmployeeErr(null);

    try {
      const res = await fetch("/api/calendar/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          name: payload.name,
          jobTitle: payload.jobTitle,
          active: true,
          locationIds: [locationId],
          roleIds: [],
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || data?.ok === false || data?.error) {
        setCreateEmployeeErr(data?.error || "Error creando empleado");
        return;
      }

      await refreshEmployees();
      await refreshJobTitles();
    } catch (e: any) {
      setCreateEmployeeErr(e?.message || "Error creando empleado");
    } finally {
      setIsCreatingEmployee(false);
    }
  }

  // 0) bootstrap una vez por locationId
  useEffect(() => {
    bootstrapLocationIfNeeded();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationId]);

  // 1) refrescos cuando cambia location
  useEffect(() => {
    refreshEmployees();
    refreshJobTitles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationId]);

  // 2) refrescos por mes/location (holidays)
  useEffect(() => {
    refreshHolidays();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId, locationId, monthStart.getTime()]);

  const ctx: ShiftCalendarCtx = {
    companyId,

    locationId,
    location,

    anchorDate,
    setAnchorDate,
    monthStart,
    monthEnd,

    holidays,
    holidaysMsg,

    employees,
    employeesMsg,

    jobTitles,
    jobTitlesMsg,

    isCreatingEmployee,
    createEmployeeErr,
    createEmployee,

    refreshEmployees,
    refreshJobTitles,
    refreshHolidays,
  };

  return (
    <>
      <LocationSelector
        onSelect={(id, loc) => {
          if (id !== bootstrappedForLocationRef.current) {
            bootstrappedForLocationRef.current = null;
          }
          setLocationId(id);
          setLocation(loc ?? null);
        }}
      />
      {children(ctx)}
    </>
  );
}
