"use client";

import { useEffect, useMemo, useState } from "react";

import PageShell from "@/app/components/layouts/PageShell";
import { SidebarProvider } from "@/app/components/ui/sidebar";
import { Button } from "@/app/components/ui/button";
import { Plus, Settings } from "lucide-react";
import Link from "next/link";

import ResourceStatus, { type Employee, type Resource } from "@/app/components/calendar/ResourceStatus";
import CalendarHeader from "@/app/components/calendar/CalendarHeader";
import CalendarCenter from "@/app/components/calendar/CalendarCenter";
import CalendarRight from "@/app/components/calendar/CalendarRight";

import CreateAppointmentModal from "@/app/components/calendar/CreateAppointmentModal";
import EditAppointmentModal from "@/app/components/calendar/EditAppointmentModal";
import { usePersistentSelection } from "@/hooks/usePersistentSelection";

/* ===== Types ===== */
type Appointment = {
  id: string; locationId: string; serviceId: string; startAt: string; endAt: string;
  status?: "PENDING" | "BOOKED" | "COMPLETED" | "CANCELLED" | "NO_SHOW" | null;
  employeeId?: string | null; resourceId?: string | null;
  customerName?: string | null; customerPhone?: string | null; customerEmail?: string | null;
  notes?: string | null;
};
type AppointmentLite = { id: string };
type ServiceLite = { id: string; name: string; durationMin: number; color?: string | null };
type CompanyLite = { id: string; name: string; color?: string | null; logoUrl?: string | null; locationsCount?: number };
type LocationRow = { id: string; title: string; city?: string | null };

type CalendarAppt = {
  id: string; startAt: string; endAt: string;
  serviceName?: string | null; serviceColor?: string | null;
  employeeName?: string | null; resourceName?: string | null;
};

export default function CalendarPage() {
  // ===== Vista + fecha =====
  const [selectedView, setSelectedView] = useState<"month" | "week" | "day">("week");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // ===== Persistencia =====
  const [savedCompanyId, setSavedCompanyId] = usePersistentSelection<string>("calendar:companyId");
  const [savedLocationId, setSavedLocationId] = usePersistentSelection<string>("calendar:locationId");

  // ===== Datos maestros =====
  const [companies, setCompanies] = useState<CompanyLite[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);

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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // ===== Detalle/edición =====
  const [showEdit, setShowEdit] = useState(false);
  const [editingAppt, setEditingAppt] = useState<Appointment | null>(null);
  const [selectedReserva, setSelectedReserva] = useState<Appointment | null>(null);

  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [selectedResourceIds, setSelectedResourceIds] = useState<string[]>([]);

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
    const start = new Date(d); start.setHours(0, 0, 0, 0);
    const end = new Date(d);   end.setHours(23, 59, 59, 999);
    return { fromISO: start.toISOString(), toISO: end.toISOString() };
  };

  /* ==== A) Cargar empresas ==== */
  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        const res = await fetch("/api/companies", { cache: "no-store", signal: ac.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const list: CompanyLite[] = Array.isArray(json?.companies) ? json.companies : [];
        setCompanies(list);
      } catch {
        if (!ac.signal.aborted) setCompanies([{ id: "mock-1", name: "Mi Empresa", color: "#7C3AED" }]);
      }
    })();
    return () => ac.abort();
  }, []);

  /* ==== B) Empresa persistida ==== */
  useEffect(() => {
    if (companies.length === 0) return;
    const exists = !!savedCompanyId && companies.some(c => c.id === savedCompanyId);
    const nextId = exists ? savedCompanyId! : companies[0]?.id ?? null;
    if (nextId && nextId !== selectedCompanyId) { setSelectedCompanyId(nextId); setSavedCompanyId(nextId); }
  }, [companies, savedCompanyId, selectedCompanyId, setSavedCompanyId]);

  /* ==== C) Cargar ubicaciones ==== */
  useEffect(() => {
    const ac = new AbortController();
    if (!selectedCompanyId) { setLocations([]); setLocationId(""); return; }
    (async () => {
      try {
        setLocationsLoading(true);
        const res = await fetch(`/api/locations?companyId=${selectedCompanyId}`, { cache: "no-store", signal: ac.signal });
        const json = await res.json();
        if (!res.ok || json?.ok === false) { setLocations([]); return; }
        const rows: LocationRow[] = (Array.isArray(json?.locations) ? json.locations : []).map((l: any) => ({
          id: String(l.id), title: String(l.title ?? "Sin nombre"), city: l.city ?? null,
        }));
        setLocations(rows);
      } catch { if (!ac.signal.aborted) setLocations([]); }
      finally { if (!ac.signal.aborted) setLocationsLoading(false); }
    })();
    return () => ac.abort();
  }, [selectedCompanyId]);

  /* ==== D) Ubicación persistida ==== */
  useEffect(() => {
    if (locations.length === 0) { setLocationId(""); return; }
    const exists = !!savedLocationId && locations.some(l => l.id === savedLocationId);
    const next = exists ? savedLocationId! : locations[0].id;
    if (next !== locationId) { setLocationId(next); setSavedLocationId(next); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locations]);

  /* ==== E) Cargas dependientes ==== */
  useEffect(() => {
    if (!locationId) return;
    fetchEmployees(); fetchResources(); fetchServices(); fetchAppointmentsForSelectedDay();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationId]);

  useEffect(() => {
    if (locationId && selectedDate) fetchAppointmentsForSelectedDay();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  // ==== Fetchers ====
  async function fetchAppointmentsForSelectedDay() {
    const ac = new AbortController();
    setSelectedReserva(null);
    if (!locationId || !selectedDate) { setAppointments([]); setListMsg(locationId ? "" : "Selecciona una ubicación"); return; }
    const { fromISO, toISO } = dayBoundsLocalISO(selectedDate);
    setListMsg("⏳ Cargando citas del día…");
    try {
      const res = await fetch(`/api/calendar/appointments?locationId=${encodeURIComponent(locationId)}&from=${encodeURIComponent(fromISO)}&to=${encodeURIComponent(toISO)}`, { cache: "no-store", signal: ac.signal });
      const data = await res.json();
      if (!res.ok || data.error) { setListMsg(`❌ ${data.error || "Error"}`); setAppointments([]); return; }
      const items = Array.isArray(data.items) ? data.items : [];
      setAppointments(items); setSelectedReserva(items[0] ?? null); setListMsg(`✅ ${items.length} citas`);
    } catch (e: any) { if (!ac.signal.aborted) { setListMsg(`❌ ${e.message}`); setAppointments([]); } }
  }

  async function fetchEmployees() {
    const ac = new AbortController();
    if (!locationId) { setEmployees([]); setEmpMsg("Selecciona una ubicación"); return; }
    setEmpMsg("⏳ Cargando empleados…");
    try {
      const res = await fetch(`/api/calendar/employees?locationId=${encodeURIComponent(locationId)}`, { cache: "no-store", signal: ac.signal });
      const data = await res.json();
      if (!res.ok || data.error) { setEmpMsg(`❌ ${data.error || "Error"}`); setEmployees([]); return; }
      setEmployees(Array.isArray(data.items) ? data.items : []); setEmpMsg(`✅ ${data.items?.length || 0}`);
    } catch (e: any) { if (!ac.signal.aborted) { setEmpMsg(`❌ ${e.message}`); setEmployees([]); } }
  }

  async function fetchResources() {
    const ac = new AbortController();
    if (!locationId) { setResources([]); setResMsg("Selecciona una ubicación"); return; }
    setResMsg("⏳ Cargando recursos…");
    try {
      const res = await fetch(`/api/calendar/resources?locationId=${encodeURIComponent(locationId)}`, { cache: "no-store", signal: ac.signal });
      const data = await res.json();
      if (!res.ok || data.error) { setResMsg(`❌ ${data.error || "Error"}`); setResources([]); return; }
      setResources(Array.isArray(data.items) ? data.items : []); setResMsg(`✅ ${data.items?.length || 0}`);
    } catch (e: any) { if (!ac.signal.aborted) { setResMsg(`❌ ${e.message}`); setResources([]); } }
  }

  async function fetchServices() {
    const ac = new AbortController();
    if (!locationId) { setServices([]); return; }
    try {
      const res = await fetch(`/api/calendar/services?locationId=${encodeURIComponent(locationId)}`, { cache: "no-store", signal: ac.signal });
      const data = await res.json(); setServices(Array.isArray(data.items) ? data.items : []);
    } catch { if (!ac.signal.aborted) setServices([]); }
  }

  const calendarAppts: CalendarAppt[] = useMemo(() => {
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
  const handleEditAppointmentId = (id: string) => {
    const full = appointments.find((x) => x.id === id) || null;
    if (full) { setEditingAppt(full); setShowEdit(true); }
  };

  /* ===== Acciones del encabezado de página (PageHeader) ===== */
  const headerActions = (
    <div className="flex items-center gap-2">
      <Button
        className="bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow"
        onClick={() => setShowCreate(true)}
        disabled={!locationId}
        title={locationId ? "Nueva cita" : "Selecciona una ubicación"}
      >
        <Plus className="h-4 w-4 mr-2" />
        Nueva cita
      </Button>
      <Button asChild variant="outline" size="icon" title="Ajustes">
        <Link href="/dashboard/calendar/settings">
          <Settings className="h-4 w-4" />
        </Link>
      </Button>
    </div>
  );

  return (
    <SidebarProvider>
      {/* PageHeader muestra: título + botones (actions) */}
      <PageShell title="Calendario" description="" actions={headerActions} variant="full" showShellBadge={false}>
        {/* Banda debajo del PageHeader: empresa + ubicación (sin botones) */}
        <CalendarHeader
          companies={companies}
          selectedCompanyId={selectedCompanyId}
          onSelectCompany={(id) => {
            setSavedCompanyId(id);
            setSavedLocationId(null as any);
            setSelectedCompanyId(id);
            setAppointments([]); setEmployees([]); setResources([]); setServices([]); setListMsg("");
          }}
          locations={locations}
          locationsLoading={locationsLoading}
          locationId={locationId}
          onChangeLocation={(v) => { setLocationId(v); setSavedLocationId(v); }}
          showActions={false}          // ⬅️ botones ya están en PageHeader
        />

        {/* Contenido a pantalla: manejamos scrolls internos */}
        <div className="grid h-[calc(100dvh-140px)] grid-rows-[1fr] min-h-0">
          <div className="min-h-0 overflow-hidden">
            <div className="flex h-full gap-4 overflow-hidden">
              {/* Izquierda — panel unificado colapsable */}
              <div className="shrink-0">
                <ResourceStatus
                  employees={employees}
                  selectedEmployeeIds={selectedEmployeeIds}
                  onToggleEmployee={(id) =>
                    setSelectedEmployeeIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
                  }
                  employeeStatusText={empMsg}
                  resources={resources}
                  selectedResourceIds={selectedResourceIds}
                  onToggleResource={(id) =>
                    setSelectedResourceIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
                  }
                  resourceStatusText={resMsg}
                  collapsed={sidebarCollapsed}
                  onCollapsedChange={setSidebarCollapsed}
                  listMaxHeight={340}
                />
              </div>

              {/* Centro + derecha */}
              <div className="flex-1 min-w-0 flex gap-4 overflow-hidden">
                <CalendarCenter
                  selectedView={selectedView}
                  setSelectedView={setSelectedView}
                  selectedDate={selectedDate}
                  setSelectedDate={setSelectedDate}
                  appointments={appointments}
                  calendarAppts={calendarAppts}
                  fmtDayTitle={fmtDayTitle}
                  onSelectAppointment={(a: AppointmentLite) => {
                    const full = appointments.find((x) => x.id === a.id);
                    setSelectedReserva((full ?? (a as any)) as any);
                  }}
                  onSelectAppointmentId={handleSelectAppointmentId}
                  onEditAppointmentId={handleEditAppointmentId}
                />
                <CalendarRight appointment={selectedReserva} services={services} />
              </div>
            </div>
          </div>
        </div>

        {/* Modales */}
        <CreateAppointmentModal
          open={showCreate}
          onOpenChange={(v) => setShowCreate(v)}
          defaultDate={selectedDate}
          onCreated={fetchAppointmentsForSelectedDay}
          presetLocationId={locationId}
          presetCompanyId={selectedCompanyId ?? ""}
        />
        <EditAppointmentModal
          open={showEdit}
          onOpenChange={setShowEdit}
          appt={editingAppt as any}
          employees={employees}
          resources={resources}
          onSaved={fetchAppointmentsForSelectedDay}
        />
      </PageShell>
    </SidebarProvider>
  );
}
