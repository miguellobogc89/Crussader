// app/dashboard/myusers/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import PageShell from "@/app/components/layouts/PageShell";
import {
  Users, Shield, KeyRound, MailPlus, Building2, MapPin, Wrench
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/app/components/ui/select";
import { Card, CardContent } from "@/app/components/ui/card";
import { usePersistentSelection } from "@/hooks/usePersistentSelection";

import UsersTableForLocation, {
  type EmployeeRow as TableEmployeeRow,
} from "@/app/components/employees/EmployeesTable";
import { EditEmployeeModal } from "@/app/components/employees/EditEmployeeModal";
import RolesTable from "@/app/components/employees/RolesTable";
import ServicesTable from "@/app/components/employees/ServicesTable";

/* ===== Tipos ===== */
type CompanyLite = {
  id: string;
  name: string;
  color?: string | null;
  logoUrl?: string | null;
  locationsCount?: number;
};
type LocationRow = { id: string; title: string; city?: string | null };
type RoleLite = { id: string; name: string };

/* ===== Tabs ===== */

type TabKey = "users" | "roles" | "permissions" | "invites" | "services";
const TABS = [
  { key: "users", label: "Usuarios", icon: Users },
  { key: "roles", label: "Roles", icon: Shield },
  { key: "services", label: "Servicios", icon: Wrench },   // 👈 nuevo
  { key: "permissions", label: "Permisos", icon: KeyRound },
  { key: "invites", label: "Invitaciones", icon: MailPlus },
] as const;

function HeaderTabs() {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const active: TabKey = (search.get("tab") as TabKey) || "users";

  const makeHref = (k: TabKey) => {
    const params = new URLSearchParams(search.toString());
    params.set("tab", k);
    return `${pathname}?${params.toString()}`;
  };

  const onSelect = (k: TabKey) => {
    router.replace(makeHref(k));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("crussader:navigate-start"));
      window.dispatchEvent(new CustomEvent("crussader:navigate-end"));
    }
  };

  const items = useMemo(
    () =>
      TABS.map(({ key, label, icon: Icon }) => {
        const selected = key === active;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onSelect(key)}
            role="tab"
            aria-selected={selected}
            className={[
              "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium",
              "transition-colors border",
              selected
                ? "bg-foreground text-background border-foreground"
                : "bg-white border-muted-foreground/20 hover:bg-muted",
            ].join(" ")}
          >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
          </button>
        );
      }),
    [active]
  );

  return (
    <div role="tablist" aria-label="Pestañas de Usuarios y Roles" className="flex flex-wrap items-center gap-2">
      {items}
    </div>
  );
}

/* =========================
   Page (clon calendar A→D)
   ========================= */
export default function MyUsersPage() {
  // Persistencia compatible con Calendar
  const [savedCompanyId, setSavedCompanyId] = usePersistentSelection<string>("calendar:companyId");
  const [savedLocationId, setSavedLocationId] = usePersistentSelection<string>("calendar:locationId");

  // Empresas
  const [companies, setCompanies] = useState<CompanyLite[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/companies/accessible", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const list: CompanyLite[] = Array.isArray(json?.companies) ? json.companies : [];
        if (!cancelled) setCompanies(list);
      } catch {
        if (!cancelled) setCompanies([{ id: "mock-1", name: "Mi Empresa", color: "#7C3AED" }]);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (companies.length === 0) return;
    const exists = !!savedCompanyId && companies.some(c => c.id === savedCompanyId);
    const nextId = exists ? savedCompanyId! : (companies[0]?.id ?? null);
    if (nextId && nextId !== selectedCompanyId) {
      setSelectedCompanyId(nextId);
      setSavedCompanyId(nextId);
    }
  }, [companies, savedCompanyId, selectedCompanyId, setSavedCompanyId]);

  // Ubicaciones
  const [locations, setLocations] = useState<LocationRow[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(false);
  const [locationId, setLocationId] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    if (!selectedCompanyId) {
      setLocations([]);
      setLocationId("");
      return;
    }
    (async () => {
      try {
        setLocationsLoading(true);
        const res = await fetch(`/api/locations?companyId=${selectedCompanyId}`, { cache: "no-store" });
        const json = await res.json();
        if (cancelled) return;
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
        setLocations([]);
      } finally {
        if (!cancelled) setLocationsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedCompanyId]);

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

  /* ===== Roles (catálogo) — usa TU endpoint /api/calendar/staff-roles ===== */
  const [roles, setRoles] = useState<RoleLite[]>([]);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/calendar/staff-roles`, { cache: "no-store" });
        const json = await res.json();
        if (cancelled) return;
        const list: RoleLite[] = Array.isArray(json?.items)
          ? json.items.map((r: any) => ({ id: String(r.id), name: String(r.name) }))
          : [];
        setRoles(list);
      } catch {
        if (!cancelled) setRoles([]);
      }
    })();
    return () => { cancelled = true; };
  }, []); // globales/activos: basta cargar una vez

  /* ===== Header (Selects + Tabbar) ===== */
  const headerBand = (
    <div className="flex w-full flex-col gap-4">
      <Card className="border-0 shadow-none">
        <CardContent className="p-0">
          <div className="flex flex-wrap items-center gap-3">
            {/* Empresa */}
            <div className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border bg-white">
                <Building2 className="h-4 w-4" />
              </span>
              <Select
                value={selectedCompanyId ?? ""}
                onValueChange={(id) => {
                  setSavedCompanyId(id);
                  setSavedLocationId(null as any);
                  setSelectedCompanyId(id);
                  setLocations([]);
                  setLocationId("");
                }}
              >
                <SelectTrigger className="w-[260px]">
                  <SelectValue placeholder={"Selecciona empresa"} />
                </SelectTrigger>
                <SelectContent position="popper" className="z-50">
                  {companies.length === 0 && (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">Sin empresas</div>
                  )}
                  {companies.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                      <span className="ml-2 text-muted-foreground">({c.locationsCount ?? 0})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Ubicación */}
            <div className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border bg-white">
                <MapPin className="h-4 w-4" />
              </span>
              <Select
                value={locationId || ""}
                onValueChange={(v) => {
                  setLocationId(v);
                  setSavedLocationId(v);
                }}
                disabled={!selectedCompanyId || locationsLoading || !locations.length}
              >
                <SelectTrigger className="w-[260px]">
                  <SelectValue
                    placeholder={
                      !selectedCompanyId
                        ? "Selecciona una empresa"
                        : locationsLoading
                        ? "Cargando ubicaciones..."
                        : "Selecciona ubicación"
                    }
                  />
                </SelectTrigger>
                <SelectContent position="popper" className="z-50">
                  {locations.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabbar */}
      <HeaderTabs />
    </div>
  );

  /* =========================
     BODY — pestaña: Usuarios
     ========================= */
  const search = useSearchParams();
  const activeTab: TabKey = (search.get("tab") as TabKey) || "users";

  // Modal edición
  const [editOpen, setEditOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<{
    id: string;
    name: string;
    active: boolean;
    locationIds?: string[];
    roleIds?: string[];
    roleNames?: string[];
  } | null>(null);

  // Para refrescar la tabla tras guardar
  const [reloadCounter, setReloadCounter] = useState(0);

  const handleRowClick = (u: TableEmployeeRow) => {
    setEditingEmployee({
      id: u.id,
      name: u.name,
      active: u.active,
      // por ahora, asignamos la ubicación actual; si necesitas multi, podemos cargar del empleado
      locationIds: locationId ? [locationId] : [],
      roleIds: u.roleIds ?? [],
      roleNames: u.roleNames ?? [],
    });
    setEditOpen(true);
  };

return (
  <PageShell
    title="Usuarios y roles"
    description="Gestiona los usuarios de tu compañía, define roles y permisos, y envía invitaciones."
    breadcrumbs={[
      { label: "Dashboard", href: "/dashboard" },
      { label: "Usuarios y roles" },
    ]}
    actions={
      <Button size="sm" className="rounded-full">
        <MailPlus className="h-4 w-4 mr-2" />
        Invitar usuario
      </Button>
    }
    headerBand={headerBand}
    variant="default"
    backFallback="/dashboard"
    showShellBadge={true}
  >
    {activeTab === "users" ? (
      <>
        <UsersTableForLocation
          key={`${locationId}:${reloadCounter}`}
          locationId={locationId}
          disabled={!locationId}
          onRowClick={handleRowClick}
        />

        <EditEmployeeModal
          open={editOpen}
          onOpenChange={(v) => setEditOpen(v)}
          employee={editingEmployee ?? undefined}
          onSaved={() => {
            setEditOpen(false);
            setReloadCounter((x) => x + 1); // refresca la tabla
          }}
          availableLocations={locations.map((l) => ({ id: l.id, title: l.title }))}
          availableRoles={roles}
        />
      </>
    ) : activeTab === "roles" ? (
      <RolesTable
        companyId={selectedCompanyId ?? undefined}
        disabled={!selectedCompanyId}
        // onRowClick={(role) => { /* aquí abriremos modal de rol más adelante */ }}
      />
    ) : activeTab === "services" ? (
      <ServicesTable
        locationId={locationId}
        disabled={!locationId}
      />
    )
     : (
      <div className="text-sm text-muted-foreground">Selecciona una pestaña.</div>
    )}
  </PageShell>
);
}
