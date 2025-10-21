"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Users } from "lucide-react";

import DataTable from "@/app/components/crussader/UX/table/DataTable";
import type { ColumnDef } from "@/app/components/crussader/UX/table/types";

/* === Tipo de fila para la tabla === */
type EmployeeRow = {
  id: string;
  name: string;
  roleName: string | null;
  roleColor: string | null;
  locations: string[];  // nombres de ubicaciones
  active: boolean;
};

export default function EmployeesTab({
  companyName,
  locationId,
  locations, // incluye "all" como opción
}: {
  companyName: string | null;
  locationId: string;
  locations: { id: string; title: string }[];
}) {
  const [rows, setRows] = React.useState<EmployeeRow[]>([]);
  const [loading, setLoading] = React.useState(false);

  const locNameById = React.useMemo(
    () => new Map(locations.map(l => [l.id, l.title])),
    [locations]
  );

  function parsePrimaryRole(e: any): { roleName: string | null; roleColor: string | null } {
    if (Array.isArray(e?.roles) && e.roles.length) {
      const primary = e.roles.find((r: any) => r?.isPrimary) ?? e.roles[0];
      return {
        roleName: primary?.role?.name ?? primary?.roleName ?? null,
        roleColor: primary?.role?.color ?? primary?.roleColor ?? null,
      };
    }
    if (e?.primaryRoleName) return { roleName: String(e.primaryRoleName), roleColor: e?.primaryRoleColor ?? null };
    if (e?.primary_role_name) return { roleName: String(e.primary_role_name), roleColor: e?.primary_role_color ?? null };
    return { roleName: null, roleColor: null };
  }

  const adapt = React.useCallback((items: any[], locIdForAll?: string): EmployeeRow[] => {
    return (Array.isArray(items) ? items : []).map((e: any) => {
      const { roleName, roleColor } = parsePrimaryRole(e);
      const locName = locIdForAll ? (locNameById.get(locIdForAll) ?? locIdForAll) : "";
      return {
        id: String(e.id),
        name: String(e.name ?? ""),
        active: Boolean(e.active),
        roleName,
        roleColor,
        locations: locIdForAll ? [locName] : (Array.isArray(e.locationNames) ? e.locationNames.map(String) : []),
      };
    });
  }, [locNameById]);

  const fetchEmployees = React.useCallback(async () => {
    setLoading(true);
    try {
      if (locationId && locationId !== "all") {
        const res = await fetch(`/api/calendar/employees?locationId=${encodeURIComponent(locationId)}`, { cache: "no-store" });
        const json = await res.json();
        if (!res.ok || json?.error) { setRows([]); return; }
        setRows(adapt(json.items ?? [], locationId));
      } else {
        // "all": merge de todas las ubicaciones
        const merged = new Map<string, EmployeeRow>();
        const locs = locations.filter(l => l.id !== "all");
        for (const l of locs) {
          const res = await fetch(`/api/calendar/employees?locationId=${encodeURIComponent(l.id)}`, { cache: "no-store" });
          const json = await res.json();
          const part = adapt(json?.items ?? [], l.id);
          for (const emp of part) {
            const prev = merged.get(emp.id);
            if (!prev) {
              merged.set(emp.id, emp);
            } else {
              merged.set(emp.id, {
                ...prev,
                // conserva rol ya definido o usa el nuevo si el previo es nulo/""
                roleName: prev.roleName || emp.roleName,
                roleColor: prev.roleColor || emp.roleColor,
                // une ubicaciones
                locations: Array.from(new Set([...(prev.locations ?? []), ...(emp.locations ?? [])])),
                active: prev.active || emp.active,
              });
            }
          }
        }
        setRows(Array.from(merged.values()).sort((a, b) => a.name.localeCompare(b.name)));
      }
    } catch (e) {
      console.error("[EmployeesTab] fetch error", e);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [locationId, locations, adapt]);

  React.useEffect(() => { fetchEmployees(); }, [fetchEmployees]);

  /* === Columnas para DataTable === */
  const columns: ColumnDef<EmployeeRow>[] = [
    {
      id: "name",
      label: "Nombre",
      widthPerc: 34,
      align: "left",
      sortable: true,
      filter: "text",
      accessor: (r) => r.name,
    },
    {
      id: "role",
      label: "Rol",
      widthPerc: 20,
      align: "center",
      sortable: true,
      filter: "text",
      accessor: (r) => r.roleName ?? "",
      render: (r) =>
        r.roleName ? (
          <span
            className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
            style={{
              backgroundColor: r.roleColor ?? "var(--muted)",
              color: r.roleColor ? "#fff" : "inherit",
            }}
          >
            {r.roleName}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      id: "locations",
      label: "Ubicaciones",
      widthPerc: 34,
      align: "center",
      sortable: true,
      filter: "text",
      accessor: (r) => r.locations.join(", "),
      render: (r) => (
        <span className="truncate whitespace-nowrap text-muted-foreground" title={r.locations.join(", ")}>
          {r.locations.length ? r.locations.join(", ") : "—"}
        </span>
      ),
    },
    {
      id: "active",
      label: "Estado",
      widthPerc: 8,
      align: "center",
      sortable: true,
      filter: "boolean",
      accessor: (r) => r.active,
      render: (r) => (r.active ? <Badge>Activo</Badge> : <Badge variant="secondary">Inactivo</Badge>),
    },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Empleados — {companyName ?? "Empresa"}
          {locationId === "all" ? " (todas las ubicaciones)" : ""}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <DataTable<EmployeeRow>
          columns={columns}
          rows={rows}
          rowKey={(r) => r.id}
          withActions={true}
          showGlobalSearch={true}
          searchPlaceholder="Buscar empleado…"
          getRowSearchText={(r) =>
            [r.name, r.roleName ?? "", r.locations.join(" "), r.active ? "activo" : "inactivo"].join(" ")
          }
          className={loading ? "opacity-70 pointer-events-none" : undefined}
        />
      </CardContent>
    </Card>
  );
}
