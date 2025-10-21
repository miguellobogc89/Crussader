"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import DataTable from "@/app/components/crussader/UX/table/DataTable";
import type { ColumnDef } from "@/app/components/crussader/UX/table/types";

// === Tipo de fila para la tabla de recursos ===
type ResourceRow = {
  id: string;
  name: string;
  typeName: string | null;
  locationName: string;     // siempre mostramos la ubicación
  capacity: number | null;
  tags: { name: string; color?: string | null }[];
  active: boolean;
};

export default function ResourcesTab({
  companyName,
  locationId,
  locations,
}: {
  companyName: string | null;
  locationId: string; // "all" o location concreta
  locations: { id: string; title: string }[];
}) {
  const [rows, setRows] = React.useState<ResourceRow[]>([]);
  const [loading, setLoading] = React.useState(false);

  const locNameById = React.useMemo(() => new Map(locations.map(l => [l.id, l.title])), [locations]);

  const adapt = React.useCallback((items: any[], locIdContext?: string): ResourceRow[] => {
    return (Array.isArray(items) ? items : []).map((r: any) => {
      const locId = String(r.locationId ?? locIdContext ?? "");
      const locationName = locNameById.get(locId) ?? r.locationName ?? locId;

      const typeName =
        r?.type?.name ??
        r?.typeName ??
        null;

      const tags: { name: string; color?: string | null }[] = Array.isArray(r?.tags)
        ? r.tags.map((t: any) => ({
            name: String(t?.name ?? t?.tag?.name ?? ""),
            color: t?.color ?? t?.tag?.color ?? null,
          })).filter((t: { name: string }) => t.name) // <-- tipado del parámetro del filter
        : [];

      return {
        id: String(r.id),
        name: String(r.name ?? ""),
        typeName,
        locationName,
        capacity: r.capacity != null ? Number(r.capacity) : null,
        tags,
        active: Boolean(r.active ?? true),
      };
    });
  }, [locNameById]);

  const fetchResources = React.useCallback(async () => {
    setLoading(true);
    try {
      if (locationId && locationId !== "all") {
        const res = await fetch(`/api/calendar/resources?locationId=${encodeURIComponent(locationId)}`, { cache: "no-store" });
        const json = await res.json();
        if (!res.ok || json?.error) { setRows([]); return; }
        setRows(adapt(json.items ?? [], locationId));
      } else {
        // all: agregamos recursos de todas las ubicaciones visibles
        const out: ResourceRow[] = [];
        for (const l of locations.filter((loc: { id: string; title: string }) => loc.id !== "all")) { // <-- aquí anotamos el tipo
          const res = await fetch(`/api/calendar/resources?locationId=${encodeURIComponent(l.id)}`, { cache: "no-store" });
          const json = await res.json();
          out.push(...adapt(json.items ?? [], l.id));
        }
        // orden por nombre para consistencia
        out.sort((a, b) => a.name.localeCompare(b.name));
        setRows(out);
      }
    } catch (e) {
      console.error("[ResourcesTab] fetch error", e);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [locationId, locations, adapt]);

  React.useEffect(() => { fetchResources(); }, [fetchResources]);

  // === Columnas DataTable ===
  const columns: ColumnDef<ResourceRow>[] = [
    {
      id: "name",
      label: "Nombre",
      widthPerc: 26,
      align: "left",
      sortable: true,
      filter: "text",
      accessor: (r) => r.name,
    },
    {
      id: "type",
      label: "Tipo",
      widthPerc: 18,
      align: "center",
      sortable: true,
      filter: "text",
      accessor: (r) => r.typeName ?? "",
      render: (r) =>
        r.typeName ? (
          <Badge variant="secondary" className="font-medium">{r.typeName}</Badge>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      id: "location",
      label: "Ubicación",
      widthPerc: 22,
      align: "center",
      sortable: true,
      filter: "text",
      accessor: (r) => r.locationName,
      render: (r) => (
        <span className="truncate whitespace-nowrap text-muted-foreground" title={r.locationName}>
          {r.locationName}
        </span>
      ),
    },
    {
      id: "capacity",
      label: "Capacidad",
      widthPerc: 10,
      align: "center",
      sortable: true,
      accessor: (r) => r.capacity ?? "",
      render: (r) => (r.capacity == null ? "—" : r.capacity),
    },
    {
      id: "tags",
      label: "Tags",
      widthPerc: 16,
      align: "center",
      sortable: false,
      filter: "text",
      accessor: (r) => r.tags.map(t => t.name).join(", "),
      render: (r) =>
        r.tags.length ? (
          <div className="flex flex-wrap items-center justify-center gap-1">
            {r.tags.map((t, i) => (
              <span
                key={`${r.id}-tag-${i}`}
                className="inline-flex items-center rounded-full px-2 py-0.5 text-xs"
                style={{
                  backgroundColor: t.color ?? "var(--muted)",
                  color: t.color ? "#fff" : "inherit",
                }}
                title={t.name}
              >
                {t.name}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-muted-foreground">—</span>
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
      <CardHeader>
        <CardTitle>
          Salas / Recursos — {companyName ?? "Empresa"}{locationId === "all" ? " (todas las ubicaciones)" : ""}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <DataTable<ResourceRow>
          columns={columns}
          rows={rows}
          rowKey={(r) => r.id}
          withActions={true}
          showGlobalSearch={true}
          searchPlaceholder="Buscar recurso…"
          getRowSearchText={(r) =>
            [r.name, r.typeName ?? "", r.locationName, r.capacity ?? "", ...r.tags.map(t => t.name), r.active ? "activo" : "inactivo"].join(" ")
          }
          className={loading ? "opacity-70 pointer-events-none" : undefined}
        />
      </CardContent>
    </Card>
  );
}
