// app/components/calendar/ResourceView.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronsLeft } from "lucide-react";
import { Button } from "@/app/components/ui/button";

import EmployeeList, { type Employee } from "@/app/components/calendar/resources/EmployeeList";
import ResourceList, { type Resource } from "@/app/components/calendar/resources/ResourceList";

import { usePersistentSelection } from "@/hooks/usePersistentSelection";

type CompanyLite = { id: string; name: string; color?: string | null };
type LocationRow = { id: string; title: string; city?: string | null };

type Props = {
  listMaxHeight?: number;
};

export default function ResourceView({ listMaxHeight = 340 }: Props) {
  const [collapsed, setCollapsed] = useState(false);

  // ===== persistent company/location =====
  const [savedCompanyId, setSavedCompanyId] =
    usePersistentSelection<string>("calendar:companyId");
  const [savedLocationId, setSavedLocationId] =
    usePersistentSelection<string>("calendar:locationId");

  const [companies, setCompanies] = useState<CompanyLite[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);

  const [locations, setLocations] = useState<LocationRow[]>([]);
  const [locationId, setLocationId] = useState<string>("");

  // ===== data =====
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [empMsg, setEmpMsg] = useState("");
  const [resMsg, setResMsg] = useState("");

  // ===== selections =====
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [selectedResourceIds, setSelectedResourceIds] = useState<string[]>([]);

  // ===== companies =====
  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        const res = await fetch("/api/companies", {
          cache: "no-store",
          signal: ac.signal,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const list: CompanyLite[] = Array.isArray(json?.companies) ? json.companies : [];
        setCompanies(list);
      } catch {
        if (!ac.signal.aborted) {
          setCompanies([{ id: "mock-1", name: "Mi Empresa", color: "#7C3AED" }]);
        }
      }
    })();
    return () => ac.abort();
  }, []);

  // ===== pick company =====
  useEffect(() => {
    if (companies.length === 0) return;

    let nextId: string | null = null;

    if (savedCompanyId) {
      const exists = companies.some((c) => c.id === savedCompanyId);
      if (exists) nextId = savedCompanyId;
    }

    if (!nextId) {
      const first = companies[0];
      if (first) nextId = first.id;
    }

    if (nextId && nextId !== selectedCompanyId) {
      setSelectedCompanyId(nextId);
      setSavedCompanyId(nextId);
    }
  }, [companies, savedCompanyId, selectedCompanyId, setSavedCompanyId]);

  // ===== locations =====
  useEffect(() => {
    const ac = new AbortController();

    if (!selectedCompanyId) {
      setLocations([]);
      setLocationId("");
      return;
    }

    (async () => {
      try {
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
      }
    })();

    return () => ac.abort();
  }, [selectedCompanyId]);

  // ===== pick location =====
  useEffect(() => {
    if (locations.length === 0) {
      setLocationId("");
      return;
    }

    let next = "";
    if (savedLocationId) {
      const exists = locations.some((l) => l.id === savedLocationId);
      if (exists) next = savedLocationId;
    }
    if (!next) next = locations[0].id;

    if (next !== locationId) {
      setLocationId(next);
      setSavedLocationId(next);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locations]);

  // ===== fetch employees/resources when location changes =====
  useEffect(() => {
    if (!locationId) {
      setEmployees([]);
      setResources([]);
      setEmpMsg("Selecciona una ubicación");
      setResMsg("Selecciona una ubicación");
      return;
    }

    fetchEmployees(locationId);
    fetchResources(locationId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationId]);

  async function fetchEmployees(locId: string) {
    setEmpMsg("⏳ Cargando empleados…");
    try {
      const res = await fetch(
        `/api/calendar/employees?locationId=${encodeURIComponent(locId)}`,
        { cache: "no-store" }
      );
      const data = await res.json();
      if (!res.ok || data?.error) {
        setEmpMsg(`❌ ${data?.error || "Error"}`);
        setEmployees([]);
        return;
      }
      const list = Array.isArray(data.items) ? data.items : [];
      setEmployees(list);
      setEmpMsg("");
    } catch (e: any) {
      setEmpMsg(`❌ ${e.message}`);
      setEmployees([]);
    }
  }

  async function fetchResources(locId: string) {
    setResMsg("⏳ Cargando recursos…");
    try {
      const res = await fetch(
        `/api/calendar/resources?locationId=${encodeURIComponent(locId)}`,
        { cache: "no-store" }
      );
      const data = await res.json();
      if (!res.ok || data?.error) {
        setResMsg(`❌ ${data?.error || "Error"}`);
        setResources([]);
        return;
      }
      const list = Array.isArray(data.items) ? data.items : [];
      setResources(list);
      setResMsg("");
    } catch (e: any) {
      setResMsg(`❌ ${e.message}`);
      setResources([]);
    }
  }

  const anySelectedEmployees = useMemo(() => selectedEmployeeIds.length > 0, [selectedEmployeeIds]);
  const anySelectedResources = useMemo(() => selectedResourceIds.length > 0, [selectedResourceIds]);

  return (
    <aside
      className={[
        "relative flex h-full flex-col bg-white border border-border rounded-2xl transition-[width] ease-in-out",
        collapsed ? "w-[56px]" : "w-[300px]",
      ].join(" ")}
    >
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border px-3 py-2 rounded-t-2xl bg-white">
        <div className="flex items-center gap-2">
          {!collapsed ? <span className="text-sm font-semibold">Asignaciones</span> : null}
          {!collapsed && (anySelectedEmployees || anySelectedResources) ? (
            <span className="text-[11px] text-muted-foreground">Filtros activos</span>
          ) : null}
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed((v) => !v)}
          title={collapsed ? "Expandir panel" : "Colapsar panel"}
          className="shrink-0"
        >
          <ChevronsLeft
            className={[
              "h-4 w-4 transition-transform",
              collapsed ? "rotate-180" : "",
            ].join(" ")}
          />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-5 py-3 space-y-3">
        <EmployeeList
          collapsed={collapsed}
          items={employees}
          selectedIds={selectedEmployeeIds}
          statusText={empMsg}
          onToggle={(id) => {
            setSelectedEmployeeIds((prev) => {
              const has = prev.includes(id);
              if (has) return prev.filter((x) => x !== id);
              return [...prev, id];
            });
          }}
          maxHeight={listMaxHeight}
        />

        {!collapsed ? <div className="h-px bg-border" /> : null}

        <ResourceList
          collapsed={collapsed}
          items={resources}
          selectedIds={selectedResourceIds}
          statusText={resMsg}
          onToggle={(id) => {
            setSelectedResourceIds((prev) => {
              const has = prev.includes(id);
              if (has) return prev.filter((x) => x !== id);
              return [...prev, id];
            });
          }}
          maxHeight={listMaxHeight}
        />
      </div>
    </aside>
  );
}
