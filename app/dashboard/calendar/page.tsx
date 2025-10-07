// app/dashboard/calendar/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Building2, ChevronDown, Check, Plus, Settings,
} from "lucide-react";

import PageShell from "@/app/components/layouts/PageShell";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { SidebarProvider } from "@/app/components/ui/sidebar";

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/app/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";

import { usePersistentSelection } from "@/hooks/usePersistentSelection";

import EmployeeList, { type Employee } from "@/app/components/calendar/EmployeeList";
import ResourceList, { type Resource } from "@/app/components/calendar/ResourceList";
import CreateAppointmentModal from "@/app/components/calendar/CreateAppointmentModal";
import CalendarOnly from "@/app/components/calendar/CalendarOnly";
import UpcomingEventsList from "@/app/components/calendar/UpcomingEventsList";
import AppointmentDetailsCard from "@/app/components/calendar/AppointmentDetailsCard";

/* ===== Types ===== */
type Appointment = {
  id: string;
  locationId: string;
  serviceId: string;
  startAt: string;
  endAt: string;
  status?: "PENDING" | "BOOKED" | "COMPLETED" | "CANCELLED" | "NO_SHOW" | null;
  employeeId?: string | null;
  resourceId?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  customerEmail?: string | null;
  notes?: string | null;
};
type AppointmentLite = { id: string };
type ServiceLite = { id: string; name: string; durationMin: number; color?: string | null };
type CompanyLite = { id: string; name: string; color?: string | null; logoUrl?: string | null; locationsCount?: number };
type LocationRow = { id: string; title: string; city?: string | null };

type CalendarAppt = {
  id: string;
  startAt: string;
  endAt: string;
  serviceName?: string | null;
  serviceColor?: string | null;
  employeeName?: string | null;
  resourceName?: string | null;
};

/* ==========================
   Página — Calendario (MVP)
   ========================== */
export default function CalendarPage() {
  // ===== Vista + fecha =====
  const [selectedView, setSelectedView] = useState<"month" | "week" | "day">("week");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // ===== Persistencia de selecciones =====
  const [savedCompanyId, setSavedCompanyId] = usePersistentSelection<string>("calendar:companyId");
  const [savedLocationId, setSavedLocationId] = usePersistentSelection<string>("calendar:locationId");

  // ===== Empresas =====
  const [companies, setCompanies] = useState<CompanyLite[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);

  // ===== Ubicaciones =====
  const [locations, setLocations] = useState<LocationRow[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(false);
  const [locationId, setLocationId] = useState<string>("");

  // ===== Datos calendario =====
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<ServiceLite[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);

  // ===== UI auxiliar =====
  const [listMsg, setListMsg] = useState<string>("");
  const [empMsg, setEmpMsg] = useState("");
  const [resMsg, setResMsg] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  // Selecciones UI
  const [selectedReserva, setSelectedReserva] = useState<Appointment | null>(null);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [selectedResourceIds, setSelectedResourceIds] = useState<string[]>([]);

  // Ref (para scroll al top al cambiar ubicación)
  const topRef = useRef<HTMLDivElement | null>(null);

  // Título “Citas del …”
  const fmtDayTitle = useMemo(
    () =>
      new Intl.DateTimeFormat("es-ES", {
        timeZone: "Europe/Madrid",
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "2-digit",
      }),
    []
  );

  // Límites de día (local → ISO)
  const dayBoundsLocalISO = (d: Date) => {
    const start = new Date(d);
    start.setHours(0, 0, 0, 0);
    const end = new Date(d);
    end.setHours(23, 59, 59, 999);
    return { fromISO: start.toISOString(), toISO: end.toISOString() };
  };

  /* ==== A) Cargar empresas ==== */
  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        // ⚠️ ahora usamos /api/companies
        const res = await fetch("/api/companies", { cache: "no-store", signal: ac.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const list: CompanyLite[] = Array.isArray(json?.companies) ? json.companies : [];
        setCompanies(list);
      } catch (e) {
        if (!ac.signal.aborted) {
          const mock: CompanyLite[] = [{ id: "mock-1", name: "Mi Empresa", color: "#7C3AED" }];
          setCompanies(mock);
        }
      }
    })();
    return () => ac.abort();
  }, []);

  /* ==== B) Decidir empresa usando la persistida ==== */
  useEffect(() => {
    if (companies.length === 0) return;
    const exists = !!savedCompanyId && companies.some(c => c.id === savedCompanyId);
    const nextId = exists ? savedCompanyId! : (companies[0]?.id ?? null);
    if (nextId && nextId !== selectedCompanyId) {
      setSelectedCompanyId(nextId);
      setSavedCompanyId(nextId);
    }
  }, [companies, savedCompanyId, selectedCompanyId, setSavedCompanyId]);

  /* ==== C) Cargar ubicaciones de la empresa seleccionada ==== */
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
        const res = await fetch(`/api/locations?companyId=${selectedCompanyId}`, { cache: "no-store", signal: ac.signal });
        const json = await res.json();
        if (!res.ok || json?.ok === false) {
          setLocations([]);
          return;
        }
        const rows: LocationRow[] = (Array.isArray(json?.locations) ? json.locations : []).map((l: any) => ({
          id: String(l.id),
          title: String(l.title ?? "Sin nombre"),
          city: l.city ?? null,
        }));
        setLocations(rows);
      } catch {
        if (!ac.signal.aborted) setLocations([]);
      } finally {
        if (!ac.signal.aborted) setLocationsLoading(false);
      }
    })();

    return () => ac.abort();
  }, [selectedCompanyId]);

  /* ==== D) Decidir ubicación usando la persistida ==== */
  useEffect(() => {
    if (locations.length === 0) {
      setLocationId("");
      return;
    }
    const exists = !!savedLocationId && locations.some(l => l.id === savedLocationId);
    const next = exists ? savedLocationId! : locations[0].id;
    if (next !== locationId) {
      setLocationId(next);
      setSavedLocationId(next);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locations]);

  /* ==== Efectos dependientes de locationId ==== */
  useEffect(() => {
    if (!locationId) return;
    fetchEmployees();
    fetchResources();
    fetchServices();
    fetchAppointmentsForSelectedDay();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationId]);

  // Recargar al cambiar fecha
  useEffect(() => {
    if (locationId && selectedDate) fetchAppointmentsForSelectedDay();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  // ==== Fetchers (con AbortController) ====
  async function fetchAppointmentsForSelectedDay() {
    const ac = new AbortController();
    setSelectedReserva(null);
    if (!locationId || !selectedDate) {
      setAppointments([]);
      setListMsg(locationId ? "" : "Selecciona una ubicación");
      return;
    }
    const { fromISO, toISO } = dayBoundsLocalISO(selectedDate);
    setListMsg("⏳ Cargando citas del día…");
    try {
      const res = await fetch(
        `/api/calendar/appointments?locationId=${encodeURIComponent(locationId)}&from=${encodeURIComponent(fromISO)}&to=${encodeURIComponent(toISO)}`,
        { cache: "no-store", signal: ac.signal }
      );
      const data = await res.json();
      if (!res.ok || data.error) {
        setListMsg(`❌ ${data.error || "Error"}`);
        setAppointments([]);
        return;
      }
      const items = Array.isArray(data.items) ? data.items : [];
      setAppointments(items);
      setSelectedReserva(items[0] ?? null);
      setListMsg(`✅ ${items.length} citas`);
    } catch (e: any) {
      if (!ac.signal.aborted) {
        setListMsg(`❌ ${e.message}`);
        setAppointments([]);
      }
    }
  }

  async function fetchEmployees() {
    const ac = new AbortController();
    if (!locationId) {
      setEmployees([]);
      setEmpMsg("Selecciona una ubicación");
      return;
    }
    setEmpMsg("⏳ Cargando empleados…");
    try {
      const res = await fetch(`/api/calendar/employees?locationId=${encodeURIComponent(locationId)}`, { cache: "no-store", signal: ac.signal });
      const data = await res.json();
      if (!res.ok || data.error) {
        setEmpMsg(`❌ ${data.error || "Error"}`);
        setEmployees([]);
        return;
      }
      setEmployees(Array.isArray(data.items) ? data.items : []);
      setEmpMsg(`✅ ${data.items?.length || 0}`);
    } catch (e: any) {
      if (!ac.signal.aborted) {
        setEmpMsg(`❌ ${e.message}`);
        setEmployees([]);
      }
    }
  }

  async function fetchResources() {
    const ac = new AbortController();
    if (!locationId) {
      setResources([]);
      setResMsg("Selecciona una ubicación");
      return;
    }
    setResMsg("⏳ Cargando recursos…");
    try {
      const res = await fetch(`/api/calendar/resources?locationId=${encodeURIComponent(locationId)}`, { cache: "no-store", signal: ac.signal });
      const data = await res.json();
      if (!res.ok || data.error) {
        setResMsg(`❌ ${data.error || "Error"}`);
        setResources([]);
        return;
      }
      setResources(Array.isArray(data.items) ? data.items : []);
      setResMsg(`✅ ${data.items?.length || 0}`);
    } catch (e: any) {
      if (!ac.signal.aborted) {
        setResMsg(`❌ ${e.message}`);
        setResources([]);
      }
    }
  }

  async function fetchServices() {
    const ac = new AbortController();
    if (!locationId) {
      setServices([]);
      return;
    }
    try {
      const res = await fetch(`/api/calendar/services?locationId=${encodeURIComponent(locationId)}`, { cache: "no-store", signal: ac.signal });
      const data = await res.json();
      setServices(Array.isArray(data.items) ? data.items : []);
    } catch {
      if (!ac.signal.aborted) setServices([]);
    }
  }
  const calendarAppts = useMemo(() => {
    return (appointments ?? []).map((a) => ({
      id: a.id,
      startAt: String(a.startAt),
      endAt: String(a.endAt),
      serviceName: services.find((s) => s.id === a.serviceId)?.name ?? undefined,
      serviceColor: (services.find((s) => s.id === a.serviceId)?.color ?? null) as string | null,
      employeeName: employees.find((e) => e.id === a.employeeId)?.name ?? undefined,
      resourceName: resources.find((r) => r.id === a.resourceId)?.name ?? undefined,
    }));
  }, [appointments, services, employees, resources]);
  
    const handleSelectAppointmentId = (id: string) => {
    const full = appointments.find((x) => x.id === id);
    setSelectedReserva(full ?? null);
  };

  // Helpers UI selección lateral
  const toggleEmp = (id: string) =>
    setSelectedEmployeeIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const toggleRes = (id: string) =>
    setSelectedResourceIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const handleSelectFromList = (a: AppointmentLite) => {
    const full = appointments.find(x => x.id === a.id);
    setSelectedReserva((full ?? (a as any)) as any);
  };

  /* ===== Toolbar del PageShell ===== */
  const shellToolbar = (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex items-center justify-between">
        <CompanyPickerInline
          companies={companies}
          selectedCompanyId={selectedCompanyId}
          onSelect={(id) => {
            setSavedCompanyId(id);
            setSavedLocationId(null as any);
            setSelectedCompanyId(id);
            // limpieza visual suave:
            setAppointments([]);
            setEmployees([]);
            setResources([]);
            setServices([]);
            setListMsg("");
          }}
        />
      </div>

      <ToolbarFiltersInline
        locations={locations}
        locationsLoading={locationsLoading}
        locationId={locationId}
        onChangeLocation={(v) => {
          setLocationId(v);
          setSavedLocationId(v);
          if (topRef.current) topRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
        }}
        selectedDate={selectedDate}
        onChangeDate={(d) => setSelectedDate(d)}
        listMsg={listMsg}
        onRefresh={fetchAppointmentsForSelectedDay}
      />
    </div>
  );

  /* ===== Actions (Config + Nueva reserva) ===== */
  const shellActions = (
    <div className="flex gap-2">
      <Button asChild className="bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow">
        <Link href="/dashboard/calendar/settings">
          <Settings className="h-4 w-4 mr-2" />
          Configuración
        </Link>
      </Button>
      <Button
        variant="outline"
        onClick={() => setShowCreate(true)}
        disabled={!locationId}
        title={locationId ? "Nueva reserva" : "Selecciona una ubicación"}
      >
        <Plus className="h-4 w-4 mr-2" />
        Nueva reserva
      </Button>
    </div>
  );

  return (
    <SidebarProvider>
      <PageShell
        title="Calendario"
        description="Gestiona citas por empresa, ubicación, empleado, recurso y servicio."
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Calendario" }]}
        actions={shellActions}
        toolbar={shellToolbar}
        variant="full"
      >
        <div ref={topRef} />
        {/* Full height dentro del dashboard */}
        <div className="flex flex-col h-[calc(100vh-11rem)] min-h-0">
          <div className="flex flex-1 gap-6 overflow-hidden">
            <LeftPanelInline
              employees={employees}
              selectedEmployeeIds={selectedEmployeeIds}
              empMsg={empMsg}
              onToggleEmp={toggleEmp}
              resources={resources}
              selectedResourceIds={selectedResourceIds}
              resMsg={resMsg}
              onToggleRes={toggleRes}
            />

            <CenterPanelInline
              selectedView={selectedView}
              setSelectedView={setSelectedView}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              appointments={appointments}
              calendarAppts={calendarAppts}
              fmtDayTitle={fmtDayTitle}
              onSelectAppointment={handleSelectFromList}
              onSelectAppointmentId={handleSelectAppointmentId}
            />

            <RightPanelInline
              appointment={selectedReserva}
              services={services}
            />
          </div>
        </div>

        {/* Modal crear */}
        <CreateAppointmentModal
          open={showCreate}
          onOpenChange={(v) => setShowCreate(v)}
          defaultDate={selectedDate}
          onCreated={fetchAppointmentsForSelectedDay}
        />
      </PageShell>
    </SidebarProvider>
  );
}

/* ==========================
   Subcomponentes inline
   (puedes moverlos a archivos propios luego)
   ========================== */

function CompanyPickerInline({
  companies,
  selectedCompanyId,
  onSelect,
}: {
  companies: CompanyLite[];
  selectedCompanyId?: string | null;
  onSelect: (id: string) => void;
}) {
  const selected = useMemo(
    () => companies.find((c) => c.id === selectedCompanyId) ?? companies[0],
    [companies, selectedCompanyId]
  );

  const dotStyle =
    (selected?.color ?? "").toString() ||
    "linear-gradient(135deg, #A78BFA 0%, #F472B6 100%)";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="
            group inline-flex items-center gap-3
            rounded-full border border-border/80 bg-background
            px-3.5 py-2 text-sm font-medium
            shadow-sm hover:shadow
            transition-all
            hover:border-foreground/20
            focus:outline-none focus-visible:ring-2 focus-visible:ring-ring
          "
        >
          <span
            aria-hidden
            className="h-3.5 w-3.5 rounded-full ring-1 ring-black/5"
            style={{
              background: dotStyle.startsWith("#") ? undefined : (dotStyle as string),
              backgroundColor: dotStyle.startsWith("#") ? dotStyle : undefined,
            }}
          />
          <span className="text-foreground/90">
            {selected ? selected.name : "Selecciona empresa"}
          </span>
          <ChevronDown className="h-4 w-4 text-foreground/50 group-hover:text-foreground/70 transition-colors" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-72">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          Tus empresas
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {companies.length === 0 && <DropdownMenuItem disabled>Sin empresas</DropdownMenuItem>}
        {companies.map((c) => {
          const isActive = c.id === selected?.id;
          return (
            <DropdownMenuItem
              key={c.id}
              className="flex items-center gap-3"
              onClick={() => onSelect(c.id)}
            >
              <span
                aria-hidden
                className="h-3 w-3 rounded-full ring-1 ring-black/5 shrink-0"
                style={{
                  background: c.color && !c.color.startsWith("#") ? (c.color as string) : undefined,
                  backgroundColor: c.color && c.color.startsWith("#") ? c.color : undefined,
                }}
              />
              <span className="flex-1 truncate">{c.name}</span>
              <span className="ml-2 tabular-nums text-xs text-muted-foreground shrink-0">
                ({c.locationsCount ?? 0})
              </span>
              {isActive && <Check className="ml-2 h-4 w-4 text-foreground/70 shrink-0" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ToolbarFiltersInline({
  locations,
  locationsLoading,
  locationId,
  onChangeLocation,
  selectedDate,
  onChangeDate,
  listMsg,
  onRefresh,
}: {
  locations: LocationRow[];
  locationsLoading: boolean;
  locationId: string;
  onChangeLocation: (v: string) => void;
  selectedDate: Date;
  onChangeDate: (d: Date) => void;
  listMsg: string;
  onRefresh: () => void;
}) {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Ubicación */}
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground">Ubicación</Label>
            {locationsLoading ? (
              <div className="text-xs text-muted-foreground">Cargando ubicaciones…</div>
            ) : (
              <Select
                value={locationId || ""}
                onValueChange={onChangeLocation}
                disabled={!locations.length}
              >
                <SelectTrigger className="w-72 h-8">
                  <SelectValue placeholder={locations.length ? "Selecciona ubicación" : "Sin ubicaciones"} />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        <span>{l.title}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Fecha */}
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground">Fecha</Label>
            <Input
              className="h-8"
              type="date"
              value={selectedDate.toISOString().slice(0, 10)}
              onChange={(e) => onChangeDate(new Date(e.target.value + "T00:00:00"))}
            />
          </div>

          <Button onClick={onRefresh} variant="outline" className="h-8">
            Refrescar
          </Button>

          {listMsg && <span className="text-sm">{listMsg}</span>}
        </div>
      </CardContent>
    </Card>
  );
}

function LeftPanelInline({
  employees, selectedEmployeeIds, empMsg, onToggleEmp,
  resources, selectedResourceIds, resMsg, onToggleRes,
}: {
  employees: Employee[];
  selectedEmployeeIds: string[];
  empMsg: string;
  onToggleEmp: (id: string) => void;
  resources: Resource[];
  selectedResourceIds: string[];
  resMsg: string;
  onToggleRes: (id: string) => void;
}) {
  return (
    <div className="hidden lg:block lg:w-1/4 space-y-6 overflow-y-auto pr-2">
      <EmployeeList items={employees} selectedIds={selectedEmployeeIds} statusText={empMsg} onToggle={onToggleEmp} />
      <ResourceList items={resources} selectedIds={selectedResourceIds} statusText={resMsg} onToggle={onToggleRes} />
    </div>
  );
}

function CenterPanelInline({
  selectedView, setSelectedView,
  selectedDate, setSelectedDate,
  appointments,            // ← lista completa para UpcomingEventsList
  calendarAppts,           // ← lista adaptada para CalendarOnly (píldoras)
  fmtDayTitle,
  onSelectAppointment,     // ← (AppointmentLite) para la lista de la derecha
  onSelectAppointmentId,   // ← (id: string) para el calendario central
}: {
  selectedView: "month" | "week" | "day";
  setSelectedView: (v: "month" | "week" | "day") => void;
  selectedDate: Date;
  setSelectedDate: (d: Date) => void;
  appointments: Appointment[];
  calendarAppts: CalendarAppt[];
  fmtDayTitle: Intl.DateTimeFormat;
  onSelectAppointment: (a: AppointmentLite) => void;
  onSelectAppointmentId: (id: string) => void;
}) {
  return (
    <div className="w-full lg:w-1/2 flex flex-col min-w-0 overflow-hidden">
      <div className="flex-1 min-h-0">
        <CalendarOnly
          selectedView={selectedView}
          onChangeView={setSelectedView}
          selectedDate={selectedDate}
          onChangeDate={(d) => { if (d) setSelectedDate(d); }}
          appointments={calendarAppts}               // ✅ usar solo la adaptada
          onSelectAppointment={onSelectAppointmentId} // ✅ delega al padre
        />
      </div>

      <div className="mt-3 min-h-[12rem] max-h-[40vh] overflow-y-auto">
        <UpcomingEventsList
          title={selectedDate ? `Citas del ${fmtDayTitle.format(selectedDate)}` : "Citas del día"}
          appointments={appointments}
          onSelectAppointment={onSelectAppointment}
        />
      </div>
    </div>
  );
}


function RightPanelInline({
  appointment, services,
}: {
  appointment: Appointment | null;
  services: ServiceLite[];
}) {
  return (
    <div className="hidden lg:block lg:w-1/4 overflow-y-auto">
      <AppointmentDetailsCard appointment={appointment} services={services} />
    </div>
  );
}
