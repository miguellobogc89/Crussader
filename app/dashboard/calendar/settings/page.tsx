"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import PageShell from "@/app/components/layouts/PageShell";
import { Button } from "@/app/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import TopToolbar, { type LocationRow } from "@/app/components/calendar/settings/TopToolbar";
import { type CompanyLite } from "@/app/components/calendar/settings/CompanyPicker";
import EmployeesTab from "@/app/components/calendar/settings/tabs/EmployeesTab";
import ResourcesTab from "@/app/components/calendar/settings/tabs/ResourcesTab";
import ServicesTab from "@/app/components/calendar/settings/tabs/ServicesTab";
import RulesTab from "@/app/components/calendar/settings/tabs/RulesTab";
import { Settings } from "lucide-react";
import { usePersistentSelection } from "@/hooks/usePersistentSelection";

/* =========================
   Página: Calendar Settings
   ========================= */
export default function CalendarSettingsPage() {
  // Persistencia
  const [savedCompanyId, setSavedCompanyId] = usePersistentSelection<string>("calendarSettings:companyId");
  const [savedLocationId, setSavedLocationId] = usePersistentSelection<string>("calendarSettings:locationId");

  // Empresas / selección
  const [companies, setCompanies] = useState<CompanyLite[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);

  // Ubicaciones / selección
  const [locations, setLocations] = useState<LocationRow[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(false);
  const [locationId, setLocationId] = useState<string>("");

  // Búsqueda global (para tabs que la usen)
  const [q, setQ] = useState("");

  const selectedCompany = useMemo(
    () => companies.find((c) => c.id === selectedCompanyId) ?? null,
    [companies, selectedCompanyId]
  );

  /* A) Cargar empresas */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/companies/accessible", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const list: CompanyLite[] = Array.isArray(json?.companies) ? json.companies : [];
        if (cancelled) return;
        setCompanies(list);
      } catch {
        if (!cancelled) setCompanies([{ id: "mock-1", name: "Mi Empresa", color: "#7C3AED" }]);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  /* B) Selección empresa */
  useEffect(() => {
    if (companies.length === 0) return;
    const exists = !!savedCompanyId && companies.some(c => c.id === savedCompanyId);
    const nextId = exists ? savedCompanyId! : companies[0]?.id ?? null;
    if (nextId && nextId !== selectedCompanyId) {
      setSelectedCompanyId(nextId);
      setSavedCompanyId(nextId);
    }
  }, [companies, savedCompanyId, selectedCompanyId, setSavedCompanyId]);

  /* C) Ubicaciones de empresa (+ "Todas") */
  useEffect(() => {
    let cancelled = false;
    if (!selectedCompanyId) { setLocations([]); setLocationId(""); return; }

    (async () => {
      try {
        setLocationsLoading(true);
        const res = await fetch(`/api/locations?companyId=${selectedCompanyId}`, { cache: "no-store" });
        const json = await res.json();
        if (cancelled) return;

        if (!res.ok || json?.ok === false) {
          setLocations([{ id: "all", title: "Todas" }]);
          return;
        }

        const rows: LocationRow[] = (Array.isArray(json?.locations) ? json.locations : []).map((l: any) => ({
          id: String(l.id), title: String(l.title ?? "Sin nombre"), city: l.city ?? null,
        }));
        setLocations([{ id: "all", title: "Todas" }, ...rows]);
      } catch {
        setLocations([{ id: "all", title: "Todas" }]);
      } finally {
        if (!cancelled) setLocationsLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [selectedCompanyId]);

  /* D) Fijar ubicación (persistida o "Todas") */
  useEffect(() => {
    if (locations.length === 0) return;
    const exists = !!savedLocationId && locations.some(l => l.id === savedLocationId);
    const fallback = locations.find(l => l.id === "all") ? "all" : locations[0].id;
    const next = exists ? savedLocationId! : fallback;
    if (next !== locationId) {
      setLocationId(next);
      setSavedLocationId(next);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locations]);

  const shellActions = (
    <div className="flex gap-2">
      <Button variant="outline" asChild>
        <Link href="/dashboard/calendar">Volver al calendario</Link>
      </Button>
      <Button className="hidden sm:inline-flex" disabled>
        <Settings className="h-4 w-4 mr-2" />
        Preferencias (pronto)
      </Button>
    </div>
  );

  return (
    <PageShell
      title={`Configuración — ${selectedCompany?.name ?? "Empresa"}`}
      description="Define empleados, salas/recursos, servicios y reglas de la agenda."
      toolbar={
        <TopToolbar
          companies={companies}
          selectedCompanyId={selectedCompanyId}
          onSelectCompany={(id) => {
            setSavedCompanyId(id);
            setSavedLocationId("all");
            setSelectedCompanyId(id);
            setLocationId("all");
            setQ("");
          }}
          locations={locations}
          locationsLoading={locationsLoading}
          locationId={locationId}
          onChangeLocation={(id) => { setLocationId(id); setSavedLocationId(id); }}
          q={q}
          onChangeQuery={setQ}
        />
      }
    >
      <div className="w-full">
        <Tabs defaultValue="employees" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="employees">Empleados</TabsTrigger>
            <TabsTrigger value="resources">Salas / Recursos</TabsTrigger>
            <TabsTrigger value="services">Servicios</TabsTrigger>
            <TabsTrigger value="rules">Reglas</TabsTrigger>
          </TabsList>

          <TabsContent value="employees">
            <EmployeesTab
              companyName={selectedCompany?.name ?? null}
              locationId={locationId}
              locations={locations}   // 👈 añade esta prop
            />
          </TabsContent>


          <TabsContent value="resources">
            <ResourcesTab
              companyName={selectedCompany?.name ?? null}
              locationId={locationId}
              locations={locations}
            />
          </TabsContent>

          <TabsContent value="services">
            <ServicesTab
              companyName={selectedCompany?.name ?? null}
              locationId={locationId}
              locations={locations}
            />
          </TabsContent>

          <TabsContent value="rules">
            <RulesTab />
          </TabsContent>
        </Tabs>
      </div>
    </PageShell>
  );
}
